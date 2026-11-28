# Party game web (PWA)

Mobile-first PWA for an in-person party game: everyone plays on their own phone, all in the same room.
Players see a secret word, except one (the impostor). Questions are asked and answered out loud;
the app shows who asks whom, keeps a per-round history and handles votes and scoring.

The game rules live in the API repository (`impostor-game`): `docs/specification.md` (Portuguese).
Decisions shared by both sides are in that repository's `AGENTS.md`.

## Language conventions

- **Everything related to code is in English**: identifiers, comments, commit messages, file names,
  REST endpoints (`/api/room`), WebSocket paths and message types.
- **Only text shown to players is in Portuguese (pt-BR)**.

## Requirements

- Node.js >= 20.19
- pnpm (the lockfile is `pnpm-lock.yaml`)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # optional: the dev proxy already targets localhost:8080
pnpm dev
```

The dev server proxies `/api` and `/ws` to the Go backend at `http://localhost:8080`. Start the
API first (in the API repository: `make db-up`, `make migrate-up`, `make seed`, `make dev`).

### TypeScript 7 and the linter

`tsc` is TypeScript 7 (native), but TypeScript 7.0 ships no JavaScript API and typescript-eslint
needs one. Following the TypeScript 7 announcement, `package.json` installs both side by side:

```json
"@typescript/native": "npm:typescript@^7.0.2",
"typescript": "npm:@typescript/typescript6@^6.0.2"
```

`pnpm typecheck` / `pnpm build` run `tsc` from TypeScript 7; typescript-eslint imports
`typescript` and gets the 6.0 API. Drop the alias once typescript-eslint supports TypeScript 7.1+.

## Scripts

| Script           | What it does                                                        |
| ---------------- | ------------------------------------------------------------------- |
| `pnpm dev`       | Vite dev server                                                     |
| `pnpm build`     | Type-check and production build (also generates the service worker) |
| `pnpm preview`   | Serves the production build locally                                 |
| `pnpm typecheck` | TypeScript project check                                            |
| `pnpm lint`      | ESLint                                                              |
| `pnpm format`    | Prettier                                                            |
| `pnpm test`      | Vitest (single run)                                                 |

## Stack

React + TypeScript (strict) + Vite, React Router, Zustand, Zod, CSS Modules with design tokens,
`vite-plugin-pwa`, Vitest + Testing Library.

## Architecture

```
src/
  app/          providers, router, root layout
  pages/        Home, Room, NotFound (compose features, hold no business logic)
  features/
    room/       create/join forms, lobby, host controls, connection banner
    round/      one component per phase + the phase switch
    history/    per-player history cursor, turn card, history viewer
    scoreboard/ scoreboard / podium
  realtime/     protocol (types + zod), socket client, room store, session, send and session contexts
  shared/       ui kit, config (env, endpoints, game rules), lib
  styles/       tokens, reset, globals
  pwa/          service worker registration, update prompt, cache routes, build CSP
  dev/          screen gallery with fixtures (dev builds only)
```

Dependency rules:

- Direction: `app -> pages -> features -> shared`. `realtime` is infrastructure used by features.
- `shared` never imports from `features`, `pages` or `realtime`.
- A feature may import another feature only through its `index.ts`, and never in a cycle
  (today: `round -> history`, `round -> scoreboard`, `room -> scoreboard`).

Principles:

- **The UI is a function of server state.** The room screen picks a component from `round.phase`.
  Actions are commands sent over the socket (`vote`, `next_turn`...). No game rule runs on the client.
- **Server state vs local UI state.** Server state lives in `useRoomStore`; purely local state
  (history cursor, confirmation steps) stays in components and hooks.
- **Resilience.** On every (re)connection the server sends a full snapshot. The socket client
  reconnects with backoff and verifies the connection when the app returns to the foreground
  (iOS suspends sockets in the background).
- **Secrets stay on the server.** The snapshot only carries the current player's secret and only
  turns up to the current one.
- **Messages are validated** with Zod before touching the store.

## UI system

The app is a mobile-first game UI: one column, thumb-reachable actions, big type (base 17px).

- **Tokens** (`styles/tokens.css`): palette and semantic colors (`--color-*`), gradients, spacing
  (`--space-1..8`, `--gutter`), radii, shadows/glows, type scale (`--text-xs..display`), tap sizes
  (`--tap-size`, `--tap-size-lg`), easing and durations, safe-area insets. Components never use
  raw values when a token exists.
