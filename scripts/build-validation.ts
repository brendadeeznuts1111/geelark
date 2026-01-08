#!/usr/bin/env bun

/**
 * 🔒 Build Security Validation Script
 *
 * Validates build configurations for security compliance
 * and prevents dangerous feature flag combinations
 */

/// <reference path="./types.d.ts" />
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface SecurityRule {
  name: string;
  description: string;
  category: 'security' | 'performance' | 'compliance' | 'architecture';
  validate: (buildConfig: any) => boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
  documentation?: string;
}

interface ValidationResult {
  rule: string;
  category: string;
  passed: boolean;
  severity: string;
  message: string;
  recommendation?: string;
  documentation?: string;
}

interface BuildMetrics {
  bundleSizeEstimate: number;
  featureCount: number;
  securityScore: number;
  performanceScore: number;
  complianceScore: number;
}

interface EnhancedValidationResult {
  buildType: string;
  timestamp: string;
  metrics: BuildMetrics;
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  overallScore: number;
  recommendation: string;
}

class BuildSecurityValidator {
  private rules: SecurityRule[] = [
    // === SECURITY RULES ===
    {
      name: 'no-debug-in-production',
      description: 'Debug features must be disabled in production builds',
      category: 'security',
      validate: (config) => {
        if (config.ENV_PRODUCTION) {
          return !config.DEBUG_MODE && !config.DEV_TOOLS && !config.HOT_RELOAD;
        }
        return true;
      },
      severity: 'critical',
      recommendation: 'Remove DEBUG_MODE, DEV_TOOLS, and HOT_RELOAD from production builds',
      documentation: 'https://security.example.com/production-debugging'
    },
    {
      name: 'encryption-required-in-production',
      description: 'Encryption must be enabled in production builds',
      category: 'security',
      validate: (config) => {
        if (config.ENV_PRODUCTION) {
          return config.FEAT_ENCRYPTION === true;
        }
        return true;
      },
      severity: 'critical',
      recommendation: 'Enable FEAT_ENCRYPTION in all production configurations',
      documentation: 'https://security.example.com/encryption-requirements'
    },
    {
      name: 'no-mock-api-in-production',
      description: 'Mock API must be disabled in production builds',
      category: 'security',
      validate: (config) => {
        if (config.ENV_PRODUCTION) {
          return config.FEAT_MOCK_API !== true;
        }
        return true;
      },
      severity: 'high',
      recommendation: 'Replace FEAT_MOCK_API with real API endpoints in production',
      documentation: 'https://security.example.com/api-security'
    },
    {
      name: 'audit-mode-security',
      description: 'Audit mode should have all security features enabled',
      category: 'compliance',
      validate: (config) => {
        if (config.AUDIT_MODE) {
          return config.FEAT_ENCRYPTION &&
                 config.FEAT_VALIDATION_STRICT &&
                 config.SECURITY_VALIDATION;
        }
        return true;
      },
      severity: 'high',
      recommendation: 'Enable complete security stack for audit builds',
      documentation: 'https://compliance.example.com/audit-requirements'
    },

    // === PERFORMANCE RULES ===
    {
      name: 'no-conflicting-environments',
      description: 'Cannot have both development and production flags',
      category: 'architecture',
      validate: (config) => {
        return !(config.ENV_DEVELOPMENT && config.ENV_PRODUCTION);
      },
      severity: 'critical',
      recommendation: 'Use mutually exclusive environment flags',
      documentation: 'https://architecture.example.com/environment-isolation'
    },
    {
      name: 'feature-bloat-prevention',
      description: 'Too many features may impact bundle size',
      category: 'performance',
      validate: (config) => {
        const featureCount = Object.keys(config).filter(key => key.startsWith('FEAT_')).length;
        return featureCount <= 15;
      },
      severity: 'medium',
      recommendation: 'Consider feature flag consolidation or lazy loading',
      documentation: 'https://performance.example.com/bundle-optimization'
    },
    {
      name: 'premium-feature-consistency',
      description: 'Premium features should be consistent',
      category: 'architecture',
      validate: (config) => {
        if (config.FEAT_PREMIUM) {
          return config.FEAT_ADVANCED_MONITORING &&
                 config.FEAT_BATCH_PROCESSING;
        }
        return true;
      },
      severity: 'low',
      recommendation: 'Enable related features when using premium tier',
      documentation: 'https://architecture.example.com/feature-consistency'
    },

    // === COMPLIANCE RULES ===
    {
      name: 'strict-validation-in-production',
      description: 'Strict validation should be enabled in production',
      category: 'compliance',
      validate: (config) => {
        if (config.ENV_PRODUCTION) {
          return config.FEAT_VALIDATION_STRICT === true;
        }
        return true;
      },
      severity: 'medium',
      recommendation: 'Enable FEAT_VALIDATION_STRICT for production builds',
      documentation: 'https://compliance.example.com/validation-standards'
    },
    {
      name: 'monitoring-compliance',
      description: 'Production builds should have monitoring enabled',
      category: 'compliance',
      validate: (config) => {
        if (config.ENV_PRODUCTION) {
          return config.FEAT_NOTIFICATIONS || config.FEAT_ADVANCED_MONITORING;
        }
        return true;
      },
      severity: 'medium',
      recommendation: 'Enable monitoring features for production observability',
      documentation: 'https://compliance.example.com/monitoring-requirements'
    },

    // === ADVANCED SECURITY RULES ===
    {
      name: 'api-key-security',
      description: 'API keys should not be in development builds',
      category: 'security',
      validate: (config) => {
        if (config.ENV_DEVELOPMENT) {
          return config.FEAT_MOCK_API === true;
        }
        return true;
      },
      severity: 'high',
      recommendation: 'Use mock APIs in development to protect production keys',
      documentation: 'https://security.example.com/api-key-protection'
    },
    {
      name: 'batch-processing-security',
      description: 'Batch processing should have validation enabled',
      category: 'security',
      validate: (config) => {
        if (config.FEAT_BATCH_PROCESSING) {
          return config.FEAT_VALIDATION_STRICT === true;
        }
        return true;
      },
      severity: 'medium',
      recommendation: 'Enable strict validation when using batch processing',
      documentation: 'https://security.example.com/batch-processing'
    }
  ];

