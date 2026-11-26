import type { Player, Round, RoomSnapshot, Turn } from '@/realtime/protocol'

// Fake room states for the dev gallery. Never imported by production code.

// Stand-ins for player photos (a head and shoulders on a colored backdrop), so the gallery shows
// photos and initials side by side without a backend.
function fakePhoto(background: string, skin: string, shirt: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${background}"/>
    <circle cx="50" cy="40" r="19" fill="${skin}"/>
    <path d="M14 100c2-22 17-33 36-33s34 11 36 33z" fill="${shirt}"/>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const players: Player[] = [
  {
    id: 'ana',
    name: 'Ana',
    isHost: true,
    isConnected: true,
    score: 4,
    avatarUrl: fakePhoto('#f6c453', '#8d5a3b', '#2f6fdf'),
  },
  { id: 'bia', name: 'Bia', isHost: false, isConnected: true, score: 3 },
  {
    id: 'caio',
    name: 'Caio',
    isHost: false,
    isConnected: true,
    score: 3,
    avatarUrl: fakePhoto('#7fd1b9', '#f1c7a5', '#d6453d'),
  },
  { id: 'duda', name: 'Duda Fernandes', isHost: false, isConnected: true, score: 1 },
  { id: 'edu', name: 'Edu', isHost: false, isConnected: false, score: 0 },
]

const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString()

export const ring: Turn[] = [
  {
    position: 0,
    askerId: 'ana',
    answererId: 'bia',
    question: 'Você comeria isso no café da manhã?',
    deadlineAt: null,
  },
  {
    position: 1,
    askerId: 'bia',
    answererId: 'caio',
    question: 'Isso combina mais com verão ou com inverno?',
    deadlineAt: null,
  },
  {
    position: 2,
    askerId: 'caio',
    answererId: 'duda',
    question: 'Quanto você pagaria por isso num restaurante?',
    deadlineAt: null,
  },
  {
    position: 3,
    askerId: 'duda',
    answererId: 'ana',
    question: 'Você levaria isso para uma viagem longa?',
    deadlineAt: null,
  },
]

export function round(overrides: Partial<Round> = {}): Round {
  return {
    number: 2,
    phase: 'questions',
    themeOptions: [],
    themeName: 'Comidas',
    totalTurns: ring.length,
    confirmedIds: [],
    phaseDeadlineAt: null,
    votedIds: [],
    guessOptions: [],
    turns: ring,
    result: null,
    ...overrides,
  }
}

export function snapshot(
  me: string,
  roundState: Round | null,
  options: {
    role?: 'insider' | 'impostor' | null
    vote?: string | null
    status?: RoomSnapshot['match']['status']
    players?: Player[]
  } = {},
): RoomSnapshot {
  const role = options.role === undefined ? 'insider' : options.role
  return {
    roomCode: 'K7M2P',
    match: {
      status: options.status ?? (roundState ? 'in_progress' : 'lobby'),
      totalRounds: 5,
      roundNumber: roundState?.number ?? 0,
    },
    players: options.players ?? players,
    round: roundState,
    me: {
      playerId: me,
      role,
      secret: role === 'insider' ? 'Lasanha' : null,
      voteTargetId: options.vote ?? null,
    },
  }
}

export const themes = [
  { id: 1, name: 'Comidas' },
  { id: 2, name: 'Animais' },
  { id: 3, name: 'Lugares' },
  { id: 4, name: 'Profissões' },
  { id: 5, name: 'Pessoas da sala' },
  { id: 6, name: 'Filmes' },
]

export const questionsTurn = (index: number): Turn[] =>
  ring
    .slice(0, index + 1)
    .map((turn, i) => (i === index ? { ...turn, deadlineAt: inMinutes(2.5) } : turn))

export { inMinutes }
