import { FEATURE_FLAG_CONFIGS } from "./config";
import {
    CriticalLevel,
    FeatureFlag,
    FeatureFlagConfig,
    HealthScore,
    HealthStatus,
} from "./types";

export class FeatureRegistry {
  private flags: Map<FeatureFlag, boolean> = new Map();
  private configs: Map<FeatureFlag, FeatureFlagConfig> = new Map();
  private changeListeners: ((flag: FeatureFlag, enabled: boolean) => void)[] =
    [];

  constructor(initialFlags?: Partial<Record<FeatureFlag, boolean>> | Map<FeatureFlag, boolean>) {
    // Convert Map to Record if needed
    let flagsRecord: Partial<Record<FeatureFlag, boolean>> = {};
    if (initialFlags instanceof Map) {
      for (const [key, value] of initialFlags) {
        flagsRecord[key] = value;
      }
    } else {
      flagsRecord = initialFlags || {};
    }

    // Initialize environment flags FIRST to avoid circular dependency
    const envDevelopmentDefault = flagsRecord?.[FeatureFlag.ENV_DEVELOPMENT] ?? true;
    this.flags.set(FeatureFlag.ENV_DEVELOPMENT, envDevelopmentDefault);

    const envProductionDefault = flagsRecord?.[FeatureFlag.ENV_PRODUCTION] ?? false;
    this.flags.set(FeatureFlag.ENV_PRODUCTION, envProductionDefault);

    // Now initialize all other flags with their default states
    Object.values(FeatureFlag).forEach((flag) => {
      // Skip environment flags, already initialized
      if (
        flag === FeatureFlag.ENV_DEVELOPMENT ||
        flag === FeatureFlag.ENV_PRODUCTION
      ) {
        return;
      }

      const config = FEATURE_FLAG_CONFIGS[flag];
      if (config) {
        this.configs.set(flag, {
          ...config,
          enabled: flagsRecord?.[flag] ?? this.getDefaultState(flag),
        });
        this.flags.set(
          flag,
          flagsRecord?.[flag] ?? this.getDefaultState(flag)
        );
      }
    });

    // Initialize configs for environment flags
    const envDevConfig = FEATURE_FLAG_CONFIGS[FeatureFlag.ENV_DEVELOPMENT];
    if (envDevConfig) {
      this.configs.set(FeatureFlag.ENV_DEVELOPMENT, {
        ...envDevConfig,
        enabled: envDevelopmentDefault,
      });
    }

    const envProdConfig = FEATURE_FLAG_CONFIGS[FeatureFlag.ENV_PRODUCTION];
    if (envProdConfig) {
      this.configs.set(FeatureFlag.ENV_PRODUCTION, {
        ...envProdConfig,
        enabled: envProductionDefault,
      });
    }
  }

  private getDefaultState(flag: FeatureFlag): boolean {
    // Environment flags default to development
    if (flag === FeatureFlag.ENV_DEVELOPMENT) return true;
    if (flag === FeatureFlag.ENV_PRODUCTION) return false;

    // Platform defaults to Android
    if (flag === FeatureFlag.PLATFORM_ANDROID) return true;

    // Most features default to enabled in development
    if (this.isEnabled(FeatureFlag.ENV_DEVELOPMENT)) {
      return true;
    }

    // Critical features default to enabled
    const config = FEATURE_FLAG_CONFIGS[flag];
    return (
      config?.criticalLevel === CriticalLevel.CRITICAL ||
      config?.criticalLevel === CriticalLevel.PROD_CRITICAL
    );
  }

  isEnabled(flag: FeatureFlag): boolean {
    return /*@__PURE__*/ this.flags.get(flag) ?? false;
  }

  enable(flag: FeatureFlag): void {
    if (this.flags.get(flag) !== true) {
      this.flags.set(flag, true);
      this.updateConfig(flag, true);
      this.notifyChange(flag, true);
    }
  }

  disable(flag: FeatureFlag): void {
    if (this.flags.get(flag) !== false) {
      this.flags.set(flag, false);
      this.updateConfig(flag, false);
      this.notifyChange(flag, false);
    }
  }

  toggle(flag: FeatureFlag): void {
    const current = this.isEnabled(flag);
    if (current) {
      this.disable(flag);
    } else {
      this.enable(flag);
    }
  }

  set(flag: FeatureFlag, enabled: boolean): void {
    if (enabled) {
      this.enable(flag);
    } else {
      this.disable(flag);
    }
  }

  private updateConfig(flag: FeatureFlag, enabled: boolean): void {
    const config = this.configs.get(flag);
    if (config) {
      config.enabled = enabled;
    }
  }

  private notifyChange(flag: FeatureFlag, enabled: boolean): void {
    this.changeListeners.forEach((listener) => listener(flag, enabled));
  }

  onChange(listener: (flag: FeatureFlag, enabled: boolean) => void): void {
    this.changeListeners.push(listener);
  }

  offChange(listener: (flag: FeatureFlag, enabled: boolean) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  getConfig(flag: FeatureFlag): FeatureFlagConfig | undefined {
    return this.configs.get(flag);
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.keys());
  }

  getEnabledFlags(): FeatureFlag[] {
    return Array.from(this.flags.entries())
      .filter(([_, enabled]) => enabled)
      .map(([flag, _]) => flag);
  }