  private loadBuildConfig(buildType: string): any {
    const configPath = join(process.cwd(), 'configs', 'build-defines.json');

    if (!existsSync(configPath)) {
      throw new Error(`Build config not found: ${configPath}`);
    }

    const configs = JSON.parse(readFileSync(configPath, 'utf-8'));

    if (!configs[buildType]) {
      throw new Error(`Build type not found: ${buildType}`);
    }

    return configs[buildType];
  }

  private calculateBuildMetrics(config: any): BuildMetrics {
    const featureCount = Object.keys(config).filter(key => key.startsWith('FEAT_')).length;

    // Estimate bundle size based on features
    const baseSize = 30000; // 30KB base
    const featureSize = featureCount * 2000; // 2KB per feature
    const bundleSizeEstimate = baseSize + featureSize;

    // Calculate scores
    const securityScore = this.calculateSecurityScore(config);
    const performanceScore = this.calculatePerformanceScore(config, featureCount);
    const complianceScore = this.calculateComplianceScore(config);

    return {
      bundleSizeEstimate,
      featureCount,
      securityScore,
      performanceScore,
      complianceScore
    };
  }

  private calculateSecurityScore(config: any): number {
    let score = 100;

    if (config.ENV_PRODUCTION) {
      if (!config.FEAT_ENCRYPTION) score -= 30;
      if (config.FEAT_MOCK_API) score -= 20;
      if (config.DEBUG_MODE) score -= 25;
      if (!config.FEAT_VALIDATION_STRICT) score -= 15;
    }

    if (config.AUDIT_MODE) {
      if (!config.SECURITY_VALIDATION) score -= 20;
    }

    return Math.max(0, score);
  }

