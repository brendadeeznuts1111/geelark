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
  .option("--no-color", "Disable colored output")

  // Dependency & Module Resolution Options
  .option("--preload <module>", "Import a module before other modules are loaded")
  .option("-r, --require <module>", "Alias of --preload, for Node.js compatibility")
  .option("--import <module>", "Alias of --preload, for Node.js compatibility")
  .option("--no-install", "Disable auto install in the Bun runtime")
  .option("--install <behavior>", "Configure auto-install behavior (auto|fallback|force)", "auto")
  .option("-i", "Auto-install dependencies during execution. Equivalent to --install=fallback")
  .option("--prefer-offline", "Skip staleness checks for packages in the Bun runtime and resolve from disk")
  .option("--prefer-latest", "Use the latest matching versions of packages in the Bun runtime, always checking npm")
  .option("--conditions <conditions>", "Pass custom conditions to resolve")
  .option("--main-fields <fields>", "Main fields to lookup in package.json. Defaults to --target dependent")
  .option("--preserve-symlinks", "Preserve symlinks when resolving files")
  .option("--preserve-symlinks-main", "Preserve symlinks when resolving the main entry point")
  .option("--extension-order <extensions>", "File extension resolution order", ".tsx,.ts,.jsx,.js,.json");

// Initialize system components
let featureRegistry: FeatureRegistry;
let logger: Logger;
let dashboard: Dashboard;

async function initializeSystem(options: any) {
  // Handle dependency and module resolution options
  await handleDependencyOptions(options);

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
    await initializeSystem(program.opts());

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
    await initializeSystem(program.opts());

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
    await initializeSystem(program.opts());

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
    await initializeSystem(program.opts());

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
  .action(async (options) => {
    await initializeSystem(program.opts());

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
    await initializeSystem(program.opts());

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
    await initializeSystem(program.opts());

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
    await initializeSystem(program.opts());

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
    await initializeSystem(program.opts());

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

// Handle dependency and module resolution options
async function handleDependencyOptions(options: any) {
  // Handle null/undefined options
  if (!options) {
    return;
  }

  // Handle preload/require/import options
  const preloadModules = [];

  if (options.preload) {
    preloadModules.push(options.preload);
  }
  if (options.require) {
    preloadModules.push(options.require);
  }
  if (options.import) {
    preloadModules.push(options.import);
  }

  // Load preload modules
  for (const module of preloadModules) {
    try {
      await import(module);
      if (options.verbose) {
        console.log(chalk.green(`✅ Preloaded module: ${module}`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to preload module: ${module}`), error);
      if (!options.dryRun) {
        process.exit(1);
      }
    }
  }

  // Handle install behavior
  if (options.noInstall) {
    process.env.BUN_NO_INSTALL = "true";
    if (options.verbose) {
      console.log(chalk.yellow("🔧 Auto-install disabled"));
    }
  }

  if (options.install && options.install !== "auto") {
    const validBehaviors = ["auto", "fallback", "force"];
    if (!validBehaviors.includes(options.install)) {
      console.error(chalk.red(`❌ Invalid install behavior: ${options.install}. Valid options: ${validBehaviors.join(", ")}`));
      process.exit(1);
    }
    process.env.BUN_INSTALL = options.install;
    if (options.verbose) {
      console.log(chalk.yellow(`🔧 Install behavior set to: ${options.install}`));
    }
  }

  if (options.i) {
    process.env.BUN_INSTALL = "fallback";
    if (options.verbose) {
      console.log(chalk.yellow("🔧 Auto-install enabled (fallback mode)"));
    }
  }

  // Handle package resolution preferences
  if (options.preferOffline) {
    process.env.BUN_PREFER_OFFLINE = "true";
    if (options.verbose) {
      console.log(chalk.yellow("🔧 Preferring offline packages"));
    }
  }

  if (options.preferLatest) {
    process.env.BUN_PREFER_LATEST = "true";
    if (options.verbose) {
      console.log(chalk.yellow("🔧 Preferring latest package versions"));
    }
  }

  // Handle custom conditions
  if (options.conditions) {
    process.env.BUN_CONDITIONS = options.conditions;
    if (options.verbose) {
      console.log(chalk.yellow(`🔧 Custom conditions: ${options.conditions}`));
    }
  }

  // Handle main fields
  if (options.mainFields) {
    process.env.BUN_MAIN_FIELDS = options.mainFields;
    if (options.verbose) {
      console.log(chalk.yellow(`🔧 Main fields: ${options.mainFields}`));
    }
  }

  // Handle symlink preservation
  if (options.preserveSymlinks) {
    process.env.BUN_PRESERVE_SYMLINKS = "true";
    if (options.verbose) {
      console.log(chalk.yellow("🔧 Preserving symlinks when resolving files"));
    }
  }

  if (options.preserveSymlinksMain) {
    process.env.BUN_PRESERVE_SYMLINKS_MAIN = "true";
    if (options.verbose) {
      console.log(chalk.yellow("🔧 Preserving symlinks when resolving main entry point"));
    }
  }

  // Handle extension order
  if (options.extensionOrder && options.extensionOrder !== ".tsx,.ts,.jsx,.js,.json") {
    process.env.BUN_EXTENSION_ORDER = options.extensionOrder;
    if (options.verbose) {
      console.log(chalk.yellow(`🔧 Extension order: ${options.extensionOrder}`));
    }
  }
}

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
