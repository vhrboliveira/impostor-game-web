import { INVALID_IMAGE_CODE } from '@/shared/lib/avatarImage'
import { ApiError, NETWORK_ERROR_CODE } from './roomApi'

// Error codes are English identifiers sent by the API (see docs/protocol.md in the API
// repository); only the displayed text is Portuguese.
const messages: Record<string, string> = {
  room_not_found: 'Sala não encontrada. Confira o código.',
  room_full: 'A sala está cheia.',
  match_in_progress: 'A rodada está em andamento. Tente entrar entre as rodadas.',
  match_finished: 'A partida acabou. Peça ao anfitrião para começar outra e tente de novo.',
  invalid_name: 'Digite um nome válido (até 20 caracteres).',
  invalid_rounds: 'Escolha um número de rodadas válido.',
  invalid_request: 'Não foi possível enviar os dados. Atualize a página e tente de novo.',
  request_too_large: 'Os dados enviados são grandes demais.',
  unauthorized: 'Sua sessão expirou. Entre na sala de novo.',
  invalid_avatar: 'Não deu para usar essa imagem. Tente outra foto.',
  avatar_locked: 'A foto só pode ser trocada no lobby.',
  [INVALID_IMAGE_CODE]: 'Não deu para abrir essa imagem. Tente outra foto.',
  [NETWORK_ERROR_CODE]: 'Sem conexão com o servidor. Verifique a internet e tente de novo.',
}

const fallback = 'Algo deu errado. Tente novamente.'

export function describeError(error: unknown): string {
  if (error instanceof ApiError && error.code && error.code in messages) {
    return messages[error.code]
  }
  if (error instanceof Error && error.message === INVALID_IMAGE_CODE) {
    return messages[INVALID_IMAGE_CODE]
  }
  return fallback
}
