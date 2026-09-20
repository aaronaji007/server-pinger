# 🛡️ PulseGuard — Uptime & Server Health Monitor

PulseGuard is a self-hosted, lightweight uptime and server monitoring application. It continuously checks websites (HTTP/HTTPS) and VPS servers (TCP ports/ping), tracking response latency and SSL certificate expiry, and alerting immediately when a server goes down or recovers.

---

## ⚡ Key Highlights

- **HTTP & HTTPS Monitoring**: Checks status codes, response time, and warns about expiring SSL certificates.
- **VPS Server / TCP Port Monitoring**: Test raw server connectivity on any port (SSH `22`, Web `80`/`443`, MySQL `3306`, Postgres `5432`, game servers, etc.).
- **Multi-Channel Alert System**:
  - **Android Push Notifications**: Uses the free, open-source [ntfy](https://ntfy.sh) Android app to deliver **urgent-priority alarm push alerts** that ring your phone even on silent mode with zero developer fees.
  - **WhatsApp Outage Alerts**: Instant free alerts via CallMeBot (takes 30 seconds to setup) or Twilio WhatsApp API.
  - **Email Alerts**: HTML outage and recovery emails with downtime duration via Gmail App Passwords or custom SMTP.
  - **Telegram Bot**: Instant alerts to your Telegram chat or team group.
- **Consecutive Failure Thresholds**: Avoid false alarms from momentary network blips (e.g. alert only after 2 consecutive failed checks).
- **Incident & Latency History**: Detailed sparklines, heartbeat history, and downtime duration logs.
- **Zero External DB Needed**: Uses ultra-fast embedded SQLite with WAL mode.

---

## 🚀 Quick Start

### 1. Run with Node.js
```bash
cd uptime-monitor

# Install and build
npm install
npm run build

# Start PulseGuard
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser!

### 2. Run with Docker
```bash
cd uptime-monitor
docker-compose up -d --build
```

---

## 📱 How to Set Up Mobile & Chat Alerts

### 1. Android Phone Push Notifications (ntfy)
1. Install **ntfy** from [Google Play Store](https://play.google.com/store/apps/details?id=io.heckel.ntfy) or [F-Droid](https://f-droid.org/packages/io.heckel.ntfy/) on your Android phone.
2. Open the app, tap **+** to *Subscribe to topic*.
3. Choose any unique topic name (e.g. `pulseguard-myalerts-9821`).
4. In the PulseGuard web dashboard, navigate to **Alerts & Notifications** > **Android Push (ntfy)**, enter the same topic name, and click **Send Test Android Push**!
5. When a server goes down, your Android phone will ring out loud and vibrate with the exact error.

### 2. WhatsApp Outage Alerts (CallMeBot)
1. Save the CallMeBot contact on your phone: `+34 644 59 71 83`.
2. Send this exact message to it on WhatsApp:
   ```text
   I allow callmebot to send me messages
   ```
3. CallMeBot will reply within seconds with your personal **API Key**.
4. In PulseGuard > **Alerts & Notifications** > **WhatsApp**, enter your phone number (including country code, e.g. `919876543210`) and API Key, then click **Send Test WhatsApp**.

### 3. Email Alerts (Gmail / SMTP)
1. In Gmail, go to **Google Account** > **Security** > **2-Step Verification** > **App Passwords**.
2. Generate a new App Password for "PulseGuard".
3. In PulseGuard > **Alerts & Notifications** > **Email (SMTP)**:
   - SMTP Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `your-email@gmail.com`
   - Password: `<16-character-app-password>`
   - Recipients: `your-email@gmail.com, alerts@domain.com`

---

## 🛠️ API Reference

- `GET /api/monitors` — List all monitors with status and 20 recent heartbeats
- `POST /api/monitors` — Add a new HTTP or TCP monitor
- `GET /api/monitors/:id` — Detailed monitor data, heartbeats, and incident logs
- `POST /api/monitors/:id/check` — Trigger an immediate on-demand ping
- `POST /api/monitors/:id/toggle` — Pause or resume monitoring
- `DELETE /api/monitors/:id` — Remove a monitor
- `GET /api/stats` — System health summary (online/offline counts, avg latency)
- `GET /api/incidents` — Global outage and recovery incident log
- `GET /api/notifications` — Notification channels status & configuration
- `PUT /api/notifications/:id` — Update alert channel configuration
- `POST /api/notifications/:id/test` — Send an instant test alert

---

## 🖥️ VPS 24/7 Deployment with PM2

To keep PulseGuard running continuously in the background on your Ubuntu/Debian/Arch VPS:

```bash
# 1. Install PM2 process manager
npm install -g pm2

# 2. Start PulseGuard
pm2 start server/dist/index.js --name pulseguard

# 3. Configure auto-restart on VPS reboot
pm2 save
pm2 startup
```
