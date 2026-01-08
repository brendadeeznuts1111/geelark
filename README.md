# Dev HQ - Advanced Codebase Analysis & Automation Platform

A powerful developer toolkit built with Bun, featuring comprehensive codebase insights, performance monitoring, networking capabilities, and advanced transpilation features.

[![Bun](https://img.shields.io/badge/Bun-1.3.6-FFDF00)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![CLI](https://img.shields.io/badge/CLI-2.0-purple)](docs/api/CLI_REFERENCE.md)

## Features

### Codebase Analysis
- **Multi-Language Support**: TypeScript, JavaScript, JSX, TOML, YAML, WASM
- **Dependency Analysis**: Package.json validation and security scanning
- **Performance Metrics**: Build optimization and transpilation analysis
- **Git Insights**: Repository statistics and contributor analysis

### Networking & Security
- **HTTP/HTTPS Servers**: Built-in server creation with TLS support via `Bun.serve()`
- **Security Headers**: CORS, CSP, HSTS, and security best practices
- **WebSocket Support**: Real-time communication with WebSocket handlers
- **Network Diagnostics**: IPv4/IPv6 connectivity and DNS resolution

### Bun Runtime Features
- **TypeScript Configuration**: Advanced tsconfig.json management with JSX support
- **Build Optimization**: Dead code elimination and tree shaking
- **React JSX Support**: Automatic JSX transformation with react-jsx runtime
- **Custom Loaders**: TOML, YAML, and WASM file handling
- **Feature Flags**: Compile-time and runtime feature elimination

### Configuration Management
- **bunfig.toml**: Complete Bun configuration with test, install, and HTTP settings
- **Bun Context**: Runtime environment detection via `Bun.main`, `Bun.env`
- **Config Loading**: Efficient file loading with `Bun.file()` API
- **Preload Scripts**: Global setup and test environment configuration

### Dashboard System
- **Unicode-Aware Display**: Emojis, flags, and special characters
- **Live Status Updates**: Real-time monitoring with configurable intervals
- **Performance Metrics**: CPU, memory, and response time tracking
- **Integration Status**: Service health and connectivity monitoring

### Logging & Monitoring
- **Multi-Level Logging**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **External Integration**: Elasticsearch, Splunk, Datadog, Prometheus support
- **Audit Trails**: Comprehensive change tracking
- **Performance Metrics**: Detailed monitoring and alerting

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd geelark
bun install

# Run codebase analysis
bun insights

# Check system health
bun health

# Start development server
bun serve
```

## CLI Commands

### Dev HQ CLI

```bash
# Codebase insights (multiple formats)
bun insights                    # Default output
bun insights --table            # Table format
bun insights --json > report.json
bun insights --markdown > README.md
bun insights --csv > analysis.csv

# System health checks
bun health                      # Basic health check
bun health --verbose            # Detailed health

# Development server
bun serve                       # Start on port 3000
bun serve --port 8080           # Custom port

# Testing
bun test                        # Run all tests
bun test --coverage             # With coverage
bun test --watch                # Watch mode

# Git analysis
bun hq git                      # Repository insights
bun hq git --json               # JSON output

# Performance benchmarking
bun bench                       # Run benchmarks
bun bench:compare               # Compare builds
```

### Global Options

```bash
--json          # JSON output
--table         # Table format
--format <fmt>  # json|table|pretty
--perf          # Show timing
--verbose       # Verbose logging
--quiet         # Minimal output
--timeout <ms>  # Command timeout
--bun           # Bun-themed output
--check-deps    # Validate dependencies
--output <file> # Save to file
```

## Build Configurations

| Build Type | Command | Features | Size | Use Case |
|------------|---------|----------|------|----------|
| **Development** | `bun run build:dev` | DEV + Extended Logging + Mock API | 450KB | Local Development |
| **Production Lite** | `bun run build:prod-lite` | PROD + Encryption | 320KB | Minimal Deployment |
| **Production Standard** | `bun run build:prod-standard` | PROD + Auto-heal + Notifications + Encryption + Batch | 280KB | Standard Deployment |
| **Production Premium** | `bun run build:prod-premium` | All PROD + Premium + Advanced Monitoring | 340KB | Premium Deployment |
| **Test Build** | `bun run build:test` | DEV + Mock API | 180KB | CI/CD Testing |
| **Audit Build** | `bun run build:audit` | All features + Debug symbols | 600KB | Security Audit |

## Project Structure

```
geelark/
├── README.md              # Main project documentation
├── bunfig.toml           # Bun configuration
├── package.json           # Build configurations and scripts
├── tsconfig.json          # TypeScript configuration
├── docs/                  # Documentation suite
│   ├── README.md          # Documentation index
│   ├── api/               # API documentation
│   ├── guides/            # Feature guides
│   └── tutorials/         # Tutorial documents
├── scripts/               # Automation scripts
├── tests/                 # Test files
├── bench/                 # Benchmark suite
├── examples/              # Example code
├── bin/                   # CLI entry points
│   └── dev-hq-cli.ts     # Dev HQ CLI
└── src/                   # Source code
    ├── index.ts           # Main entry point
    ├── types.ts           # Type definitions
    ├── config.ts          # Feature configurations
    ├── FeatureRegistry.ts # Feature flag system
    ├── Dashboard.ts       # Dashboard components
    ├── Logger.ts          # Logging system
    ├── StringWidth.ts     # Unicode text utilities
    ├── CLI.ts             # Command-line interface
    ├── context/           # Bun context wrappers
    ├── config/            # Config loading utilities
    ├── server/            # HTTP/WebSocket server
    ├── security/          # Security headers & TLS
    ├── decorators/        # HTTP decorators
    ├── components/        # JSX components
    └── preload/           # Preload scripts
```

## Configuration

### bunfig.toml

The project uses a comprehensive `bunfig.toml` for Bun-specific configuration:

```toml
[test]
root = "tests"
preload = ["./src/preload/test-setup.ts"]
coverage = true
timeout = 30000
concurrent = false

[install]
exact = true
frozen-lockfile = false

[lockfile]
print = "yarn"

[run]
shell = "bun"
bun = true
```

See [bunfig.toml](bunfig.toml) for full configuration options.

### Environment Variables

```bash
# API Configuration
GEELARK_API_KEY=your_api_key_here
GEELARK_BASE_URL=https://api.geelark.com

# Service Integrations
EMAIL_SERVICE_API_KEY=your_email_key
SMS_SERVICE_API_KEY=your_sms_key
PROXY_SERVICE_URL=http://proxy.company.com

# Logging
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=30
EXTERNAL_LOGGING_ENABLED=true

# Security
ENCRYPTION_KEY=your_256_bit_key
VALIDATION_MODE=strict
AUDIT_TRAIL_ENABLED=true

# Performance
BATCH_SIZE=100
HEALTH_CHECK_INTERVAL=30
MONITORING_INTERVAL=5
```

## Testing

```bash
# Run all tests
bun test

# Test specific suites
bun test:unit                 # Unit tests only
bun test:integration          # Integration tests only
bun test:e2e                  # E2E tests only
bun test:types                # Type testing
bun test:servers              # Server tests
bun test:dev-hq-api          # Dev-HQ API tests

# Coverage
bun test:coverage

# Watch mode
bun test:watch
```

## Development

### Prerequisites
- [Bun](https://bun.sh) >= 1.3.6
- Node.js >= 18.0.0

### Setup

```bash
# Install dependencies
bun install

# Development mode with hot reload
bun dev

# Development with debug inspector
bun dev:debug

# Type checking
bun type-check

# Linting
bun lint
bun lint:fix
```

### Adding New Features

1. **Define Feature Flag** in `src/types.ts`:
```typescript
export enum FeatureFlag {
  FEAT_NEW_FEATURE = 'FEAT_NEW_FEATURE',
}
```

2. **Configure Feature** in `src/config.ts`:
```typescript
[FeatureFlag.FEAT_NEW_FEATURE]: {
  flag: FeatureFlag.FEAT_NEW_FEATURE,
  criticalLevel: CriticalLevel.MEDIUM,
  logHook: LogType.FEATURE_CHANGE,
  badgeEnabled: '✨ NEW',
  badgeDisabled: '🚫 DISABLED',
  buildTimeImpact: '+5% size',
},
```

3. **Implement Feature Logic**:
```typescript
if (featureRegistry.isEnabled(FeatureFlag.FEAT_NEW_FEATURE)) {
  // Feature implementation
}
```

## Documentation

- [API Reference](docs/api/CLI_REFERENCE.md) - Complete CLI documentation
- [Architecture](docs/ARCHITECTURE.md) - System architecture overview
- [Bun Runtime Features](docs/BUN_RUNTIME_FEATURES.md) - Bun feature integration
- [Feature Flags Guide](docs/guides/FEATURE_FLAGS_PRO_TIPS.md) - Feature flag patterns
- [expectTypeOf Guide](docs/guides/EXPECTTYPEOF_GUIDE.md) - Type checking guide
- [Setup Tutorial](docs/tutorials/SETUP.md) - Getting started tutorial
- [User Guide](docs/tutorials/USER_GUIDE.md) - Comprehensive user manual

## Roadmap

### Phase 1: Core System (Current)
- ✅ Feature flag system
- ✅ Unicode-aware string width calculations
- ✅ Comprehensive logging system
- ✅ Dashboard components
- ✅ CLI interface
- ✅ Health monitoring

### Phase 2: Advanced Features (Q1 2026)
- 🔄 Real-time dashboard with live updates
- 🔄 Advanced security features
- 🔄 Performance optimization
- 🔄 Notification system

### Phase 3: Enterprise Features (Q2 2026)
- 🔄 Multi-tenant support
- 🔄 Advanced analytics dashboard
- 🔄 Automated scaling
- 🔄 Advanced monitoring integrations

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow Bun-Pure standards (no unnecessary dependencies)
- Add comprehensive tests for new features
- Update documentation for API changes

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-org/geelark/issues)
- 💬 [Discussions](https://github.com/your-org/geelark/discussions)

---

Built with [Bun](https://bun.sh) for exceptional performance.
