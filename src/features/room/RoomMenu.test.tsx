import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { ClientMessage, RoomSnapshot } from '@/realtime/protocol'
import { SendContext } from '@/realtime/sendContext'
import { RoomMenu } from './RoomMenu'

function snapshot(me: string): RoomSnapshot {
  return {
    roomCode: 'K7M2P',
    match: { status: 'in_progress', totalRounds: 3, roundNumber: 1 },
    players: [
      { id: 'ana', name: 'Ana', isHost: true, isConnected: true, score: 0 },
      { id: 'bia', name: 'Bia', isHost: false, isConnected: true, score: 0 },
    ],
    round: null,
    me: { playerId: me, role: null, secret: null, voteTargetId: null },
  }
}

function renderMenu(me: string) {
  const send = vi.fn<(message: ClientMessage) => void>()
  render(
    <MemoryRouter initialEntries={['/room/K7M2P']}>
      <Routes>
        <Route
          path="/room/:code"
          element={
            <SendContext.Provider value={send}>
              <RoomMenu snapshot={snapshot(me)} />
            </SendContext.Provider>
          }
        />
        <Route path="/" element={<p>home</p>} />
      </Routes>
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Opções da sala' }))
  return send
}

describe('RoomMenu', () => {
  it('lets any player leave after confirming', () => {
    const send = renderMenu('bia')
    expect(screen.queryByRole('button', { name: 'Encerrar partida' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sair da sala' }))
    expect(send).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, sair' }))

    expect(send).toHaveBeenCalledWith({ type: 'leave_room' })
    expect(screen.getByText('home')).toBeInTheDocument()
  })

  it('lets the host end the match after confirming', () => {
    const send = renderMenu('ana')

    fireEvent.click(screen.getByRole('button', { name: 'Encerrar partida' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(send).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Opções da sala' }))
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar partida' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sim, encerrar' }))
    expect(send).toHaveBeenCalledWith({ type: 'end_match' })
  })
})
