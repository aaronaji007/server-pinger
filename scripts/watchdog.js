import net from 'node:net';
import nodemailer from 'nodemailer';

// Configuration (can be overridden via GitHub Secrets / Environment variables)
const VPS_HOST = process.env.VPS_HOST || '168.231.119.84';
const VPS_PORT = parseInt(process.env.VPS_PORT || '443', 10);
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://bluemoonrestaurants.com/';
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '10000', 10);
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 15000;

const GMAIL_USER = process.env.GMAIL_USER || 'aaronaji047@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || 'rgnzdlkylwnmdlpx';
const RECIPIENTS = process.env.RECIPIENT_EMAILS || 'aaronaji047@gmail.com, shinchan.aaron1@gmail.com, bijoyhornsby@gmail.com';

const CALLMEBOT_RECIPIENTS = [
  { phone: '919004572253', apiKey: process.env.CALLMEBOT_KEY_1 || '' },
  { phone: '61466588037', apiKey: process.env.CALLMEBOT_KEY_2 || '' }
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1. Check TCP Port (SSH / HTTP / custom port)
function checkTcpPort(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const socket = new net.Socket();
    let resolved = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      if (!resolved) {
        resolved = true;
        const latencyMs = Math.round(performance.now() - startTime);
        socket.destroy();
        resolve({ isUp: true, latencyMs });
      }
    });

    socket.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ isUp: false, error: `TCP connection timed out after ${timeoutMs}ms` });
      }
    });

    socket.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ isUp: false, error: err.message || err.code });
      }
    });

    socket.connect(port, host);
  });
}

// 2. Check Website HTTPS URL
async function checkHttpUrl(url, timeoutMs) {
  const startTime = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PulseGuard-Watchdog/2.0' }
    });
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - startTime);

    if (res.status >= 200 && res.status < 400) {
      return { isUp: true, latencyMs, status: res.status };
    } else {
      return { isUp: false, error: `HTTP ${res.status} ${res.statusText}`, status: res.status };
    }
  } catch (err) {
    clearTimeout(timer);
    const msg = err.name === 'AbortError' ? `HTTP request timed out after ${timeoutMs}ms` : err.message;
    return { isUp: false, error: msg };
  }
}

// 3. Combined Single Check (Attempts TCP and HTTPS)
async function performSingleHealthCheck() {
  const [tcpRes, httpRes] = await Promise.all([
    checkTcpPort(VPS_HOST, VPS_PORT, TIMEOUT_MS),
    checkHttpUrl(WEBSITE_URL, TIMEOUT_MS)
  ]);

  // If either the website HTTPS or the TCP port is reachable, the server is UP!
  if (httpRes.isUp || tcpRes.isUp) {
    const latencies = [];
    if (httpRes.isUp) latencies.push(`Web: ${httpRes.latencyMs}ms`);
    if (tcpRes.isUp) latencies.push(`Port ${VPS_PORT}: ${tcpRes.latencyMs}ms`);
    return { isUp: true, summary: latencies.join(', ') };
  }

  return {
    isUp: false,
    error: `TCP: ${tcpRes.error} | Web: ${httpRes.error}`
  };
}

async function sendOutageEmail(errorReason, timestamp) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"PulseGuard Watchdog" <${GMAIL_USER}>`,
      to: RECIPIENTS,
      subject: `🚨 CRITICAL ALERT: Hostinger Ubuntu VPS is DOWN!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 12px; background-color: #fffaf0;">
          <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 13px; color: #ffffff; background-color: #ef4444; margin-bottom: 16px;">
            CRITICAL: SERVER UNREACHABLE
          </div>
          <h2 style="margin: 0 0 12px 0; color: #991b1b; font-size: 20px;">Hostinger Ubuntu VPS is DOWN</h2>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">
            GitHub Actions automated watchdog confirmed an outage after <strong>${MAX_RETRIES} consecutive failed attempts</strong>.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #fed7aa;">
              <td style="padding: 10px 0; color: #6b7280; width: 140px;">Target Server:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: bold; font-family: monospace;">${VPS_HOST}:${VPS_PORT}</td>
            </tr>
            <tr style="border-bottom: 1px solid #fed7aa;">
              <td style="padding: 10px 0; color: #6b7280;">Website URL:</td>
              <td style="padding: 10px 0; color: #111827; font-family: monospace;">${WEBSITE_URL}</td>
            </tr>
            <tr style="border-bottom: 1px solid #fed7aa;">
              <td style="padding: 10px 0; color: #6b7280;">Failure Reason:</td>
              <td style="padding: 10px 0; color: #dc2626; font-weight: 600;">${errorReason}</td>
            </tr>
            <tr style="border-bottom: 1px solid #fed7aa;">
              <td style="padding: 10px 0; color: #6b7280;">Time of Outage:</td>
              <td style="padding: 10px 0; color: #111827;">${timestamp}</td>
            </tr>
          </table>
          <p style="color: #9ca3af; font-size: 12px; border-top: 1px solid #fed7aa; padding-top: 12px; margin: 0;">
            Sent by GitHub Actions 24/7 Watchdog for PulseGuard (Verified with ${MAX_RETRIES}x retry protection across 1.5+ minutes).
          </p>
        </div>
      `
    });

    console.log(`[Email] Alert email successfully sent: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] Failed to send email alert:`, err.message);
  }
}

async function sendWhatsAppAlerts(errorReason, timestamp) {
  const text = `🚨 *PULSEGUARD ALERT: VPS IS DOWN*\n\n*Server:* Hostinger Ubuntu VPS\n*Target:* ${VPS_HOST}:${VPS_PORT}\n*Website:* ${WEBSITE_URL}\n*Error:* ${errorReason}\n*Verified:* Failed ${MAX_RETRIES} consecutive checks\n*Time:* ${timestamp}\n\nPlease check your VPS immediately.`;

  for (const item of CALLMEBOT_RECIPIENTS) {
    if (!item.apiKey) continue;
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${item.phone}&text=${encodeURIComponent(text)}&apikey=${item.apiKey}`;
      const res = await fetch(url);
      console.log(`[WhatsApp] Sent alert to ${item.phone}: HTTP ${res.status}`);
    } catch (err) {
      console.error(`[WhatsApp] Failed to send to ${item.phone}:`, err.message);
    }
  }
}

async function run() {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  console.log(`[Watchdog] Checking Hostinger VPS (${VPS_HOST}:${VPS_PORT}) & Website (${WEBSITE_URL}) at ${timestamp}...`);

  let lastError = '';

  // Retry loop: only declare DOWN if ALL MAX_RETRIES fail consecutively
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[Watchdog] Attempt ${attempt}/${MAX_RETRIES}...`);
    const check = await performSingleHealthCheck();

    if (check.isUp) {
      console.log(`✅ [Watchdog] VPS & Website are UP and healthy! (${check.summary})`);
      process.exit(0);
    }

    lastError = check.error;
    console.warn(`⚠️ [Watchdog] Attempt ${attempt} failed: ${lastError}`);

    if (attempt < MAX_RETRIES) {
      console.log(`[Watchdog] Waiting ${RETRY_DELAY_MS / 1000}s before retry...`);
      await sleep(RETRY_DELAY_MS);
    }
  }

  // If we reach here, ALL attempts failed
  console.error(`❌ [Watchdog] VPS confirmed DOWN after ${MAX_RETRIES} attempts! Cause: ${lastError}`);
  console.log(`[Watchdog] Dispatching emergency notifications...`);
  await Promise.all([
    sendOutageEmail(lastError, timestamp),
    sendWhatsAppAlerts(lastError, timestamp)
  ]);

  process.exit(1);
}

run();
