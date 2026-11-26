import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ConnectionBanner,
  CreateRoomForm,
  JoinRoomForm,
  Lobby,
  MatchBar,
  MatchOver,
  RoomInvite,
  RoomUnavailable,
  ServerErrorBanner,
} from '@/features/room'
import { RoundView } from '@/features/round'
import { HomePage } from '@/pages/HomePage'
import type { Round, RoomSnapshot } from '@/realtime/protocol'
import { useRoomStore } from '@/realtime/roomStore'
import { SendContext } from '@/realtime/sendContext'
import { Screen } from '@/shared/ui/Screen'
import { inMinutes, players, questionsTurn, round, snapshot, themes } from './fixtures'

// Dev-only screen catalog: /dev/gallery?screen=<name>. Renders every screen with fake room
// states so the UI can be reviewed (and screenshotted) without playing a match. It is only
// registered in development builds.

const roundScreen = (s: RoomSnapshot) => (
  <>
    <ConnectionBanner />
    <ServerErrorBanner />
    <MatchBar snapshot={s} />
    <RoundView snapshot={s} round={s.round as Round} />
  </>
)

const result = {
  impostorId: 'caio',
  impostorFound: true,
  secret: 'Lasanha',
  votes: [
    { voterId: 'ana', targetId: 'caio' },
    { voterId: 'bia', targetId: 'caio' },
    { voterId: 'caio', targetId: 'ana' },
    { voterId: 'duda', targetId: null },
  ],
  guess: { label: 'Pizza', correct: false },
  points: [
    { playerId: 'ana', points: 1 },
    { playerId: 'bia', points: 1 },
  ],
}

const screens: Record<string, () => ReactNode> = {
  home: () => <HomePage />,
  create: () => (
    <Screen kicker="Nova partida" title="Criar sala" subtitle="Você será o anfitrião.">
      <CreateRoomForm onCancel={() => undefined} />
    </Screen>
  ),
  join: () => (
    <Screen kicker="Já tem um código?" title="Entrar na sala">
      <JoinRoomForm initialCode="K7M2P" onCancel={() => undefined} />
    </Screen>
  ),
  connecting: () => (
    <Screen>
      <RoomInvite roomCode="K7M2P" />
    </Screen>
  ),
  'low-players': () =>
    roundScreen(
      snapshot(
        'ana',
        round({
          phase: 'theme_selection',
          themeName: null,
          themeOptions: themes,
          turns: [],
          totalTurns: 0,
        }),
        {
          role: null,
          players: players.map((p, i) => ({ ...p, isConnected: i < 2 })),
        },
      ),
    ),
  'lobby-host': () => <Lobby snapshot={snapshot('ana', null)} />,
  'lobby-guest': () => <Lobby snapshot={snapshot('bia', null, { players: players.slice(0, 2) })} />,
  'unavailable-404': () => (
    <RoomUnavailable roomCode="K7M2P" closeCode={4404} onRejoined={() => undefined} />
  ),
  'unavailable-401': () => (
    <RoomUnavailable roomCode="K7M2P" closeCode={4401} onRejoined={() => undefined} />
  ),
  'theme-host': () =>
    roundScreen(
      snapshot(
        'ana',
        round({
          phase: 'theme_selection',
          themeName: null,
          themeOptions: themes,
          turns: [],
          totalTurns: 0,
        }),
        { role: null },
      ),
    ),
  'theme-guest': () =>
    roundScreen(
      snapshot(
        'bia',
        round({ phase: 'theme_selection', themeName: null, turns: [], totalTurns: 0 }),
        { role: null },
      ),
    ),
  reveal: () => roundScreen(snapshot('bia', round({ phase: 'reveal', turns: [] }))),
  'reveal-waiting': () =>
    roundScreen(
      snapshot('ana', round({ phase: 'reveal', turns: [], confirmedIds: ['ana', 'caio'] })),
    ),
  'reveal-spectator': () =>
    roundScreen(snapshot('edu', round({ phase: 'reveal', turns: [] }), { role: null })),
  'questions-answerer': () => roundScreen(snapshot('caio', round({ turns: questionsTurn(1) }))),
  'questions-asker': () => roundScreen(snapshot('bia', round({ turns: questionsTurn(1) }))),
  'questions-host': () => roundScreen(snapshot('ana', round({ turns: questionsTurn(1) }))),
  'questions-last': () => roundScreen(snapshot('ana', round({ turns: questionsTurn(3) }))),
  discussion: () =>
    roundScreen(snapshot('ana', round({ phase: 'discussion', phaseDeadlineAt: inMinutes(2.4) }))),
  voting: () =>
    roundScreen(
      snapshot(
        'bia',
        round({ phase: 'voting', phaseDeadlineAt: inMinutes(4.5), votedIds: ['ana', 'duda'] }),
      ),
    ),
  'voting-voted': () =>
    roundScreen(
      snapshot(
        'bia',
        round({ phase: 'voting', phaseDeadlineAt: inMinutes(4), votedIds: ['ana', 'bia', 'duda'] }),
        { vote: 'caio' },
      ),
    ),
  'guess-impostor': () =>
    roundScreen(
      snapshot(
        'caio',
        round({
          phase: 'guess',
          phaseDeadlineAt: inMinutes(0.75),
          guessOptions: [
            'Pizza',
            'Lasanha',
            'Sushi',
            'Taco',
            'Feijoada',
            'Ramen',
            'Coxinha',
            'Pastel',
          ].map((label, i) => ({ id: String(i), label })),
        }),
        { role: 'impostor' },
      ),
    ),
  'guess-other': () =>
    roundScreen(snapshot('ana', round({ phase: 'guess', phaseDeadlineAt: inMinutes(0.75) }))),
  'result-found': () => roundScreen(snapshot('bia', round({ phase: 'result', result }))),
  'result-escaped-host': () =>
    roundScreen(
      snapshot(
        'ana',
        round({
          phase: 'result',
          number: 5,
          result: {
            ...result,
            impostorFound: false,
            guess: null,
            points: [{ playerId: 'caio', points: 2 }],
          },
        }),
      ),
    ),
  'podium-host': () => <MatchOver snapshot={snapshot('ana', null, { status: 'finished' })} />,
  'podium-guest': () => <MatchOver snapshot={snapshot('bia', null, { status: 'ended_early' })} />,
  'error-banner': () => roundScreen(snapshot('bia', round({ turns: questionsTurn(0) }))),
}

export function Gallery() {
  const [params] = useSearchParams()
  const name = params.get('screen')
  const screen = name ? screens[name] : undefined

  useEffect(() => {
    const store = useRoomStore.getState()
    store.reset()
    if (name === 'error-banner') store.reportError('not_your_turn')
    if (params.get('reconnecting')) store.setConnectionStatus('reconnecting')
  }, [name, params])

  if (!screen) {
    return (
      <Screen>
        <h1>Galeria</h1>
        <ul>
          {Object.keys(screens).map((key) => (
            <li key={key}>
              <Link to={`?screen=${key}`}>{key}</Link>
            </li>
          ))}
        </ul>
      </Screen>
    )
  }

  return <SendContext.Provider value={() => undefined}>{screen()}</SendContext.Provider>
}