- **One layout for every screen**: `shared/ui/Screen` renders a header (`kicker`, `title`,
  `subtitle`, and an `aside` for the countdown and the sound button: kicker and aside share the
  first row, the title takes the whole width below), the body, and a `footer` pinned to the bottom
  (sticky, solid background with a fade above it) for the screen's actions. `centered` is used for
  waiting/empty states.
- **Kit** (`shared/ui`): `Button` (variants, `size="lg"` for main actions, `icon`), `Choice`
  (selectable row or tile, `aria-pressed`), `Avatar` (initials, color derived from the name),
  `PlayerRow`, `Panel`, `Badge`, `ProgressBar`, `Countdown` (pill; pulses in the last 30 s),
  `EmptyState`, `WaitingDots`, `Icon` (inline SVG set) and `ActionRow.module.css` (main action plus
  a short side action that wraps to its own row when the label is long).
- **In a match** every phase sits under `MatchBar` (round counter, theme, host's "Encerrar"), and
  the hold-to-see button (`SecretPeek`) stays available in every phase after the reveal.
- **Hold-to-see without layout shift**: both faces of the secret are stacked in the same grid
  cell and only `opacity`/`transform` change, so the button never moves or resizes while held.
- **Impostor reveal** (`features/round/ImpostorReveal.tsx`): the result opens with a spotlight
  over the photos of the round's players (a big rounded card, up to 18rem, not the round avatar) that slows down and stops on the impostor (2.6 s, path
  and delays in `impostorSpin.ts`), then the verdict, votes and points come in. It plays every
  time the result opens, "Pular" jumps to the end, and with reduced motion it starts at the end.
- **Roles look alike**: the reveal card and the hold-to-see button use the same colors and
  markup for the impostor and the others (only the text differs), so nobody spots the impostor
  from across the table. Tests compare the markup of both roles (`src/test/look.ts`).
- **Motion**: entrance (`.phase-enter`), staggered lists (`.stagger` with `--i`), pop-in, flip
  card on the reveal, pulse for urgency. Only `transform`/`opacity`; all of it is turned off under
  `prefers-reduced-motion`.

### Screen gallery

In dev builds, `/dev/gallery` renders every screen from fixtures, without a backend:
`/dev/gallery?screen=voting` (the index page lists all names). Use it with the browser's device
emulation (e.g. 390×844) to review layout changes. The route and fixtures are excluded from
production builds.

## Backend contract

The source of truth is `docs/protocol.md` in the API repository.

| Purpose     | Contract                                                                                        | Status                    |
| ----------- | ----------------------------------------------------------------------------------------------- | ------------------------- |
| Create room | `POST /api/room` with `{ playerName, totalRounds }` returns `201 { roomCode, playerId, token }` | implemented               |
| Join room   | `POST /api/room/{code}/join` with `{ playerName }` returns `201 { roomCode, playerId, token }`  | implemented               |
| Realtime    | `GET /ws/room/{code}?token=...` (WebSocket)                                                     | implemented (whole match) |
| Photo       | `PUT` / `DELETE /api/room/{code}/me/avatar` (bearer token; the JPEG as the body) returns `204`  | implemented               |

- Room codes have 5 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no I, O, 0 or 1). The
  join form drops any other character and accepts a pasted invite link (`features/room/roomCode.ts`).
- Player names have at most 20 characters. The API upper-cases the first letter ("ana" becomes
  "Ana"), refuses invisible characters and appends a number to a taken name ("Ana 2").
- `POST` bodies are sent as `Content-Type: application/json` (the API refuses anything else with
  `415`). The API rate-limits per client; a `429` (`rate_limited`) asks to wait a few seconds.
- Error responses carry `{ "code": "room_not_found" }` style identifiers, translated in
  `features/room/errorMessages.ts`: `room_not_found`, `room_full`, `match_in_progress`,
  `match_finished`, `invalid_name`, `invalid_rounds`, `invalid_request`, `request_too_large`,
  `unsupported_media_type`, `rate_limited`, `unauthorized`, `invalid_avatar`, `avatar_locked`.
  Lookups use own keys only (`Object.hasOwn`), so a code such as `constructor` is not a message. A
  request that gets no response is reported as `network_error`; anything else shows a generic
  message.
