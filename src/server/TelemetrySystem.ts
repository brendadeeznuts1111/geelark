/**
 * Telemetry and Performance Monitoring System
 *
 * Real-time alerts, performance tracing, and automated snapshots
 */

import { MonitoringSystem } from "./MonitoringSystem";
import path from "node:path";

const __dirname = import.meta.dir;
const ROOT_DIR = path.resolve(__dirname, "../..");
const TELEMETRY_DB_PATH = path.join(ROOT_DIR, "monitoring-telemetry.db");
const SNAPSHOTS_DIR = path.join(ROOT_DIR, "snapshots");

export interface TelemetryAlert {
  id?: number;
  timestamp: number;
  type: "cpu" | "memory" | "connections" | "load" | "custom";
  severity: "info" | "warning" | "critical";
  source: string;
  metric: string;
  value: number;
  threshold: number;
  unit: string;
  message: string;
  environment: string;
  resolved: boolean;
  notified: boolean;
  notificationChannels?: string[];
}

export interface PerformanceTrace {
  id?: number;
  timestamp: number;
  className: string;
  methodName: string;
  duration: number;
  args?: any[];
  result?: any;
  environment: string;
  metadata?: Record<string, any>;
}

export interface SystemSnapshot {
  id?: number;
  timestamp: number;
  label: string;
  environment: string;
  data: {
    servers: Array<{
      name: string;
      connections: number;
      hmrEvents: number;
      uptime: number;
      memory: NodeJS.MemoryUsage;
      cpu: NodeJS.CpuUsage;
    }>;
    monitoring: {
      totalEvents: number;
      totalRequests: number;
      activeConnections: number;
    };
    system: {
      uptime: number;
      memory: NodeJS.MemoryUsage;
      cpu: NodeJS.CpuUsage;
      platform: string;
      arch: string;
      nodeVersion: string;
    };
  };
}

export interface TelemetryConfig {
  alertThresholds: {
    cpu: number; // Percentage
    memory: number; // Percentage
    connections: number; // Count
    load: number; // Percentage
    customMetrics: Record<string, number>;
  };
  notificationChannels: {
    slack?: { webhook: string; channel: string };
    discord?: { webhook: string };
    email?: { smtp: string; to: string[] };
  };
  snapshotInterval: number; // milliseconds
  tracingEnabled: boolean;
  tracingSampleRate: number; // 0-1
}

export class TelemetrySystem {
  private monitoring: MonitoringSystem;
  private db: any;
  private config: TelemetryConfig;
  private performanceTraces: Map<string, PerformanceTrace[]> = new Map();
  private activeAlerts: Set<string> = new Set();

  constructor(
    monitoring: MonitoringSystem,
    config: Partial<TelemetryConfig> = {},
    dbPath: string = TELEMETRY_DB_PATH
  ) {
    this.monitoring = monitoring;

    // @ts-ignore - Using dynamic import
    const { Database } = require("bun:sqlite");
    this.db = new Database(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL");

    this.config = {
      alertThresholds: {
        cpu: config.alertThresholds?.cpu || 90,
        memory: config.alertThresholds?.memory || 90,
        connections: config.alertThresholds?.connections || 1000,
        load: config.alertThresholds?.load || 90,
        customMetrics: config.alertThresholds?.customMetrics || {},
      },
      notificationChannels: config.notificationChannels || {},
      snapshotInterval: config.snapshotInterval || 3600000, // 1 hour
      tracingEnabled: config.tracingEnabled ?? true,
      tracingSampleRate: config.tracingSampleRate ?? 1.0,
    };

    this.initializeSchema();
    this.ensureSnapshotsDir();
    this.startPeriodicTasks();
  }

  private initializeSchema(): void {
    // Telemetry alerts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS telemetry_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        source TEXT NOT NULL,
        metric TEXT NOT NULL,
        value REAL NOT NULL,
        threshold REAL NOT NULL,
        unit TEXT NOT NULL,
        message TEXT NOT NULL,
        environment TEXT NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        notified INTEGER NOT NULL DEFAULT 0,
        notificationChannels TEXT
      )
    `);

    // Performance traces table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS performance_traces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        className TEXT NOT NULL,
        methodName TEXT NOT NULL,
        duration REAL NOT NULL,
        args TEXT,
        result TEXT,
        environment TEXT NOT NULL,
        metadata TEXT
      )
    `);

