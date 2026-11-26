import { describe, expect, it } from 'vitest'
import { isCompleteRoomCode, sanitizeRoomCode } from './roomCode'

describe('sanitizeRoomCode', () => {
  it.each([
    ['abcde', 'ABCDE'],
    ['  ab cd e ', 'ABCDE'],
    ['AB-CD', 'ABCD'],
    ['ABCDEFG', 'ABCDE'],
    // Ambiguous characters never appear in a code.
    ['O0I1A', 'A'],
    ['ção9z', '9Z'],
    ['https://jogo.example/room/k7m2p', 'K7M2P'],
    ['https://jogo.example/room/K7M2P/', 'K7M2P'],
    ['', ''],
  ])('%j becomes %j', (raw, expected) => {
    expect(sanitizeRoomCode(raw)).toBe(expected)
  })
})

describe('isCompleteRoomCode', () => {
  it.each([
    ['K7M2P', true],
    ['K7M2', false],
    ['K7M2PP', false],
    ['K7M2O', false],
    ['k7m2p', false],
  ])('%j is %s', (code, expected) => {
    expect(isCompleteRoomCode(code)).toBe(expected)
  })
})
