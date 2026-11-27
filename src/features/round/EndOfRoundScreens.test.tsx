import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MatchOver } from '@/features/room/MatchOver'
import { rankPlayers } from '@/features/scoreboard'
import type { ClientMessage, Round, RoomSnapshot, Turn } from '@/realtime/protocol'
import { SendContext } from '@/realtime/sendContext'
import { Guess } from './Guess'
import { RoundResult } from './RoundResult'
import { Voting } from './Voting'

const players = [
  { id: 'ana', name: 'Ana', isHost: true, isConnected: true, score: 2 },
  { id: 'bia', name: 'Bia', isHost: false, isConnected: true, score: 1 },
  { id: 'caio', name: 'Caio', isHost: false, isConnected: true, score: 1 },
  { id: 'duda', name: 'Duda', isHost: false, isConnected: true, score: 0 },
]

const ring: Turn[] = [
  { position: 0, askerId: 'ana', answererId: 'bia', question: 'P0?', deadlineAt: null },
  { position: 1, askerId: 'bia', answererId: 'caio', question: 'P1?', deadlineAt: null },
  { position: 2, askerId: 'caio', answererId: 'ana', question: 'P2?', deadlineAt: null },
]

function makeRound(overrides: Partial<Round>): Round {
  return {
    number: 1,
    phase: 'voting',
    themeOptions: [],
    themeName: 'Comidas',
    totalTurns: 3,
    confirmedIds: [],
    phaseDeadlineAt: new Date(Date.now() + 60_000).toISOString(),
    votedIds: [],
    guessOptions: [],
    turns: ring,
    result: null,
    ...overrides,
  }
}

function makeSnapshot(
  me: string,
  round: Round | null,
  options: {
    role?: 'insider' | 'impostor' | null
    vote?: string | null
    status?: RoomSnapshot['match']['status']
  } = {},
): RoomSnapshot {
  const role = options.role === undefined ? 'insider' : options.role
  return {
    roomCode: 'K7M2P',
    match: {
      status: options.status ?? 'in_progress',
      totalRounds: 3,
      roundNumber: round?.number ?? 0,
    },
    players,
    round,
    me: {
      playerId: me,
      role,
      secret: role === 'insider' ? 'Pizza' : null,
      voteTargetId: options.vote ?? null,
    },
  }
}

function renderWithSend(ui: React.ReactNode) {
  const send = vi.fn<(message: ClientMessage) => void>()
  render(<SendContext.Provider value={send}>{ui}</SendContext.Provider>)
  return send
}

