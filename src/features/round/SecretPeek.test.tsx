import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Phase, Round, RoomSnapshot } from '@/realtime/protocol'
import { SendContext } from '@/realtime/sendContext'
import { look } from '@/test/look'
import { RoundView } from './RoundView'
import { SecretPeek } from './SecretPeek'

const ring = [
  { position: 0, askerId: 'ana', answererId: 'bia', question: 'P0?', deadlineAt: null },
  { position: 1, askerId: 'bia', answererId: 'caio', question: 'P1?', deadlineAt: null },
  { position: 2, askerId: 'caio', answererId: 'ana', question: 'P2?', deadlineAt: null },
]

function makeRound(phase: Phase): Round {
  return {
    number: 1,
    phase,
    themeOptions: [],
    themeName: 'Comidas',
    totalTurns: 3,
    confirmedIds: [],
    phaseDeadlineAt: null,
    votedIds: [],
    guessOptions: [],
    turns: phase === 'questions' ? ring.slice(0, 1) : ring,
    result:
      phase === 'result'
        ? {
            impostorId: 'caio',
            impostorFound: false,
            secret: 'Pizza',
            votes: [],
            guess: null,
            points: [],
          }
        : null,
  }
}

function makeSnapshot(
  role: 'insider' | 'impostor' | null,
  phase: Phase = 'questions',
): RoomSnapshot {
  const round = makeRound(phase)
  return {
    roomCode: 'K7M2P',
    match: { status: 'in_progress', totalRounds: 3, roundNumber: 1 },
    players: [
      { id: 'ana', name: 'Ana', isHost: true, isConnected: true, score: 0 },
      { id: 'bia', name: 'Bia', isHost: false, isConnected: true, score: 0 },
      { id: 'caio', name: 'Caio', isHost: false, isConnected: true, score: 0 },
    ],
    round,
    me: {
      playerId: 'bia',
      role,
      secret: role === 'insider' ? 'Pizza' : null,
      voteTargetId: null,
    },
  }
}

const peekButton = () => screen.getByRole('button', { name: /Segure para lembrar|Pizza|impostor/ })

describe('SecretPeek', () => {
  it('looks the same for the impostor while held, colors included', () => {
    const [insider, impostor] = (['insider', 'impostor'] as const).map((role) => {
      const { unmount } = render(<SecretPeek snapshot={makeSnapshot(role)} />)
      fireEvent.pointerDown(peekButton())
      const markup = look(peekButton())
      unmount()
      return markup
    })
    expect(impostor).toBe(insider)
  })

  it('shows the secret only while held', () => {
    render(<SecretPeek snapshot={makeSnapshot('insider')} />)
    const button = peekButton()

    expect(button).toHaveTextContent('Segure para lembrar')
    expect(screen.queryByText('Pizza')).not.toBeInTheDocument()

    fireEvent.pointerDown(button)
    expect(button).toHaveTextContent('Pizza')
    fireEvent.pointerUp(button)
    expect(button).toHaveTextContent('Segure para lembrar')

    fireEvent.pointerDown(button)
    fireEvent.pointerLeave(button)
    expect(button).toHaveTextContent('Segure para lembrar', { normalizeWhitespace: true })
  })

  it('works with the keyboard and hides when the app goes to the background', () => {
    render(<SecretPeek snapshot={makeSnapshot('insider')} />)
    const button = peekButton()

    fireEvent.keyDown(button, { key: ' ' })
    expect(button).toHaveTextContent('Pizza')
    fireEvent.keyUp(button, { key: ' ' })
    expect(button).toHaveTextContent('Segure para lembrar')

    fireEvent.pointerDown(button)
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    visibility.mockRestore()
    expect(button).toHaveTextContent('Segure para lembrar')
  })

  it('looks the same for the impostor, who sees only their role', () => {
    const { unmount } = render(<SecretPeek snapshot={makeSnapshot('insider')} />)
    const insiderLabel = peekButton().getAttribute('aria-label')
    unmount()

    render(<SecretPeek snapshot={makeSnapshot('impostor')} />)
    const button = peekButton()
    expect(button.getAttribute('aria-label')).toBe(insiderLabel)
    expect(button).toHaveTextContent('Segure para lembrar')

    fireEvent.pointerDown(button)
    expect(button).toHaveTextContent('Você é o impostor!')
  })
})

describe('RoundView', () => {
  function renderRound(snapshot: RoomSnapshot) {
    render(
      <SendContext.Provider value={vi.fn()}>
        <RoundView snapshot={snapshot} round={snapshot.round as Round} />
      </SendContext.Provider>,
    )
  }

  it.each(['questions', 'discussion', 'voting', 'guess'] as const)(
    'offers the reminder during the %s',
    (phase) => {
      renderRound(makeSnapshot('insider', phase))
      expect(
        screen.getByRole('button', { name: 'Segure para lembrar seu papel' }),
      ).toBeInTheDocument()
    },
  )

  it.each(['theme_selection', 'reveal', 'result'] as const)(
    'has no reminder in the %s',
    (phase) => {
      renderRound(makeSnapshot('insider', phase))
      expect(
        screen.queryByRole('button', { name: 'Segure para lembrar seu papel' }),
      ).not.toBeInTheDocument()
    },
  )

  it('has no reminder for a player outside the round', () => {
    renderRound(makeSnapshot(null, 'questions'))
    expect(
      screen.queryByRole('button', { name: 'Segure para lembrar seu papel' }),
    ).not.toBeInTheDocument()
  })
})
