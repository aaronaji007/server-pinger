export interface NtfyConfig {
  serverUrl?: string; // default https://ntfy.sh
  topic: string;      // custom topic name
  priority?: 'min' | 'low' | 'default' | 'high' | 'urgent';
  authHeader?: string; // optional for private self-hosted ntfy servers
}

export async function sendNtfyPush(
  config: NtfyConfig,
  notification: {
    title: string;
    message: string;
    priority?: string;
    tags?: string[];
    clickUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!config.topic) {
    return { success: false, error: 'ntfy topic is required' };
  }

  const serverUrl = (config.serverUrl || 'https://ntfy.sh').replace(/\/$/, '');
  const url = `${serverUrl}/${encodeURIComponent(config.topic)}`;

  try {
    const headers: Record<string, string> = {
      Title: notification.title,
      Priority: notification.priority || config.priority || 'high',
      'Content-Type': 'text/plain; charset=utf-8'
    };

    if (notification.tags && notification.tags.length > 0) {
      headers['Tags'] = notification.tags.join(',');
    }

    if (notification.clickUrl) {
      headers['Click'] = notification.clickUrl;
    }

    if (config.authHeader) {
      headers['Authorization'] = config.authHeader;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: notification.message
    });

    if (res.ok) {
      return { success: true };
    } else {
      const errText = await res.text();
      return { success: false, error: `ntfy error ${res.status}: ${errText}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function testNtfyPush(config: NtfyConfig): Promise<{ success: boolean; error?: string }> {
  return sendNtfyPush(config, {
    title: '🔔 PulseGuard Android Test',
    message: `Connected successfully! Your Android device will receive immediate high-priority alerts on this topic (${config.topic}).`,
    priority: 'high',
    tags: ['white_check_mark', 'bell']
  });
}