describe('Voting', () => {
  it('lists the other players of the round and sends the vote', () => {
    const round = makeRound({ votedIds: ['caio'] })
    const send = renderWithSend(<Voting snapshot={makeSnapshot('bia', round)} round={round} />)

    expect(screen.getByRole('button', { name: 'Ana' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Caio' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bia' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Duda' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1/3 votaram')

    const confirm = screen.getByRole('button', { name: 'Confirmar voto' })
    expect(confirm).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Caio' }))
    expect(send).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Caio' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(confirm)
    expect(send).toHaveBeenCalledWith({ type: 'vote', payload: { targetId: 'caio' } })
  })

  it('plays the vote sound when confirming', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    play.mockClear()
    const round = makeRound({})
    renderWithSend(<Voting snapshot={makeSnapshot('bia', round)} round={round} />)

    fireEvent.click(screen.getByRole('button', { name: 'Caio' }))
    expect(play).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar voto' }))
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('lets the player change a confirmed vote', () => {
    const round = makeRound({ votedIds: ['bia'] })
    const send = renderWithSend(
      <Voting snapshot={makeSnapshot('bia', round, { vote: 'caio' })} round={round} />,
    )

    expect(screen.getByRole('button', { name: 'Caio' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Seu voto: Caio')
    const change = screen.getByRole('button', { name: 'Mudar voto' })
    expect(change).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Ana' }))
    fireEvent.click(change)
    expect(send).toHaveBeenCalledWith({ type: 'vote', payload: { targetId: 'ana' } })
  })

  it('lets a player outside the round only watch', () => {
    const round = makeRound({})
    renderWithSend(<Voting snapshot={makeSnapshot('duda', round, { role: null })} round={round} />)

    expect(screen.getByText(/Você entra na próxima rodada/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('Guess', () => {
  const round = makeRound({
    phase: 'guess',
    guessOptions: [
      { id: '11', label: 'Pizza' },
      { id: '12', label: 'Sushi' },
    ],
  })

  it('lets the impostor pick an option', () => {
    const send = renderWithSend(
      <Guess snapshot={makeSnapshot('caio', round, { role: 'impostor' })} round={round} />,
    )

    expect(screen.getByRole('timer')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sushi' }))
    expect(send).toHaveBeenCalledWith({ type: 'guess', payload: { optionId: '12' } })
  })

  it('shows the others that the impostor is guessing', () => {
    renderWithSend(<Guess snapshot={makeSnapshot('ana', round)} round={round} />)

    expect(screen.getByText('O impostor foi descoberto!')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('RoundResult', () => {
  const result: NonNullable<Round['result']> = {
    impostorId: 'caio',
    impostorFound: true,
    secret: 'Pizza',
    votes: [
      { voterId: 'ana', targetId: 'caio' },
      { voterId: 'bia', targetId: null },
      { voterId: 'caio', targetId: 'ana' },
    ],
    guess: { label: 'Sushi', correct: false },
    points: [{ playerId: 'ana', points: 1 }],
  }

  it('reveals the impostor, the secret, the votes and the points', () => {
    const round = makeRound({ phase: 'result', result })
    renderWithSend(<RoundResult snapshot={makeSnapshot('bia', round)} round={round} />)

    // The reveal comes first; the votes would give it away.
    expect(screen.getByText('Quem era o impostor?')).toBeInTheDocument()
    expect(screen.queryByText('Ana votou em Caio')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Pular' }))

    expect(screen.getByText('O impostor era')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'O impostor foi descoberto!' })).toBeInTheDocument()
    expect(screen.getByText('Caio', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('Pizza', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('Ele chutou "Sushi" e errou.')).toBeInTheDocument()
    expect(screen.getByText('Ana votou em Caio')).toBeInTheDocument()
    expect(screen.getByText('Bia não votou')).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Pontos da rodada' })).getByRole('listitem'),
    ).toHaveTextContent('Ana +1')
    expect(screen.getByText('Aguardando o anfitrião…')).toBeInTheDocument()
  })

  it('lets the host start the next round, or see the podium after the last one', () => {
    const round = makeRound({ phase: 'result', result })
    const send = renderWithSend(<RoundResult snapshot={makeSnapshot('ana', round)} round={round} />)
    fireEvent.click(screen.getByRole('button', { name: 'Próxima rodada' }))
    expect(send).toHaveBeenCalledWith({ type: 'next_round' })
  })

  it('reads "Ver pódio" on the last round', () => {
    const round = makeRound({ phase: 'result', number: 3, result })
    renderWithSend(<RoundResult snapshot={makeSnapshot('ana', round)} round={round} />)
    expect(screen.getByRole('button', { name: 'Ver pódio' })).toBeInTheDocument()
  })

  it('says when the impostor escaped or ran out of time', () => {
    const escaped = makeRound({
      phase: 'result',
      result: { ...result, impostorFound: false, guess: null },
    })
    const { unmount } = render(
      <SendContext.Provider value={vi.fn()}>
        <RoundResult snapshot={makeSnapshot('bia', escaped)} round={escaped} />
      </SendContext.Provider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Pular' }))
    expect(screen.getByRole('heading', { name: 'O impostor escapou!' })).toBeInTheDocument()
    unmount()

    const timedOut = makeRound({
      phase: 'result',
      result: { ...result, guess: { label: null, correct: false } },
    })
    renderWithSend(<RoundResult snapshot={makeSnapshot('bia', timedOut)} round={timedOut} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pular' }))
    expect(screen.getByText('O tempo acabou sem palpite.')).toBeInTheDocument()
  })
})

describe('RoundResult reveal', () => {
  const result: NonNullable<Round['result']> = {
    impostorId: 'caio',
    impostorFound: false,
    secret: 'Pizza',
    votes: [],
    guess: null,
    points: [],
  }

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('runs the spotlight over the players and stops on the impostor', () => {
    vi.useFakeTimers()
    const round = makeRound({ phase: 'result', result })
    renderWithSend(<RoundResult snapshot={makeSnapshot('bia', round)} round={round} />)
    expect(screen.queryByRole('heading', { name: 'O impostor escapou!' })).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(screen.getByText('O impostor era')).toBeInTheDocument()
    expect(screen.getByText('Caio', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'O impostor escapou!' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pular' })).not.toBeInTheDocument()
  })

  it('shows the impostor right away with reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: query.includes('reduce'), media: query })),
    )
    const round = makeRound({ phase: 'result', result })
    renderWithSend(<RoundResult snapshot={makeSnapshot('bia', round)} round={round} />)

    expect(screen.getByRole('heading', { name: 'O impostor escapou!' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pular' })).not.toBeInTheDocument()
  })
})

describe('MatchOver', () => {
  it('shows the podium and lets the host play again with another number of rounds', () => {
    const send = renderWithSend(
      <MatchOver snapshot={makeSnapshot('ana', null, { status: 'finished' })} />,
    )

    expect(screen.getByRole('heading', { name: 'Fim de jogo' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Pódio' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '8' }))
    fireEvent.click(screen.getByRole('button', { name: 'Jogar de novo' }))
    expect(send).toHaveBeenCalledWith({ type: 'play_again', payload: { totalRounds: 8 } })
  })

  it('makes the other players wait', () => {
    renderWithSend(<MatchOver snapshot={makeSnapshot('bia', null, { status: 'ended_early' })} />)

    expect(screen.getByRole('heading', { name: 'Partida encerrada' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Jogar de novo' })).not.toBeInTheDocument()
  })
})

describe('rankPlayers without who left', () => {
  it('leaves them out of the scoreboard and the podium', () => {
    const ranked = rankPlayers([
      { id: 'a', name: 'Ana', isHost: true, isConnected: true, score: 1 },
      { id: 'b', name: 'Bia', isHost: false, isConnected: false, score: 9, hasLeft: true },
    ])
    expect(ranked.map((r) => r.player.name)).toEqual(['Ana'])
  })
})

describe('rankPlayers', () => {
  it('gives tied players the same position', () => {
    expect(rankPlayers(players).map((r) => [r.player.name, r.position])).toEqual([
      ['Ana', 1],
      ['Bia', 2],
      ['Caio', 2],
      ['Duda', 4],
    ])
  })
})
