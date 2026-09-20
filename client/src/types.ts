export interface Monitor {
  id: number;
  name: string;
  type: 'http' | 'tcp';
  target: string;
  port?: number | null;
  interval_seconds: number;
  timeout_ms: number;
  status: 'up' | 'down' | 'degraded' | 'paused' | 'pending';
  last_checked_at: string | null;
  last_status_change_at: string | null;
  consecutive_failures: number;
  failure_threshold: number;
  last_latency_ms: number;
  avg_latency_ms: number;
  uptime_24h: number;
  ssl_expiry_days?: number | null;
  is_active: number;
  created_at: string;
  recentHeartbeats?: Heartbeat[];
}

export interface Heartbeat {
  id?: number;
  monitor_id?: number;
  latency_ms: number;
  status: 'up' | 'down';
  status_code?: number | null;
  error_message?: string | null;
  timestamp: string;
}

export interface Incident {
  id: number;
  monitor_id: number;
  cause: string;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
  monitor_name?: string;
  monitor_target?: string;
  monitor_type?: string;
}

export interface SystemStats {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  pausedMonitors: number;
  avgLatencyMs: number;
  activeIncidents: number;
}

export interface NotificationChannel {
  id: 'email' | 'whatsapp' | 'ntfy' | 'telegram' | 'webhook';
  enabled: boolean;
  config: any;
  updated_at: string;
}
