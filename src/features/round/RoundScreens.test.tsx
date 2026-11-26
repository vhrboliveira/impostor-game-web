import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ClientMessage, Round, RoomSnapshot, Turn } from '@/realtime/protocol'
import { SendContext } from '@/realtime/sendContext'
import { Countdown } from '@/shared/ui/Countdown'
import { look } from '@/test/look'
import { Discussion } from './Discussion'
import { Questions } from './Questions'
import { RoleReveal } from './RoleReveal'

const players = [
  { id: 'ana', name: 'Ana', isHost: true, isConnected: true, score: 0 },
  { id: 'bia', name: 'Bia', isHost: false, isConnected: true, score: 0 },
  { id: 'caio', name: 'Caio', isHost: false, isConnected: true, score: 0 },
]

function makeRound(overrides: Partial<Round>): Round {
  return {
    number: 1,
    phase: 'reveal',
    themeOptions: [],
    themeName: 'Comidas',
    totalTurns: 3,
    confirmedIds: [],
    phaseDeadlineAt: null,
    votedIds: [],
    guessOptions: [],
    turns: [],
    result: null,
    ...overrides,
  }
}

function makeSnapshot(
  me: string,
  round: Round,
  role: 'insider' | 'impostor' | null = 'insider',
): RoomSnapshot {
  return {
    roomCode: 'K7M2P',
    match: { status: 'in_progress', totalRounds: 3, roundNumber: round.number },
    players,
    round,
    me: {
      playerId: me,
      role,
      secret: role === 'insider' ? 'Pizza' : null,
      voteTargetId: null,
    },
  }
}

function renderWithSend(ui: React.ReactNode) {
  const send = vi.fn<(message: ClientMessage) => void>()
  render(<SendContext.Provider value={send}>{ui}</SendContext.Provider>)
  return send
}

function turn(position: number, askerId: string, answererId: string): Turn {
  return {
    position,
    askerId,
    answererId,
    question: `Pergunta ${position}?`,
    deadlineAt: new Date(Date.now() + 120_000).toISOString(),
  }
}