  getDisabledFlags(): FeatureFlag[] {
    return Array.from(this.flags.entries())
      .filter(([_, enabled]) => !enabled)
      .map(([flag, _]) => flag);
  }

  getCriticalFlags(): FeatureFlag[] {
    return Array.from(this.configs.entries())
      .filter(
        ([_, config]) =>
          config.criticalLevel === CriticalLevel.CRITICAL ||
          config.criticalLevel === CriticalLevel.PROD_CRITICAL
      )
      .map(([flag, _]) => flag);
  }

  getHealthStatus(): HealthStatus {
    const allFlags = this.getAllFlags();
    const enabledFlags = this.getEnabledFlags();
    const criticalFlags = this.getCriticalFlags();
    const enabledCriticalFlags = criticalFlags.filter((flag) =>
      this.isEnabled(flag)
    );

    const enabledPercentage = (enabledFlags.length / allFlags.length) * 100;
    const criticalFeaturesEnabled =
      enabledCriticalFlags.length === criticalFlags.length;

    let status: HealthScore;
    let color: string;
    let badge: string;

    if (enabledPercentage >= 90) {
      status = HealthScore.HEALTHY;
      color = "#28a745";
      badge = "✅ HEALTHY";
    } else if (enabledPercentage >= 70) {
      status = HealthScore.DEGRADED;
      color = "#ffc107";
      badge = "⚠️ DEGRADED";
    } else if (enabledPercentage >= 50) {
      status = HealthScore.IMPAIRED;
      color = "#fd7e14";
      badge = "🔄 IMPAIRED";
    } else if (enabledPercentage > 0) {
      status = HealthScore.CRITICAL;
      color = "#dc3545";
      badge = "🚨 CRITICAL";
    } else {
      status = HealthScore.OFFLINE;
      color = "#343a40";
      badge = "💀 OFFLINE";
    }

    return {
      score: Math.round(enabledPercentage),
      status,
      color,
      badge,
      enabledPercentage: Math.round(enabledPercentage),
      criticalFeaturesEnabled,
    };
  }

  getBadge(flag: FeatureFlag): string {
    const config = this.configs.get(flag);
    if (!config) return "❓ UNKNOWN";

    return this.isEnabled(flag) ? config.badgeEnabled : config.badgeDisabled;
  }

  getStatusSummary(): string {
    const health = this.getHealthStatus();
    const enabledCount = this.getEnabledFlags().length;
    const totalCount = this.getAllFlags().length;

    return `${health.badge} (${enabledCount}/${totalCount} features enabled)`;
  }

  exportState(): Record<string, boolean> {
    const state: Record<string, boolean> = {};
    this.flags.forEach((enabled, flag) => {
      state[flag] = enabled;
    });
    return state;
  }

  importState(state: Record<string, boolean>): void {
    Object.entries(state).forEach(([flag, enabled]) => {
      if (Object.values(FeatureFlag).includes(flag as FeatureFlag)) {
        this.set(flag as FeatureFlag, enabled);
      }
    });
  }

  resetToDefaults(): void {
    this.flags.clear();
    this.configs.clear();

    // Reinitialize with defaults
    Object.values(FeatureFlag).forEach((flag) => {
      const config = FEATURE_FLAG_CONFIGS[flag];
      if (config) {
        const defaultEnabled = this.getDefaultState(flag);
        this.configs.set(flag, { ...config, enabled: defaultEnabled });
        this.flags.set(flag, defaultEnabled);
      }
    });
  }

  // Removed CLI compatibility aliases - use main methods instead:
  // enableFeature → use enable()
  // disableFeature → use disable()
  // toggleFeature → use toggle()
  // getFlagConfig → use getConfig()

  getEnabledCount(): number {
    return this.getEnabledFlags().length;
  }

  getTotalCount(): number {
    return this.getAllFlags().length;
  }

  rotateFlags(): void {
    // Quarterly maintenance - rotate non-critical flags
    const nonCriticalFlags = this.getAllFlags().filter((flag) => {
      const config = this.getConfig(flag);
      return (
        config &&
        config.criticalLevel !== CriticalLevel.CRITICAL &&
        config.criticalLevel !== CriticalLevel.PROD_CRITICAL
      );
    });

    // Randomly enable/disable non-critical flags
    nonCriticalFlags.forEach((flag) => {
      if (Math.random() > 0.5) {
        this.toggle(flag);
      }
    });
  }

  displayAllFlags(): void {
    console.log("Feature Flag Status:");
    console.log("=".repeat(50));

    this.getAllFlags().forEach((flag) => {
      const enabled = this.isEnabled(flag);
      const config = this.getConfig(flag);
      const badge = this.getBadge(flag);
      const criticalLevel = config?.criticalLevel || "UNKNOWN";

      const status = enabled ? "✅" : "❌";
      const color = enabled ? "\x1b[32m" : "\x1b[31m"; // green/red
      const reset = "\x1b[0m";

      console.log(
        `${color}${status} ${flag}${reset} - ${badge} (${criticalLevel})`
      );
    });

    const health = this.getHealthStatus();
    console.log("=".repeat(50));
    console.log(`Overall Status: ${health.badge} (${health.score}% enabled)`);
  }
}
