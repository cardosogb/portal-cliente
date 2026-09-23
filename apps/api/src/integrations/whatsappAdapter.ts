/**
 * Camada de integração com WhatsApp Business API.
 *
 * Mockada por enquanto (apenas loga a mensagem). Quando um provedor
 * homologado pela Meta (Twilio, Z-API, Gupshup etc.) for escolhido,
 * troque `ConsoleWhatsappClient` por uma implementação real, mantendo
 * a interface `WhatsappClient`.
 *
 * Observação (ver Proposta-Portal-do-Cliente): mensagens automáticas,
 * especialmente a primeira de uma conversa, precisam usar templates
 * pré-aprovados pela Meta — por isso `sendTemplateMessage` recebe um
 * `templateId` em vez de texto livre.
 */
export interface WhatsappClient {
  sendTemplateMessage(params: {
    toPhone: string;
    templateId: "movimentacao" | "acao_pendente" | "relacionamento" | "pesquisa_satisfacao";
    variables: Record<string, string>;
  }): Promise<{ delivered: boolean }>;
}

class ConsoleWhatsappClient implements WhatsappClient {
  async sendTemplateMessage(params: {
    toPhone: string;
    templateId: string;
    variables: Record<string, string>;
  }): Promise<{ delivered: boolean }> {
    // eslint-disable-next-line no-console
    console.log(
      `[whatsapp:mock] para=${params.toPhone} template=${params.templateId}`,
      params.variables,
    );
    return { delivered: true };
  }
}

export const whatsappClient: WhatsappClient = new ConsoleWhatsappClient();