- WebSocket errors (`{"type":"error","payload":{"code":...}}`) show for 4 seconds in
  `ServerErrorBanner`, translated in `features/room/serverErrors.ts`: `not_host`,
  `not_enough_players`, `invalid_phase`, `not_your_turn`, `not_participant`,
  `theme_unavailable`, `invalid_vote`, `already_voted`, `not_impostor`, `invalid_guess`,
  `invalid_rounds`, `invalid_message`.
- The session (`playerId`, token) is kept per room under `party:session:<CODE>`, with the time it
  was saved, in two places: `sessionStorage` (per tab: what this tab plays as; survives a reload)
  and `localStorage` (shared; survives closing the app: the last session saved, adopted by a tab
  that has none). So several tabs of one browser can be different players of the same room, and a
  `4401` clears only that tab's session. Sessions older than 24 hours (the longest a room lives) are forgotten, and saving
  one sweeps the expired ones (`realtime/session.ts`).
- The live connection provides its session through `SessionContext` (`realtime/sessionContext.ts`):
  actions that need the token (the lobby photo) use it, not storage, where another tab may have
  stored a different session for the same room code.
- `/room/:code` only accepts a well-formed code (anything else is the "not found" page). When the
  player joins another room than the link's (the code field can be edited), the page moves to that
  room.
- Close codes `4401`, `4403` (left or removed) and `4404` are final: the socket client stops (status `rejected`), the saved
  session is cleared and the room screen shows `RoomUnavailable` (4401: join again; 4404: the room
  is gone). The API answers `4401` for an unknown room too (it never tells whether a room exists);
  `4404` means the room expired while connected. Any other close (`1001`, `1008`, `1011`, `1013`)
  reconnects with backoff.
