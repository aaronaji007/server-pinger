export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export async function sendTelegram(
  config: TelegramConfig,
  text: string
): Promise<{ success: boolean; error?: string }> {
  if (!config.botToken || !config.chatId) {
    return { success: false, error: 'Bot token and Chat ID are required' };
  }

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    const data: any = await res.json();
    if (data.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.description || 'Failed to send Telegram message' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function testTelegram(config: TelegramConfig): Promise<{ success: boolean; error?: string }> {
  const text = `🔔 *PulseGuard Test Message*\nTelegram alerts are configured successfully!\nYou will receive instant alerts here whenever a server or website goes down.`;
  return sendTelegram(config, text);
}
