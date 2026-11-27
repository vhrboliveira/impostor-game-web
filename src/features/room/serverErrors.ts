// Error codes sent over the room WebSocket (`{"type":"error","payload":{"code":...}}`).
// The codes are English identifiers defined by the API; only the text is Portuguese.
const messages: Record<string, string> = {
  not_host: 'Só o anfitrião pode fazer isso.',
  not_enough_players: 'São necessários pelo menos 3 jogadores conectados.',
  invalid_phase: 'Essa ação não está disponível agora.',
  not_your_turn: 'Só quem responde (ou o anfitrião) pode fazer isso.',
  not_participant: 'Você entra na próxima rodada.',
  theme_unavailable: 'Esse tema não tem mais palavras ou perguntas suficientes. Escolha outro.',
  invalid_vote: 'Vote em outro jogador da rodada.',
  not_impostor: 'Só o impostor pode dar o palpite.',
  invalid_guess: 'Escolha uma das opções.',
  invalid_rounds: 'Escolha um número de rodadas válido.',
  invalid_message: 'O servidor não entendeu o pedido. Atualize a página.',
}

export function describeServerError(code: string): string {
  // Own keys only: an inherited key such as "constructor" is not a message.
  return Object.hasOwn(messages, code) ? messages[code] : 'Algo deu errado. Tente novamente.'
}
