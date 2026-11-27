import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RoomPage } from './RoomPage'

function Location() {
  return <p data-testid="location">{useLocation().pathname}</p>
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/room/:code"
          element={
            <>
              <RoomPage />
              <Location />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoomPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows "not found" for a path that is not a room code', () => {
    renderAt('/room/!!!!!')
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })

  // The invite form lets the player edit the code: the session they get belongs to the room they
  // joined, so the page moves there instead of connecting the link's room with it.
  it('moves to the room the player actually joined', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ roomCode: 'BBBBB', playerId: 'p1', token: 't1' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    renderAt('/room/AAAAA')

    fireEvent.change(screen.getByLabelText('Código da sala'), { target: { value: 'BBBBB' } })
    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Bia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar na sala' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/room/BBBBB'))
  })
})
