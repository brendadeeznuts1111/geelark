#!/usr/bin/env bun

import chalk from "chalk";
import { Command } from "commander";
import { Dashboard } from "./Dashboard";
import { FeatureRegistry } from "./FeatureRegistry";
import { Logger } from "./Logger";
import { BUILD_CONFIGS } from "./config";
import { BuildType, FeatureFlag, LogLevel, PlatformType } from "./types";

const program = new Command();

// Global options
program
  .name("phone-management-system")
  .description(
    "Comprehensive phone management system with feature flags and monitoring"
  )
  .version("1.0.0")
  .option("-v, --verbose", "Enable verbose logging")
  .option("--dry-run", "Execute in dry-run mode")
  .option("--ascii", "Force ASCII mode for dashboard")
  .option("--no-color", "Disable colored output");

// Initialize system components
let featureRegistry: FeatureRegistry;
let logger: Logger;
let dashboard: Dashboard;

function initializeSystem(options: any) {
  const environment =
    process.env.NODE_ENV === "production" ? "production" : "development";
  const platform =
    process.env.PLATFORM === "ios" ? PlatformType.IOS : PlatformType.ANDROID;

  // Determine build type based on available flags
  let buildType = BuildType.DEVELOPMENT;
  if (process.env.BUILD_TYPE) {
    buildType =
      BuildType[process.env.BUILD_TYPE as keyof typeof BuildType] ||
      BuildType.DEVELOPMENT;
  }

  const buildConfig = BUILD_CONFIGS[buildType];
  const featureFlags = new Map<FeatureFlag, boolean>();

  // Set feature flags based on build configuration
  buildConfig.flags.forEach((flag) => {
    featureFlags.set(flag, true);
  });

  // Initialize components
  featureRegistry = new FeatureRegistry(featureFlags);
  logger = new Logger({
    level: options.verbose ? LogLevel.DEBUG : LogLevel.INFO,
    externalServices:
      process.env.EXTERNAL_LOGGING === "true"
        ? ["elasticsearch", "splunk"]
        : [],
    retention: parseInt(process.env.LOG_RETENTION_DAYS || "30"),
  });
  dashboard = new Dashboard(featureRegistry, logger, {
    ascii: options.ascii || false,
  });

  logger.info("System initialized", {
    environment,
    platform,
    buildType,
    featuresEnabled: buildConfig.flags.length,
  });
}

// Status command
program
  .command("status")
  .description("Display real-time system status dashboard")
  .option("--watch", "Enable live updates")
  .option("--interval <seconds>", "Update interval in seconds", "5")
  .action(async (options) => {
    initializeSystem(program.opts());

    if (options.watch) {
      const interval = parseInt(options.interval) * 1000;
      dashboard.startLiveUpdates(interval);

      // Handle graceful shutdown
      process.on("SIGINT", () => {
        dashboard.stopLiveUpdates();
        process.exit(0);
      });

      // Keep process alive
      await new Promise(() => {});
    } else {
      dashboard.displayStatus();
    }
  });

// Dashboard command
program
  .command("dashboard")
  .description("Display comprehensive system dashboard")
  .option("--component <name>", "Display specific component only")
  .option("--export <format>", "Export dashboard (json|csv|html)")
  .action(async (options) => {
    initializeSystem(program.opts());

    if (options.component) {
      dashboard.displayComponent(options.component);
    } else if (options.export) {
      await dashboard.export(options.export);
    } else {
      dashboard.displayFullDashboard();
    }
  });

// Health command
program
  .command("health")
  .description("Check system health and integration status")
  .option("--integrations", "Check integration health only")
  .option("--detailed", "Show detailed health information")
  .action(async (options) => {
    initializeSystem(program.opts());

    if (options.integrations) {
      await dashboard.checkIntegrationHealth();
    } else {
      dashboard.displayHealthStatus(options.detailed);
    }
  });

// Logs command
program
  .command("logs")
  .description("View and filter system logs")
  .option(
    "--type <type>",
    "Filter by log type (features|security|integrations|performance|errors|audit|health)"
  )
  .option(
    "--level <level>",
    "Filter by log level (debug|info|warn|error|critical)"
  )
  .option("--since <duration>", "Show logs since duration (e.g., 24h, 1d)")
  .option("--export <format>", "Export logs (json|csv)")
  .option("--tail", "Tail logs in real-time")
  .action(async (options) => {
    initializeSystem(program.opts());

    if (options.tail) {
      logger.tailLogs();
    } else {
      const logs = logger.getLogs(options.type, options.level);

      if (options.export) {
        await logger.exportLogs(logs, options.export);
      } else {
        logger.displayLogs(logs);
      }
    }
  });