    // System snapshots table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        label TEXT NOT NULL,
        environment TEXT NOT NULL,
        data TEXT NOT NULL
      )
    `);

    // Indexes
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_alerts(timestamp)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_telemetry_severity ON telemetry_alerts(severity)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_telemetry_resolved ON telemetry_alerts(resolved)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_perf_timestamp ON performance_traces(timestamp)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_perf_method ON performance_traces(className, methodName)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON system_snapshots(timestamp)`);
  }

  private ensureSnapshotsDir(): void {
    try {
      // @ts-ignore - Bun.file exists
      if (!Bun.file(SNAPSHOTS_DIR).exists()) {
        // @ts-ignore
        Bun.write(SNAPSHOTS_DIR + "/.gitkeep", "");
      }
    } catch (error) {
      console.error("Failed to ensure snapshots directory:", error);
    }
  }

  private startPeriodicTasks(): void {
    // Check alerts every 30 seconds
    setInterval(() => {
      this.checkAlerts();
    }, 30000);

    // Take snapshots periodically
    setInterval(() => {
      this.takeSnapshot("periodic");
    }, this.config.snapshotInterval);

    // Cleanup old traces
    setInterval(() => {
      this.cleanupPerformanceTraces(7); // Keep 7 days
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Check all alert thresholds and create alerts if needed
   */
  checkAlerts(environment: string = process.env.ENVIRONMENT || "development"): TelemetryAlert[] {
    const alerts: TelemetryAlert[] = [];
    const now = Date.now();

    // Check CPU usage
    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Rough estimate

    if (cpuPercent > this.config.alertThresholds.cpu) {
      const alert: TelemetryAlert = {
        timestamp: now,
        type: "cpu",
        severity: cpuPercent > 95 ? "critical" : "warning",
        source: "system",
        metric: "cpu_usage",
        value: cpuPercent,
        threshold: this.config.alertThresholds.cpu,
        unit: "%",
        message: `CPU usage at ${cpuPercent.toFixed(1)}% exceeds threshold of ${this.config.alertThresholds.cpu}%`,
        environment,
        resolved: false,
        notified: false,
      };
      alerts.push(alert);
      this.createAlert(alert);
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (memoryPercent > this.config.alertThresholds.memory) {
      const alert: TelemetryAlert = {
        timestamp: now,
        type: "memory",
        severity: memoryPercent > 95 ? "critical" : "warning",
        source: "system",
        metric: "memory_usage",
        value: memoryPercent,
        threshold: this.config.alertThresholds.memory,
        unit: "%",
        message: `Memory usage at ${memoryPercent.toFixed(1)}% exceeds threshold of ${this.config.alertThresholds.memory}%`,
        environment,
        resolved: false,
        notified: false,
      };
      alerts.push(alert);
      this.createAlert(alert);
    }

    // Check monitoring system metrics
    const monitoringSummary = this.monitoring.getSummary();
    const connectionLoad = (monitoringSummary.activeConnections / 1000) * 100; // Assume 1000 max

    if (monitoringSummary.activeConnections > this.config.alertThresholds.connections) {
      const alert: TelemetryAlert = {
        timestamp: now,
        type: "connections",
        severity: "warning",
        source: "monitoring",
        metric: "active_connections",
        value: monitoringSummary.activeConnections,
        threshold: this.config.alertThresholds.connections,
        unit: "connections",
        message: `Active connections (${monitoringSummary.activeConnections}) exceeds threshold of ${this.config.alertThresholds.connections}`,
        environment,
        resolved: false,
        notified: false,
      };
      alerts.push(alert);
      this.createAlert(alert);
    }

    // Notify for critical alerts
    alerts
      .filter(a => a.severity === "critical")
      .forEach(alert => {
        this.sendNotification(alert);
      });

    return alerts;
  }

  /**
   * Create a telemetry alert
   */
  createAlert(alert: TelemetryAlert): TelemetryAlert {
    const alertKey = `${alert.type}-${alert.metric}-${alert.source}`;

    // Check if alert already exists and is active
    if (this.activeAlerts.has(alertKey)) {
      return alert;
    }

    // Insert into database
    this.db.prepare(`
      INSERT INTO telemetry_alerts (
        timestamp, type, severity, source, metric, value, threshold,
        unit, message, environment, resolved, notified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      alert.timestamp,
      alert.type,
      alert.severity,
      alert.source,
      alert.metric,
      alert.value,
      alert.threshold,
      alert.unit,
      alert.message,
      alert.environment
    );

    this.activeAlerts.add(alertKey);

    // Log to console
    const emoji = alert.severity === "critical" ? "🚨" : alert.severity === "warning" ? "⚠️" : "ℹ️";
    console.log(`${emoji} [${alert.type.toUpperCase()}] ${alert.message}`);

    return alert;
  }

  /**
   * Send notification for alert
   */
  private async sendNotification(alert: TelemetryAlert): Promise<void> {
    const { slack, discord, email } = this.config.notificationChannels;

    if (slack) {
      await this.sendSlackNotification(alert, slack);
    }

    if (discord) {
      await this.sendDiscordNotification(alert, discord);
    }

    if (email) {
      await this.sendEmailNotification(alert, email);
    }
  }

  private async sendSlackNotification(alert: TelemetryAlert, config: { webhook: string; channel: string }): Promise<void> {
    try {
      const color = alert.severity === "critical" ? "#DC143C" : alert.severity === "warning" ? "#FF8C00" : "#36A64F";
      const emoji = alert.severity === "critical" ? "🚨" : alert.severity === "warning" ? "⚠️" : "ℹ️";

      const payload = {
        channel: config.channel,
        attachments: [
          {
            color,
            title: `${emoji} ${alert.type.toUpperCase()} Alert`,
            text: alert.message,
            fields: [
              { title: "Metric", value: alert.metric, short: true },
              { title: "Value", value: `${alert.value.toFixed(1)} ${alert.unit}`, short: true },
              { title: "Threshold", value: `${alert.threshold} ${alert.unit}`, short: true },
              { title: "Environment", value: alert.environment, short: true },
            ],
            timestamp: new Date(alert.timestamp).toISOString(),
          },
        ],
      };

      await fetch(config.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Mark as notified
      this.db.prepare("UPDATE telemetry_alerts SET notified = 1 WHERE id = ?").run(alert.id);
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
    }
  }

  private async sendDiscordNotification(alert: TelemetryAlert, config: { webhook: string }): Promise<void> {
    try {
      const color = alert.severity === "critical" ? 0xFF0000 : alert.severity === "warning" ? 0xFFA500 : 0x36A64F;
      const emoji = alert.severity === "critical" ? "🚨" : alert.severity === "warning" ? "⚠️" : "ℹ️";

      const payload = {
        embeds: [
          {
            title: `${emoji} ${alert.type.toUpperCase()} Alert`,
            description: alert.message,
            fields: [
              { name: "Metric", value: alert.metric, inline: true },
              { name: "Value", value: `${alert.value.toFixed(1)} ${alert.unit}`, inline: true },
              { name: "Threshold", value: `${alert.threshold} ${alert.unit}`, inline: true },
              { name: "Environment", value: alert.environment, inline: true },
            ],
            color,
            timestamp: new Date(alert.timestamp).toISOString(),
          },
        ],
      };

      await fetch(config.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Mark as notified
      this.db.prepare("UPDATE telemetry_alerts SET notified = 1 WHERE id = ?").run(alert.id);
    } catch (error) {
      console.error("Failed to send Discord notification:", error);
    }
  }

  private async sendEmailNotification(alert: TelemetryAlert, config: { smtp: string; to: string[] }): Promise<void> {
    // Note: This would require an SMTP library
    // For now, just log to console
    console.log(`📧 Email notification to ${config.to.join(", ")}: ${alert.message}`);
  }

  /**
   * Record a performance trace
   */
  recordTrace(trace: PerformanceTrace): void {
    if (!this.config.tracingEnabled) return;

    // Sample traces based on sample rate
    if (Math.random() > this.config.tracingSampleRate) return;

    // Store in memory for quick access
    const key = `${trace.className}.${trace.methodName}`;
    if (!this.performanceTraces.has(key)) {
      this.performanceTraces.set(key, []);
    }
    this.performanceTraces.get(key)!.push(trace);

    // Keep only last 100 traces in memory
    const traces = this.performanceTraces.get(key)!;
    if (traces.length > 100) {
      traces.shift();
    }

    // Store in database
    this.db.prepare(`
      INSERT INTO performance_traces (
        timestamp, className, methodName, duration, args, result, environment, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trace.timestamp,
      trace.className,
      trace.methodName,
      trace.duration,
      trace.args ? JSON.stringify(trace.args) : null,
      trace.result ? JSON.stringify(trace.result) : null,
      trace.environment,
      trace.metadata ? JSON.stringify(trace.metadata) : null
    );

    // Log slow operations
    if (trace.duration > 1000) {
      console.log(`⏱️ SLOW: ${trace.className}.${trace.methodName} took ${trace.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance traces for a method
   */
  getTraces(className: string, methodName: string, limit: number = 100): PerformanceTrace[] {
    return this.db
      .prepare(`
        SELECT * FROM performance_traces
        WHERE className = ? AND methodName = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `)
      .all(className, methodName, limit)
      .map((row: any) => ({
        ...row,
        args: row.args ? JSON.parse(row.args) : undefined,
        result: row.result ? JSON.parse(row.result) : undefined,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      }));
  }

  /**
   * Get slow traces (duration > threshold)
   */
  getSlowTraces(thresholdMs: number = 1000, limit: number = 100): PerformanceTrace[] {
    return this.db
      .prepare(`
        SELECT * FROM performance_traces
        WHERE duration > ?
        ORDER BY duration DESC
        LIMIT ?
      `)
      .all(thresholdMs, limit)
      .map((row: any) => ({
        ...row,
        args: row.args ? JSON.parse(row.args) : undefined,
        result: row.result ? JSON.parse(row.result) : undefined,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      }));
  }

  /**
   * Get performance statistics for a method
   */
  getMethodStats(className: string, methodName: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const stats = this.db
      .prepare(`
        SELECT
          COUNT(*) as count,
          AVG(duration) as avgDuration,
          MIN(duration) as minDuration,
          MAX(duration) as maxDuration
        FROM performance_traces
        WHERE className = ? AND methodName = ?
      `)
      .get(className, methodName) as any;

    if (!stats || stats.count === 0) return null;

    // Get percentiles
    const durations = this.db
      .prepare(`
        SELECT duration FROM performance_traces
        WHERE className = ? AND methodName = ?
        ORDER BY duration
      `)
      .all(className, methodName)
      .map((row: any) => row.duration);

    const sorted = durations.sort((a: number, b: number) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

    return {
      count: stats.count,
      avgDuration: stats.avgDuration,
      minDuration: stats.minDuration,
      maxDuration: stats.maxDuration,
      p50,
      p95,
      p99,
    };
  }

  /**
   * Take a system snapshot
   */
  takeSnapshot(label: string = "manual", environment: string = process.env.ENVIRONMENT || "development"): SystemSnapshot {
    const snapshot: SystemSnapshot = {
      timestamp: Date.now(),
      label,
      environment,
      data: {
        servers: [], // Will be populated by calling code
        monitoring: {
          totalEvents: this.monitoring.getSummary().totalEvents,
          totalRequests: 0,
          activeConnections: 0,
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
        },
      },
    };

    // Save to database
    this.db.prepare(`
      INSERT INTO system_snapshots (timestamp, label, environment, data)
      VALUES (?, ?, ?, ?)
    `).run(snapshot.timestamp, snapshot.label, snapshot.environment, JSON.stringify(snapshot.data));

    // Save to file
    const filename = `${label}-${snapshot.timestamp}.json`;
    const filepath = path.join(SNAPSHOTS_DIR, filename);

    try {
      Bun.write(filepath, JSON.stringify(snapshot, null, 2));
      console.log(`📸 Snapshot saved: ${filename}`);
    } catch (error) {
      console.error("Failed to save snapshot to file:", error);
    }

    return snapshot;
  }

  /**
   * Get recent snapshots
   */
  getSnapshots(limit: number = 100): SystemSnapshot[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM system_snapshots
        ORDER BY timestamp DESC
        LIMIT ?
      `)
      .all(limit) as any[];

    return rows.map(row => ({
      ...row,
      data: JSON.parse(row.data),
    }));
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(limit: number = 100): TelemetryAlert[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM telemetry_alerts
        WHERE resolved = 0
        ORDER BY timestamp DESC
        LIMIT ?
      `)
      .all(limit) as any[];

    return rows.map(row => ({
      ...row,
      resolved: row.resolved === 1,
      notified: row.notified === 1,
      notificationChannels: row.notificationChannels ? JSON.parse(row.notificationChannels) : undefined,
    }));
  }

  /**
   * Resolve alert
   */
  resolveAlert(id: number): boolean {
    const result = this.db.prepare("UPDATE telemetry_alerts SET resolved = 1 WHERE id = ?").run(id);

    if (result.changes > 0) {
      // Remove from active alerts
      const alert = this.db.prepare("SELECT * FROM telemetry_alerts WHERE id = ?").get(id) as any;
      if (alert) {
        const alertKey = `${alert.type}-${alert.metric}-${alert.source}`;
        this.activeAlerts.delete(alertKey);
      }
    }

    return result.changes > 0;
  }

  /**
   * Get telemetry statistics
   */
  getTelemetryStats(): {
    alerts: {
      total: number;
      active: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
    };
    traces: {
      total: number;
      slowCount: number;
      avgDuration: number;
    };
    snapshots: {
      total: number;
      latest: string;
    };
  } {
    // Alert stats
    const alertTotal = this.db.prepare("SELECT COUNT(*) as count FROM telemetry_alerts").get() as { count: number };
    const alertActive = this.db.prepare("SELECT COUNT(*) as count FROM telemetry_alerts WHERE resolved = 0").get() as { count: number };

    const alertByType = this.db
      .prepare("SELECT type, COUNT(*) as count FROM telemetry_alerts GROUP BY type")
      .all() as any[];
    const alertBySeverity = this.db
      .prepare("SELECT severity, COUNT(*) as count FROM telemetry_alerts GROUP BY severity")
      .all() as any[];

    // Trace stats
    const traceTotal = this.db.prepare("SELECT COUNT(*) as count FROM performance_traces").get() as { count: number };
    const traceSlow = this.db.prepare("SELECT COUNT(*) as count FROM performance_traces WHERE duration > 1000").get() as { count: number };
    const traceAvg = this.db.prepare("SELECT AVG(duration) as avg FROM performance_traces").get() as { avg: number | null };

    // Snapshot stats
    const snapshotTotal = this.db.prepare("SELECT COUNT(*) as count FROM system_snapshots").get() as { count: number };
    const latestSnapshot = this.db.prepare("SELECT label FROM system_snapshots ORDER BY timestamp DESC LIMIT 1").get() as any;

    return {
      alerts: {
        total: alertTotal.count,
        active: alertActive.count,
        byType: alertByType.reduce((acc, row) => ({ ...acc, [row.type]: row.count }), {}),
        bySeverity: alertBySeverity.reduce((acc, row) => ({ ...acc, [row.severity]: row.count }), {}),
      },
      traces: {
        total: traceTotal.count,
        slowCount: traceSlow.count,
        avgDuration: traceAvg.avg || 0,
      },
      snapshots: {
        total: snapshotTotal.count,
        latest: latestSnapshot?.label || "none",
      },
    };
  }

  /**
   * Cleanup old performance traces
   */
  cleanupPerformanceTraces(olderThanDays: number = 7): number {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    const result = this.db.prepare("DELETE FROM performance_traces WHERE timestamp < ?").run(cutoff);
    return result.changes;
  }

  /**
   * Cleanup old alerts
   */
  cleanupAlerts(olderThanDays: number = 30): number {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    // Only delete resolved alerts
    const result = this.db.prepare("DELETE FROM telemetry_alerts WHERE resolved = 1 AND timestamp < ?").run(cutoff);
    return result.changes;
  }

  /**
   * Update telemetry configuration
   */
  updateConfig(updates: Partial<TelemetryConfig>): void {
    if (updates.alertThresholds) {
      this.config.alertThresholds = { ...this.config.alertThresholds, ...updates.alertThresholds };
    }
    if (updates.notificationChannels) {
      this.config.notificationChannels = { ...this.config.notificationChannels, ...updates.notificationChannels };
    }
    if (updates.snapshotInterval !== undefined) {
      this.config.snapshotInterval = updates.snapshotInterval;
    }
    if (updates.tracingEnabled !== undefined) {
      this.config.tracingEnabled = updates.tracingEnabled;
    }
    if (updates.tracingSampleRate !== undefined) {
      this.config.tracingSampleRate = updates.tracingSampleRate;
    }
  }

  /**
   * Get active alerts for an environment
   */
  getActiveAlertsForEnvironment(environment: string, limit: number = 100): TelemetryAlert[] {
    return this.db.prepare(`
      SELECT * FROM telemetry_alerts
      WHERE environment = ? AND resolved = 0
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(environment, limit) as TelemetryAlert[];
  }

  /**
   * Get traces by method key (format: "ClassName.methodName")
   */
  getTracesByMethodKey(methodKey?: string, limit: number = 100): PerformanceTrace[] {
    if (!methodKey) {
      return this.db.prepare(`
        SELECT * FROM performance_traces
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit) as PerformanceTrace[];
    }

    const [className, methodName] = methodKey.split('.');
    return this.getTraces(className, methodName, limit);
  }

  /**
   * Get trace statistics for a method
   */
  getTraceStatistics(methodKey?: string): { methodKey: string; count: number; min: number; max: number; avg: number; p50: number; p95: number; p99: number } | { methodKey: string; count: number; min: number; max: number; avg: number; p50: number; p95: number; p99: number }[] {
    if (!methodKey) {
      // Get stats for all methods
      const methodKeys = this.db.prepare(`
        SELECT DISTINCT className || '.' || methodName as methodKey
        FROM performance_traces
      `).all() as { methodKey: string }[];

      return methodKeys.map(m => this.getTraceStatistics(m.methodKey) as any).flat();
    }

    const [className, methodName] = methodKey.split('.');
    const stats = this.getMethodStats(className, methodName);

    return {
      methodKey,
      count: stats.count,
      min: stats.min,
      max: stats.max,
      avg: stats.avg,
      p50: stats.p50,
      p95: stats.p95,
      p99: stats.p99,
    };
  }

  /**
   * Clear old traces by hours
   */
  clearOldTraces(olderThanHours: number): void {
    this.cleanupPerformanceTraces(olderThanHours / 24);
  }

  /**
   * Get latest snapshot for environment
   */
  getLatestSnapshot(environment: string): SystemSnapshot | null {
    const snapshot = this.db.prepare(`
      SELECT * FROM system_snapshots
      WHERE environment = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(environment) as any;

    if (!snapshot) return null;

    return {
      id: snapshot.id,
      timestamp: snapshot.timestamp,
      label: snapshot.label,
      environment: snapshot.environment,
      data: JSON.parse(snapshot.data),
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): TelemetryConfig {
    return { ...this.config };
  }

  /**
   * Get telemetry system health
   */
  getHealth(): {
    status: string;
    uptime: number;
    databaseConnected: boolean;
    activeAlerts: number;
    totalTraces: number;
    totalSnapshots: number;
    lastSnapshot: number | null;
  } {
    const stats = this.getTelemetryStats();
    const latestSnapshot = this.getLatestSnapshot(process.env.ENVIRONMENT || "development");

    return {
      status: "healthy",
      uptime: process.uptime(),
      databaseConnected: true,
      activeAlerts: this.getActiveAlerts().length,
      totalTraces: stats.totalTraces,
      totalSnapshots: stats.totalSnapshots,
      lastSnapshot: latestSnapshot?.timestamp || null,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

/**
 * Performance tracing decorator
 */
export function tracePerformance(
  target: any,
  key: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const original = descriptor.value;
  const className = target.constructor.name;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    const environment = process.env.ENVIRONMENT || "development";

    try {
      const result = await original.apply(this, args);
      const end = performance.now();
      const duration = end - start;

      // Get telemetry system instance if available
      // (This would need to be passed in differently in a real implementation)
      if ((this as any).telemetry) {
        (this as any).telemetry.recordTrace({
          timestamp: Date.now(),
          className,
          methodName: key,
          duration,
          args,
          result,
          environment,
        });
      }

      // Log slow operations
      if (duration > 100) {
        console.log(`⏱️ ${className}.${key} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;

      console.log(`❌ ${className}.${key} failed after ${duration.toFixed(2)}ms:`, error);

      throw error;
    }
  };

  return descriptor;
}
