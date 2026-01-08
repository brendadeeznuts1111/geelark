// Feature Flags
export enum FeatureFlag {
  // Environment
  ENV_DEVELOPMENT = 'ENV_DEVELOPMENT',
  ENV_PRODUCTION = 'ENV_PRODUCTION',

  // Feature Tier
  FEAT_PREMIUM = 'FEAT_PREMIUM',

  // Resilience
  FEAT_AUTO_HEAL = 'FEAT_AUTO_HEAL',

  // Monitoring
  FEAT_NOTIFICATIONS = 'FEAT_NOTIFICATIONS',

  // Security
  FEAT_ENCRYPTION = 'FEAT_ENCRYPTION',

  // Testing
  FEAT_MOCK_API = 'FEAT_MOCK_API',

  // Logging
  FEAT_EXTENDED_LOGGING = 'FEAT_EXTENDED_LOGGING',

  // Monitoring
  FEAT_ADVANCED_MONITORING = 'FEAT_ADVANCED_MONITORING',

  // Performance
  FEAT_BATCH_PROCESSING = 'FEAT_BATCH_PROCESSING',

  // Validation
  FEAT_VALIDATION_STRICT = 'FEAT_VALIDATION_STRICT',

  // Platform
  PLATFORM_ANDROID = 'PLATFORM_ANDROID',

  // Integration
  INTEGRATION_GEELARK_API = 'INTEGRATION_GEELARK_API',
  INTEGRATION_PROXY_SERVICE = 'INTEGRATION_PROXY_SERVICE',
  INTEGRATION_EMAIL_SERVICE = 'INTEGRATION_EMAIL_SERVICE',
  INTEGRATION_SMS_SERVICE = 'INTEGRATION_SMS_SERVICE',
}

// Critical Levels
export enum CriticalLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  PROD_CRITICAL = 'PROD_CRITICAL',
}

// Log Types
export enum LogType {
  FEATURE_CHANGE = 'FEATURE_CHANGE',
  SECURITY_EVENT = 'SECURITY_EVENT',
  INTEGRATION_EVENT = 'INTEGRATION_EVENT',
  PERFORMANCE_METRIC = 'PERFORMANCE_METRIC',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  AUDIT_TRAIL = 'AUDIT_TRAIL',
  HEALTH_CHECK = 'HEALTH_CHECK',
}

// Log Levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Health Scores
export enum HealthScore {
  HEALTHY = 'HEALTHY',      // 90-100%
  DEGRADED = 'DEGRADED',    // 70-89%
  IMPAIRED = 'IMPAIRED',    // 50-69%
  CRITICAL = 'CRITICAL',    // <50%
  OFFLINE = 'OFFLINE',      // 0%
}

// Alert Severity
export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// Build Types
export enum BuildType {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION_LITE = 'PRODUCTION_LITE',
  PRODUCTION_STANDARD = 'PRODUCTION_STANDARD',
  PRODUCTION_PREMIUM = 'PRODUCTION_PREMIUM',
  TEST = 'TEST',
  AUDIT = 'AUDIT',
}

// Platform Types
export enum PlatformType {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

// Integration Status
export enum IntegrationStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
  UNKNOWN = 'UNKNOWN',
}

// Feature Flag Configuration
export interface FeatureFlagConfig {
  flag: FeatureFlag;
  enabled: boolean;
  criticalLevel: CriticalLevel;
  logHook: LogType;
  badgeEnabled: string;
  badgeDisabled: string;
  buildTimeImpact: string;
  memoryImpact?: string;
  cpuImpact?: string;
  bundleSizeImpact?: string;
  startupTimeImpact?: string;
}

// Log Entry
export interface LogEntry {
  type: LogType;
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  prefix: string;
}

// Health Status
export interface HealthStatus {
  score: number;
  status: HealthScore;
  color: string;
  badge: string;
  enabledPercentage: number;
  criticalFeaturesEnabled: boolean;
}

// Integration Health
export interface IntegrationHealth {
  service: string;
  flag: FeatureFlag;
  status: IntegrationStatus;
  lastCheck: Date;
  responseTime?: number;
  error?: string;
}

// Dashboard Component
export interface DashboardComponent {
  name: string;
  displayType: string;
  updateFrequency: string;
  dataSource: string;
  widthCalculation: string;
  ansiSupport: boolean;
  exportFormats: string[];
}

// Alert Configuration
export interface AlertConfig {
  type: string;
  triggerCondition: string;
  severity: AlertSeverity;
  notificationChannels: string[];
  responseTime: string;
  autoRecovery: boolean;
  escalationPath: string;
}

// Performance Metrics
export interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

// System Configuration
export interface SystemConfig {
  environment: 'development' | 'production';
  platform: PlatformType;
  buildType: BuildType;
  featureFlags: Map<FeatureFlag, boolean>;
  apiEndpoints: {
    geelark?: string;
    proxy?: string;
    email?: string;
    sms?: string;
  };
  logging: {
    level: LogLevel;
    externalServices: string[];
    retention: number;
  };
  security: {
    encryption: boolean;
    validation: 'strict' | 'lenient';
    auditTrail: boolean;
  };
  monitoring: {
    advanced: boolean;
    notifications: boolean;
    healthChecks: boolean;
  };
}