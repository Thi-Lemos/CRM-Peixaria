const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;

export const telegramApi = {
  /**
   * Envia uma mensagem para um chat ID específico do Telegram
   * @param chatId O ID do usuário/chat no Telegram (equivalente ao session_id no nosso banco)
   * @param text O conteúdo da mensagem
   */
  async sendMessage(chatId: string, text: string) {
    if (!TELEGRAM_TOKEN) {
      console.error('Telegram Bot Token não configurado!');
      return { error: 'Token não configurado' };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.description);
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Erro ao enviar mensagem para Telegram:', error);
      return { data: null, error: error.message };
    }
  }
};
