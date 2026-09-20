import net from 'net';
import tls from 'tls';
import { URL } from 'url';

export interface CheckResult {
  isUp: boolean;
  latencyMs: number;
  statusCode?: number;
  errorMessage?: string;
  sslDaysRemaining?: number;
}

/**
 * Check an HTTP / HTTPS target
 */
export async function checkHttp(urlStr: string, timeoutMs: number = 8000): Promise<CheckResult> {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let targetUrl = urlStr;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseGuard-Uptime-Bot/1.0 (+https://pulseguard.local)',
        'Cache-Control': 'no-cache'
      }
    });
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    // Consider HTTP status < 400 or 401/403 as alive (server replied)
    const isUp = res.status < 400 || res.status === 401 || res.status === 403;

    let sslDaysRemaining: number | undefined;
    if (targetUrl.startsWith('https://')) {
      try {
        sslDaysRemaining = await checkSslCertificate(targetUrl);
      } catch {
        // ignore SSL check failure if main request succeeded
      }
    }

    return {
      isUp,
      latencyMs,
      statusCode: res.status,
      errorMessage: isUp ? undefined : `HTTP Error ${res.status}: ${res.statusText}`,
      sslDaysRemaining
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);
    let errMsg = err.message || 'Connection failed';
    if (err.name === 'AbortError') {
      errMsg = `Timed out after ${timeoutMs}ms`;
    }
    return {
      isUp: false,
      latencyMs,
      errorMessage: errMsg
    };
  }
}

/**
 * Check a raw TCP port (useful for VPS servers, SSH, custom daemons, databases)
 */
export function checkTcp(host: string, port: number, timeoutMs: number = 5000): Promise<CheckResult> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const socket = new net.Socket();
    let resolved = false;

    const cleanup = () => {
      socket.removeAllListeners();
      socket.destroy();
    };

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      if (!resolved) {
        resolved = true;
        const latencyMs = Math.round(performance.now() - startTime);
        cleanup();
        resolve({
          isUp: true,
          latencyMs,
          statusCode: 200
        });
      }
    });

    socket.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({
          isUp: false,
          latencyMs: timeoutMs,
          errorMessage: `TCP connection timed out after ${timeoutMs}ms`
        });
      }
    });

    socket.on('error', (err: any) => {
      if (!resolved) {
        resolved = true;
        const latencyMs = Math.round(performance.now() - startTime);
        cleanup();
        resolve({
          isUp: false,
          latencyMs,
          errorMessage: err.code ? `TCP Error: ${err.code}` : err.message
        });
      }
    });

    // Remove protocol prefixes if provided (e.g. 1.2.3.4 or vps.domain.com)
    let cleanHost = host.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (cleanHost.includes(':')) {
      const parts = cleanHost.split(':');
      cleanHost = parts[0];
      if (!port && parts[1]) {
        port = parseInt(parts[1], 10);
      }
    }

    socket.connect(port || 80, cleanHost);
  });
}

/**
 * Check SSL certificate remaining validity in days
 */
export function checkSslCertificate(urlStr: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const host = parsed.hostname;
    const port = parsed.port ? parseInt(parsed.port, 10) : 443;

    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        rejectUnauthorized: false
      },
      () => {
        const cert = socket.getPeerCertificate();
        socket.destroy();
        if (cert && cert.valid_to) {
          const expiry = new Date(cert.valid_to).getTime();
          const now = Date.now();
          const daysRemaining = Math.max(0, Math.floor((expiry - now) / (1000 * 60 * 60 * 24)));
          resolve(daysRemaining);
        } else {
          reject(new Error('No certificate found'));
        }
      }
    );

    socket.setTimeout(4000);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('SSL check timed out'));
    });
    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}