  private calculatePerformanceScore(config: any, featureCount: number): number {
    let score = 100;

    // Penalty for too many features
    if (featureCount > 15) score -= (featureCount - 15) * 5;

    // Bonus for performance optimizations
    if (config.FEAT_BATCH_PROCESSING) score += 10;
    if (config.ENV_PRODUCTION && !config.DEBUG_MODE) score += 15;

    return Math.min(100, Math.max(0, score));
  }

  private calculateComplianceScore(config: any): number {
    let score = 100;

    if (config.ENV_PRODUCTION) {
      if (!config.FEAT_VALIDATION_STRICT) score -= 20;
      if (!config.FEAT_NOTIFICATIONS && !config.FEAT_ADVANCED_MONITORING) score -= 15;
    }

    if (config.AUDIT_MODE) {
      if (!config.FEAT_ENCRYPTION) score -= 25;
      if (!config.FEAT_EXTENDED_LOGGING) score -= 10;
    }

    return Math.max(0, score);
  }

  private calculateOverallScore(metrics: BuildMetrics): number {
    return Math.round(
      (metrics.securityScore * 0.4 +
       metrics.performanceScore * 0.3 +
       metrics.complianceScore * 0.3)
    );
  }

  private generateRecommendation(results: ValidationResult[], overallScore: number): string {
    const criticalFailures = results.filter(r => !r.passed && r.severity === 'critical');
    const highFailures = results.filter(r => !r.passed && r.severity === 'high');

    if (criticalFailures.length > 0) {
      return '🚨 CRITICAL: Fix critical security issues before deployment';
    }

    if (highFailures.length > 0) {
      return '⚠️  HIGH PRIORITY: Address high-severity issues for production readiness';
    }

    if (overallScore >= 90) {
      return '✅ EXCELLENT: Build is production-ready with high standards';
    } else if (overallScore >= 80) {
      return '🟡 GOOD: Build is acceptable but has room for improvement';
    } else {
      return '🔴 NEEDS ATTENTION: Multiple issues should be addressed';
    }
  }

  private validateBuild(buildType: string): EnhancedValidationResult {
    const config = this.loadBuildConfig(buildType);
    const metrics = this.calculateBuildMetrics(config);
    const results: ValidationResult[] = [];

    for (const rule of this.rules) {
      try {
        const passed = rule.validate(config);
        results.push({
          rule: rule.name,
          category: rule.category,
          passed,
          severity: rule.severity,
          message: passed
            ? `✅ ${rule.description}`
            : `❌ ${rule.description}`,
          recommendation: rule.recommendation,
          documentation: rule.documentation
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          rule: rule.name,
          category: rule.category,
          passed: false,
          severity: 'critical',
          message: `❌ Error validating rule: ${errorMessage}`,
          recommendation: 'Fix validation logic',
          documentation: 'https://docs.example.com/validation-errors'
        });
      }
    }

    // Calculate summary
    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      critical: results.filter(r => !r.passed && r.severity === 'critical').length,
      high: results.filter(r => !r.passed && r.severity === 'high').length,
      medium: results.filter(r => !r.passed && r.severity === 'medium').length,
      low: results.filter(r => !r.passed && r.severity === 'low').length
    };

    const overallScore = this.calculateOverallScore(metrics);
    const recommendation = this.generateRecommendation(results, overallScore);