- Leaving: "Sair da sala" (lobby footer, and the "⋯" `RoomMenu` of the match bar, which also holds
  the host's "Encerrar partida") and the host's remove button on each lobby row open a
  `ConfirmSheet` (`shared/ui/Sheet.tsx`) first. Leaving sends `leave_room`, forgets this tab's
  session and goes home. Players with `hasLeft` stay in the snapshot only to resolve names:
  `activePlayers` and `rankPlayers` leave them out of the lobby, the scoreboard and the podium.
- Only connected players count to start a match (at least 3), like on the server.
- Player photo (optional): the create and join forms and the lobby use `AvatarPicker` (one file
  input with `accept="image/*"` and no `capture`, so phones offer camera and gallery).
  `shared/lib/avatarImage.ts` crops the picked image to the centered square, scales it to
  768x768 and encodes a JPEG (lower quality only if it passes 500 KiB). The forms send it right
  after the session exists (`useEnterRoom`; a failed upload never blocks entering); the lobby
  (`MyAvatar`) changes or removes it. Changing it outside the lobby is refused by the server
  (`avatar_locked`). Photos arrive as `players[].avatarUrl` (a versioned path, cached for good by
  the browser) and `Avatar` falls back to the initials when there is none or it fails to load.

While the first snapshot is on its way the room screen shows the room code with the invite
button ("Conectando à sala…").

Round flow on screen:

- Theme selection: the host picks a theme or "Sorteio".
- Reveal (`RoleReveal`): hold the card to see the role; "Entendi" is enabled after looking at
  least once; then "Aguardando os outros (n/total prontos)". The host can tap "Começar sem
  esperar". A player who was offline when the round started sees "Você entra na próxima".
- Reminder (`SecretPeek`): from the questions to the guess, every player of the round can hold
  "Segure para lembrar" to see their role again; it hides on release, on sliding off, on losing
  focus and when the app goes to the background (`useHoldToReveal`, shared with the reveal card).
  The impostor has the same button and sees "Você é o impostor!", so nobody can spot them by a
  missing button; the server never sends them the secret.
- Questions: the answerer sees "Prosseguir" (or "Ir para a discussão" on the last turn, from
  `round.totalTurns`) and "+1 min"; the host sees "Pular turno" as a backup. The countdown turns
  red in the last 30 seconds.
- Discussion: a 3-minute countdown (`round.phaseDeadlineAt`); the host can tap "+1 min"
  (`extend_discussion`) or "Ir para a votação".
- Voting: the other players of the round, one final vote, the progress ("2/3 votaram") and a
  5-minute countdown. A player outside the round only watches.
- Guess (`Guess`): the found impostor picks the secret among `round.guessOptions` within 60
  seconds; the others wait.
- Result: the impostor, the secret, who voted for whom, the guess, the points of the round and
  the scoreboard. The host taps "Próxima rodada", or "Ver pódio" after the last round.
- Podium (`MatchOver`): ties share the position (`rankPlayers`); the host picks the number of
  rounds and taps "Jogar de novo". While a match runs with fewer than 3 connected players, the
  host is told no round can start and that they may end the match.

To try it on phones in the same Wi-Fi: `pnpm dev --host`, open `http://<computer-ip>:5173` and
add that origin to the API's `ALLOWED_ORIGINS` (the WebSocket refuses other origins).

## Mobile, performance and PWA notes

- Animate only `transform` and `opacity`; durations come from tokens and drop to ~0 with
  `prefers-reduced-motion`.
- The countdown is isolated in its own component so only it re-renders every second.
- `navigator.vibrate` does not exist on iOS: vibration is a bonus, the on-screen alert is the cue.
- Sounds are a bonus too (`shared/lib/sound.ts`): `play()` runs inside the tap handler (iOS
  blocks audio started outside a gesture) and failures are ignored. Each file is fetched once and
  played from a blob URL: Safari does not play media that a service worker answers without range
  support. `vote.mp3` plays when a player votes and is precached. The sound button
  (`features/round/SoundButton.tsx`, next to the countdown in the questions and the discussion)
  plays a random file of `src/assets/sounds/memes/` on that phone only, never the same twice in a
  row (`shared/lib/shuffleBag.ts`); a new tap cuts the one playing. Drop new mp3 files in that
  folder (about 5 seconds at most); the build puts them in `assets/memes/`, which the service
  worker caches on first use instead of at install.
- The Wake Lock API has caveats on iOS: treat it as progressive enhancement.
- The service worker caches only the app shell; `/api` and `/ws` are never cached. The meme route
  matches the path of same-origin requests only (`pwa/cacheRoutes.ts`); Workbox copies the
  function into `sw.js`, so it must not use anything outside its body.
- Updates are announced with a prompt and applied on demand, never mid-match automatically.

## Hosting

The production build (`pnpm build`, the `dist/` folder) carries a Content Security Policy as a
`<meta>` tag (`pwa/csp.ts`, injected by `vite.config.ts`; the dev server goes without it, since hot
reload needs inline scripts). It allows only the app's own origin, plus `VITE_API_BASE_URL` and
`VITE_WS_BASE_URL` when the API is elsewhere. A `<meta>` cannot carry everything, so the static
host must send these headers on every response:

| Header                                      | Value                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Content-Security-Policy`                   | `frame-ancestors 'none'` (plus the policy of the meta tag, if the host can send it) |
| `Strict-Transport-Security`                 | `max-age=31536000; includeSubDomains` (HTTPS only)                                  |
| `X-Content-Type-Options`                    | `nosniff`                                                                           |
| `Referrer-Policy`                           | `no-referrer`                                                                       |
| `Permissions-Policy`                        | `camera=(self), microphone=(), geolocation=()`                                      |
| `Cache-Control` on `sw.js` and `index.html` | `no-cache` (updates reach installed apps)                                           |

The production image (`Dockerfile`: build with Node, serve with unprivileged nginx on port 8080)
sends them from `nginx/security-headers.inc`, with long caching for the hashed `assets/` and
`no-cache` for everything else; unknown paths get `index.html` (client-side routes). It is built
and run by the server repository's `deploy/` stack, which serves the API on the same origin.

The API and the WebSocket must be served over HTTPS/WSS too: the session token travels in the
`Authorization` header and in the WebSocket query string (`?token=`), so the proxy in front of
the API must not log that query string.

## Open items

- Final game name, icons and a self-hosted display font.
- Server-provided remaining time for countdowns (avoids client clock skew).
- Playwright end-to-end tests simulating several players with multiple browser contexts.
- `pnpm-workspace.yaml` overrides `glob` to `^14.0.2` (a build-only advisory in the version
  `workbox-build` asks for): drop the override once `workbox-build` moves past it.