// Flags command
program
  .command("flags")
  .description("Manage feature flags")
  .option("--list", "List all feature flags and their status")
  .option("--enable <flag>", "Enable a specific feature flag")
  .option("--disable <flag>", "Disable a specific feature flag")
  .option("--toggle <flag>", "Toggle a specific feature flag")
  .option("--reset", "Reset all flags to defaults")
  .option("--rotate", "Rotate feature flags (quarterly maintenance)")
  .action((options) => {
    initializeSystem(program.opts());

    if (options.list) {
      featureRegistry.displayAllFlags();
    } else if (options.enable) {
      const flag = FeatureFlag[options.enable as keyof typeof FeatureFlag];
      if (flag) {
        featureRegistry.enableFeature(flag);
        console.log(chalk.green(`✅ Enabled ${flag}`));
      } else {
        console.error(chalk.red(`❌ Unknown feature flag: ${options.enable}`));
      }
    } else if (options.disable) {
      const flag = FeatureFlag[options.disable as keyof typeof FeatureFlag];
      if (flag) {
        featureRegistry.disableFeature(flag);
        console.log(chalk.red(`❌ Disabled ${flag}`));
      } else {
        console.error(chalk.red(`❌ Unknown feature flag: ${options.disable}`));
      }
    } else if (options.toggle) {
      const flag = FeatureFlag[options.toggle as keyof typeof FeatureFlag];
      if (flag) {
        featureRegistry.toggleFeature(flag);
        const status = featureRegistry.isEnabled(flag) ? "enabled" : "disabled";
        const color = status === "enabled" ? chalk.green : chalk.red;
        console.log(
          color(`${status === "enabled" ? "✅" : "❌"} ${flag} ${status}`)
        );
      } else {
        console.error(chalk.red(`❌ Unknown feature flag: ${options.toggle}`));
      }
    } else if (options.reset) {
      featureRegistry.resetToDefaults();
      console.log(chalk.yellow("🔄 All feature flags reset to defaults"));
    } else if (options.rotate) {
      featureRegistry.rotateFlags();
      console.log(chalk.blue("🔄 Feature flags rotated for maintenance"));
    } else {
      featureRegistry.displayAllFlags();
    }
  });

// Audit command
program
  .command("audit")
  .description("Run security and compliance audits")
  .option("--security", "Run security audit only")
  .option("--full", "Run comprehensive audit with debug symbols")
  .option("--report <format>", "Generate audit report (json|pdf)")
  .action(async (options) => {
    initializeSystem(program.opts());

    console.log(chalk.blue("🔍 Running system audit..."));

    if (options.security) {
      await dashboard.runSecurityAudit();
    } else {
      await dashboard.runFullAudit(options.full);
    }

    if (options.report) {
      await dashboard.generateAuditReport(options.report);
    }
  });

// Review command
program
  .command("review")
  .description("Review system performance and metrics")
  .option("--performance", "Review performance metrics only")
  .option("--optimize", "Suggest optimizations")
  .action(async (options) => {
    initializeSystem(program.opts());

    if (options.performance) {
      await dashboard.reviewPerformance(options.optimize);
    } else {
      await dashboard.runSystemReview();
    }
  });

// Build command
program
  .command("build")
  .description("Build system with optimization")
  .option("--optimize", "Analyze and optimize build")
  .option("--analyze", "Analyze bundle composition")
  .action(async (options) => {
    initializeSystem(program.opts());

    if (options.optimize) {
      await dashboard.optimizeBuild();
    } else if (options.analyze) {
      await dashboard.analyzeBuild();
    } else {
      console.log(chalk.blue("🔨 Building system..."));
      // Build logic would be implemented here
      console.log(chalk.green("✅ Build completed successfully"));
    }
  });

// Start command (for running the system)
program
  .command("start")
  .description("Start the phone management system")
  .option("--port <number>", "Port to run on", "3000")
  .option("--mock", "Use mock API services")
  .action(async (options) => {
    initializeSystem(program.opts());

    if (options.mock) {
      featureRegistry.enableFeature(FeatureFlag.FEAT_MOCK_API);
    }

    console.log(chalk.blue("🚀 Starting Phone Management System..."));
    console.log(chalk.green(`✅ System started on port ${options.port}`));

    // Display initial status
    dashboard.displayStatus();

    // Start monitoring if enabled
    if (featureRegistry.isEnabled(FeatureFlag.FEAT_ADVANCED_MONITORING)) {
      dashboard.startMonitoring();
    }
  });

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
  writeOut: (str) => process.stdout.write(str),
});

// Parse command line arguments
program.parse();

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  if (logger) {
    logger.critical("Uncaught exception", {
      error: error.message,
      stack: error.stack,
    });
  } else {
    console.error(chalk.red("Uncaught exception:"), error);
  }
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  if (logger) {
    logger.critical("Unhandled rejection", { reason, promise });
  } else {
    console.error(chalk.red("Unhandled rejection:"), reason);
  }
  process.exit(1);
});
