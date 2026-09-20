export interface WhatsAppRecipient {
  phone: string;
  apiKey?: string; // CallMeBot API key for this number
}

export interface WhatsAppConfig {
  provider: 'callmebot' | 'twilio' | 'webhook';
  recipients?: WhatsAppRecipient[];
  phoneNumber?: string; // legacy single
  apiKey?: string;      // legacy single
  twilioSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  webhookUrl?: string;
}

export async function sendWhatsApp(
  config: WhatsAppConfig,
  text: string
): Promise<{ success: boolean; error?: string; results?: any[] }> {
  // Normalize recipients list
  const recipientList: WhatsAppRecipient[] = [];
  if (config.recipients && Array.isArray(config.recipients) && config.recipients.length > 0) {
    recipientList.push(...config.recipients);
  } else if (config.phoneNumber) {
    recipientList.push({ phone: config.phoneNumber, apiKey: config.apiKey });
  }

  if (recipientList.length === 0) {
    return { success: false, error: 'No recipient phone numbers configured' };
  }

  const results: any[] = [];
  let atLeastOneSuccess = false;

  for (const recipient of recipientList) {
    const cleanPhone = recipient.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) continue;

    try {
      if (config.provider === 'callmebot') {
        const apiKey = recipient.apiKey || config.apiKey;
        if (!apiKey) {
          results.push({ phone: cleanPhone, success: false, error: 'CallMeBot API key missing for this number' });
          continue;
        }

        const encodedText = encodeURIComponent(text);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${apiKey}`;

        const res = await fetch(url);
        const responseText = await res.text();

        if (res.ok && !responseText.toLowerCase().includes('error')) {
          results.push({ phone: cleanPhone, success: true });
          atLeastOneSuccess = true;
        } else {
          results.push({ phone: cleanPhone, success: false, error: responseText });
        }
      } else if (config.provider === 'twilio') {
        if (!config.twilioSid || !config.twilioAuthToken || !config.twilioFromNumber) {
          results.push({ phone: cleanPhone, success: false, error: 'Twilio SID, Token, and From Number required' });
          continue;
        }

        const cleanTo = `+${cleanPhone}`;
        const cleanFrom = config.twilioFromNumber.startsWith('+') ? config.twilioFromNumber : `+${config.twilioFromNumber.replace(/[^0-9]/g, '')}`;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioSid}/Messages.json`;
        const formData = new URLSearchParams();
        formData.append('From', `whatsapp:${cleanFrom}`);
        formData.append('To', `whatsapp:${cleanTo}`);
        formData.append('Body', text);

        const auth = Buffer.from(`${config.twilioSid}:${config.twilioAuthToken}`).toString('base64');
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });

        const data: any = await res.json();
        if (res.ok) {
          results.push({ phone: cleanPhone, success: true });
          atLeastOneSuccess = true;
        } else {
          results.push({ phone: cleanPhone, success: false, error: data.message || `HTTP ${res.status}` });
        }
      } else if (config.provider === 'webhook') {
        if (!config.webhookUrl) {
          results.push({ phone: cleanPhone, success: false, error: 'Webhook URL missing' });
          continue;
        }

        const res = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, message: text })
        });

        if (res.ok) {
          results.push({ phone: cleanPhone, success: true });
          atLeastOneSuccess = true;
        } else {
          results.push({ phone: cleanPhone, success: false, error: `HTTP ${res.status}` });
        }
      }
    } catch (err: any) {
      results.push({ phone: cleanPhone, success: false, error: err.message });
    }
  }

  if (atLeastOneSuccess) {
    return { success: true, results };
  } else {
    const firstErr = results.find(r => !r.success)?.error || 'Failed to dispatch to WhatsApp recipients';
    return { success: false, error: firstErr, results };
  }
}

export async function testWhatsApp(config: WhatsAppConfig): Promise<{ success: boolean; error?: string; results?: any[] }> {
  const msg = `🔔 *PulseGuard Test Alert*\nYour WhatsApp notification channel is configured!\nYou will receive instant alerts here whenever a server or website goes down.`;
  return sendWhatsApp(config, msg);
}