    return {
      buildType,
      timestamp: new Date().toISOString(),
      metrics,
      results,
      summary,
      overallScore,
      recommendation
    };
  }

  private printResults(buildType: string, result: EnhancedValidationResult): void {
    console.log(`\n🔒 Enhanced Security Validation Results for: ${buildType}`);
    console.log('='.repeat(70));
    console.log(`📅 Timestamp: ${result.timestamp}`);
    console.log(`📊 Overall Score: ${result.overallScore}/100`);
    console.log(`🎯 ${result.recommendation}`);

    // Print metrics
    console.log('\n📈 Build Metrics:');
    console.log(`   Estimated Bundle Size: ${(result.metrics.bundleSizeEstimate / 1024).toFixed(1)}KB`);
    console.log(`   Feature Count: ${result.metrics.featureCount}`);
    console.log(`   Security Score: ${result.metrics.securityScore}/100`);
    console.log(`   Performance Score: ${result.metrics.performanceScore}/100`);
    console.log(`   Compliance Score: ${result.metrics.complianceScore}/100`);

    // Print results by category
    const categories = ['security', 'performance', 'compliance', 'architecture'];

    for (const category of categories) {
      const categoryResults = result.results.filter(r => r.category === category);
      const failures = categoryResults.filter(r => !r.passed);
      const passed = categoryResults.filter(r => r.passed);

      console.log(`\n📂 ${category.toUpperCase()} (${passed.length}/${categoryResults.length} passed):`);

      if (failures.length > 0) {
        failures.forEach(r => {
          console.log(`   ${r.message}`);
          if (r.recommendation) {
            console.log(`   💡 ${r.recommendation}`);
          }
        });
      }

      if (passed.length > 0 && failures.length === 0) {
        console.log(`   ✅ All ${category} checks passed`);
      }
    }

    // Print summary
    console.log('\n📋 Validation Summary:');
    console.log(`   Total Rules: ${result.summary.total}`);
    console.log(`   Passed: ${result.summary.passed}`);
    console.log(`   Failed: ${result.summary.failed}`);
    console.log(`   Critical: ${result.summary.critical}`);
    console.log(`   High: ${result.summary.high}`);
    console.log(`   Medium: ${result.summary.medium}`);
    console.log(`   Low: ${result.summary.low}`);

    // Final assessment
    if (result.summary.critical > 0) {
      console.log('\n❌ BUILD REJECTED: Critical security violations detected');
      process.exit(1);
    } else if (result.summary.high > 0) {
      console.log('\n⚠️  BUILD WARNING: High severity issues detected');
    } else if (result.summary.failed === 0) {
      console.log('\n✅ BUILD APPROVED: All security validations passed');
    } else {
      console.log('\n🟡 BUILD CONDITIONAL: Minor issues detected');
    }
  }

  public validate(buildType: string): void {
    try {
      const result = this.validateBuild(buildType);
      this.printResults(buildType, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Validation failed: ${errorMessage}`);
      process.exit(1);
    }
  }

  public validateAll(): void {
    const configPath = join(process.cwd(), 'configs', 'build-defines.json');
    const configs = JSON.parse(readFileSync(configPath, 'utf-8'));

    console.log('🔒 Validating all build configurations...');

    for (const buildType of Object.keys(configs)) {
      this.validate(buildType);
    }
  }

  public generateReport(buildType: string): EnhancedValidationResult {
    return this.validateBuild(buildType);
  }
}

// CLI interface - Universal approach for all environments
function isMainModule(): boolean {
  // For Bun runtime
  if (typeof globalThis.Bun !== 'undefined') {
    return globalThis.Bun.main === process.argv[1];
  }

  // For Node.js or other environments - check if this file is being executed directly
  return require.main === module || process.argv[1] === __filename;
}

if (isMainModule()) {
  const validator = new BuildSecurityValidator();
  const args = process.argv.slice(2);

  if (args.includes('--all')) {
    validator.validateAll();
  } else if (args.includes('--report')) {
    const buildTypeIndex = args.indexOf('--report') + 1;
    const buildType = args[buildTypeIndex];
    if (!buildType) {
      console.error('Error: --report requires a build type');
      process.exit(1);
    }
    const report = validator.generateReport(buildType);
    console.log(JSON.stringify(report, null, 2));
  } else if (args[0]) {
    validator.validate(args[0]);
  } else {
    console.log('Usage: bun run build-validation.ts [build-type] [--all] [--report]');
    console.log('');
    console.log('Available build types:');
    console.log('  development');
    console.log('  production-lite');
    console.log('  production-standard');
    console.log('  production-premium');
    console.log('  security-audit');
    console.log('');
    console.log('Options:');
    console.log('  --all      Validate all build configurations');
    console.log('  --report   Generate JSON report for specified build type');
    console.log('');
    console.log('Examples:');
    console.log('  bun run build-validation.ts production-premium');
    console.log('  bun run build-validation.ts --all');
    console.log('  bun run build-validation.ts --report production-premium');
    process.exit(1);
  }
}

export { BuildSecurityValidator };