describe('RoleReveal', () => {
  it('asks the player to look before confirming', () => {
    const round = makeRound({})
    const send = renderWithSend(<RoleReveal snapshot={makeSnapshot('bia', round)} round={round} />)
    const entendi = screen.getByRole('button', { name: 'Entendi' })

    expect(screen.getByText('Tema: Comidas')).toBeInTheDocument()
    expect(entendi).toBeDisabled()

    const card = screen.getByRole('button', { name: 'Segure para ver' })
    fireEvent.pointerDown(card)
    expect(card).toHaveTextContent('Pizza')
    fireEvent.pointerUp(card)
    expect(card).toHaveTextContent('Segure para ver')

    fireEvent.click(entendi)
    expect(send).toHaveBeenCalledWith({ type: 'confirm_reveal' })
    expect(screen.queryByRole('button', { name: 'Começar sem esperar' })).not.toBeInTheDocument()
  })

  it('shows the same card to the impostor while held, colors included', () => {
    const round = makeRound({})
    const [insider, impostor] = (['insider', 'impostor'] as const).map((role) => {
      renderWithSend(<RoleReveal snapshot={makeSnapshot('caio', round, role)} round={round} />)
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Segure para ver' }))
      const markup = look(screen.getByRole('button', { name: /Segure para ver|Você é|Pizza/ }))
      cleanup()
      return markup
    })
    expect(impostor).toBe(insider)
  })

  it('shows the impostor card without a secret', () => {
    const round = makeRound({})
    renderWithSend(<RoleReveal snapshot={makeSnapshot('caio', round, 'impostor')} round={round} />)

    const card = screen.getByRole('button', { name: 'Segure para ver' })
    fireEvent.pointerDown(card)
    expect(card).toHaveTextContent('Você é o impostor!')
  })

  it('waits for the others after confirming, and the host can start anyway', () => {
    const round = makeRound({ confirmedIds: ['ana'] })
    const send = renderWithSend(<RoleReveal snapshot={makeSnapshot('ana', round)} round={round} />)

    expect(screen.getByRole('status')).toHaveTextContent('Aguardando os outros (1/3 prontos)')
    fireEvent.click(screen.getByRole('button', { name: 'Começar sem esperar' }))
    expect(send).toHaveBeenCalledWith({ type: 'start_questions' })
  })

  it('tells a player outside the round to wait for the next one', () => {
    const round = makeRound({})
    renderWithSend(<RoleReveal snapshot={makeSnapshot('bia', round, null)} round={round} />)

    expect(screen.getByText(/Você entra na próxima/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Entendi' })).not.toBeInTheDocument()
  })
})

describe('Questions', () => {
  const firstTurn = makeRound({ phase: 'questions', turns: [turn(0, 'ana', 'bia')] })
  const lastTurn = makeRound({
    phase: 'questions',
    turns: [turn(0, 'ana', 'bia'), turn(1, 'bia', 'caio'), turn(2, 'caio', 'ana')],
  })

  it('lets the answerer move on', () => {
    const send = renderWithSend(
      <Questions snapshot={makeSnapshot('bia', firstTurn)} round={firstTurn} />,
    )

    expect(screen.getByText('Pergunta 0?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tocar um som' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Prosseguir' }))
    expect(send).toHaveBeenCalledWith({ type: 'next_turn' })
    fireEvent.click(screen.getByRole('button', { name: '+1 min' }))
    expect(send).toHaveBeenCalledWith({ type: 'extend_turn' })
  })

  it('offers the discussion on the last turn', () => {
    renderWithSend(<Questions snapshot={makeSnapshot('ana', lastTurn)} round={lastTurn} />)

    expect(screen.getByRole('button', { name: 'Ir para a discussão' })).toBeInTheDocument()
  })

  it('lets the host skip a turn and hides the buttons from everyone else', () => {
    renderWithSend(<Questions snapshot={makeSnapshot('ana', firstTurn)} round={firstTurn} />)
    expect(screen.getByRole('button', { name: 'Pular turno' })).toBeInTheDocument()
  })

  it('shows no action to a player who is neither answering nor hosting', () => {
    renderWithSend(<Questions snapshot={makeSnapshot('caio', firstTurn)} round={firstTurn} />)
    expect(screen.queryByRole('button', { name: /Prosseguir|Pular/ })).not.toBeInTheDocument()
  })
})

describe('Discussion', () => {
  const round = makeRound({
    phase: 'discussion',
    phaseDeadlineAt: new Date(Date.now() + 180_000).toISOString(),
    turns: [turn(0, 'ana', 'bia'), turn(1, 'bia', 'caio'), turn(2, 'caio', 'ana')],
  })

  it('shows the timer and lets the host add a minute or start the voting', () => {
    const send = renderWithSend(<Discussion snapshot={makeSnapshot('ana', round)} round={round} />)

    expect(screen.getByRole('timer')).toHaveTextContent(/^[23]:\d\d$/)
    expect(screen.getByRole('button', { name: 'Tocar um som' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+1 min' }))
    expect(send).toHaveBeenCalledWith({ type: 'extend_discussion' })
    fireEvent.click(screen.getByRole('button', { name: 'Ir para a votação' }))
    expect(send).toHaveBeenCalledWith({ type: 'start_voting' })
  })

  it('hides the host buttons from the other players', () => {
    renderWithSend(<Discussion snapshot={makeSnapshot('bia', round)} round={round} />)
    expect(screen.queryByRole('button', { name: 'Ir para a votação' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+1 min' })).not.toBeInTheDocument()
  })
})

describe('Countdown', () => {
  it('warns in the last 30 seconds', () => {
    const { rerender } = render(
      <Countdown deadlineAt={new Date(Date.now() + 90_000).toISOString()} />,
    )
    expect(screen.getByRole('timer').parentElement).not.toHaveAttribute('data-warning')

    rerender(<Countdown deadlineAt={new Date(Date.now() + 20_000).toISOString()} />)
    expect(screen.getByRole('timer').parentElement).toHaveAttribute('data-warning', 'true')
  })
})
