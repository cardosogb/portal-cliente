/**
 * Número de WhatsApp do escritório, no formato internacional (só dígitos).
 * Placeholder — troque pelo número real antes de publicar em produção.
 */
export const OFFICE_WHATSAPP_NUMBER = "5511900000000";

/**
 * Monta um link "wa.me" com uma mensagem pré-preenchida, para o cliente
 * enviar uma pendência (ex.: um documento) diretamente pelo WhatsApp do
 * escritório, sem precisar salvar o número antes.
 */
export function whatsappLink(message: string): string {
  return `https://wa.me/${OFFICE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function pendingActionWhatsappMessage(processNumber: string, actionText: string): string {
  return `Olá! Sou cliente do processo nº ${processNumber}. Preciso resolver uma pendência: ${actionText}`;
}
