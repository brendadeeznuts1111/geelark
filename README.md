# Dev HQ - Advanced Codebase Analysis & Automation Platform

A powerful developer toolkit built with Bun, featuring comprehensive codebase insights, performance monitoring, networking capabilities, and advanced transpilation features.

[![Bun](https://img.shields.io/badge/Bun-1.3.6-FFDF00)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![CLI](https://img.shields.io/badge/CLI-2.0-purple)](docs/api/CLI_REFERENCE.md)

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [CLI Commands](#cli-commands)
- [Build Configurations](#build-configurations)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Feature Flags](#feature-flags)
- [Dashboard System](#dashboard-system)
- [Testing](#testing)
- [Development](#development)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

### 📊 Codebase Analysis
- **Multi-Language Support**: TypeScript, JavaScript, JSX, TSX, TOML, YAML, WASM
- **Dependency Analysis**: Package.json validation and security scanning
- **Performance Metrics**: Build optimization and transpilation analysis
- **Git Insights**: Repository statistics and contributor analysis
- **CLOC**: Lines of code counting with language breakdown

### 🌐 Networking & Security
- **HTTP/HTTPS Servers**: Built-in server creation with TLS support via `Bun.serve()`
- **Security Headers**: CORS, CSP, HSTS, X-Frame-Options, and more
- **WebSocket Support**: Real-time communication with pub/sub patterns
- **Network Diagnostics**: IPv4/IPv6 connectivity and DNS resolution
- **TLS/HTTPS**: Certificate handling with `Bun.file()` for efficient loading

### ⚡ Bun Runtime Features
- **TypeScript Configuration**: Advanced tsconfig.json with JSX and decorators
- **Build Optimization**: Dead code elimination with `bun:bundle feature()`
- **React JSX Support**: Automatic JSX transformation with react-jsx runtime
- **Custom Loaders**: TOML, YAML, WASM file type handling
- **Feature Flags**: Compile-time and runtime feature elimination
- **Bun Context**: Runtime detection via `Bun.main`, `Bun.env`, `Bun.file()`
- **Preload Scripts**: Global setup and test environment configuration

### 📁 Configuration Management
- **bunfig.toml**: Complete Bun configuration (test, install, HTTP, TLS, loaders)
- **Scoped Registries**: Private package registry support with authentication
- **Config Loading**: Efficient file loading with `Bun.file()` and `Bun.write()`
- **Environment Detection**: Development, production, and test mode detection
- **Hot Reload**: `--watch` and `--hot` for development workflows

### 🎨 Dashboard System
- **Unicode-Aware Display**: Emojis, flags, ZWJ sequences, and special characters
- **Live Status Updates**: Real-time monitoring with configurable intervals
- **Performance Metrics**: CPU, memory, and response time tracking
- **Integration Status**: Service health and connectivity monitoring
- **Bun.stringWidth()**: Accurate terminal width calculation for all Unicode

### 📝 Logging & Monitoring
- **Multi-Level Logging**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **External Integration**: Elasticsearch, Splunk, Datadog, Prometheus support
- **Audit Trails**: Immutable change tracking with blockchain hashing
- **Performance Metrics**: Detailed monitoring with alerting
- **Structured Logging**: JSON-formatted logs with metadata

## Quick Start

```bash
# Clone and install
git clone https://github.com/brendadeeznuts1111/geelark.git
cd geelark
bun install

# Run codebase analysis
bun insights                    # Default output
bun insights --table            # Table format
bun insights --json > report.json

# Check system health
bun health

# Start development server
bun serve                       # Port 3000
bun serve --port 8080           # Custom port

# Run tests
bun test
bun test --coverage
```

## CLI Commands

### Dev HQ CLI

```bash
# Codebase insights (multiple formats)
bunx dev-hq insights                    # Default output
bunx dev-hq insights --table            # Table format
bunx dev-hq insights --json             # JSON format
bunx dev-hq insights --csv > analysis.csv
bunx dev-hq insights --markdown > README.md
bunx dev-hq insights --perf --analyze   # Performance + bundle analysis

# System health checks
bunx dev-hq health                      # Basic health
bunx dev-hq health --verbose            # Detailed health

# Development server
bunx dev-hq serve                       # Port 3000
bunx dev-hq serve --port 8080           # Custom port

# Testing
bunx dev-hq test                        # Run tests
bunx dev-hq test --coverage             # With coverage
bunx dev-hq test --watch                # Watch mode

# Git analysis
bunx dev-hq git                        # Repository insights
bunx dev-hq git --json                 # JSON output

# CLOC (Count Lines of Code)
bunx dev-hq cloc                        # Language breakdown

# Docker insights
bunx dev-hq docker                      # Container analysis

# Run with monitoring
bunx dev-hq run "npm test" --metrics     # Execute with metrics
```

### Command Aliases

| Command | Aliases |
|---------|---------|
| `insights` | `analyze`, `i` |
| `health` | `h` |
| `test` | `t` |
| `git` | `g` |
| `cloc` | `c` |
| `docker` | `d` |
| `serve` | `s` |
| `run` | `r` |

### Global Options

| Option | Description |
|--------|-------------|
| `--json` | JSON format output |
| `--table` | Table format using `Bun.inspect.table` |
| `--format` | Output format: json|table|pretty |
| `--perf` | Show Bun execution timing |
| `--verbose` | Verbose logging |
| `--quiet` | Minimal output |
| `--timeout` | Command timeout in milliseconds |
| `--bun` | Bun-themed ASCII output |
| `--check-deps` | Validate package.json dependencies |
| `--analyze` | Bundle analysis with `bun build --analyze` |
| `--output` | Save output to file |

### Flag Separation Pattern

```bash
# Bun flags | Script | Command | CLI flags
bun --hot --watch dev-hq-cli.ts insights --table --json
#  └─Bun Flags─┘ └──Script──┘ └─Cmd─┘ └─CLI Flags──┘
```

## Build Configurations

| Build Type | Command | Features | Size | DCE | Use Case |
|------------|---------|----------|------|-----|----------|
| **Development** | `bun run build:dev` | ENV_DEVELOPMENT + Extended Logging + Mock API | 450KB | 0% | Local Development |
| **Production Lite** | `bun run build:prod-lite` | ENV_PRODUCTION + Encryption | 320KB | 29% | Minimal Deployment |
| **Production Standard** | `bun run build:prod-standard` | PROD + Auto-heal + Notifications + Encryption + Batch | 280KB | 38% | Standard Deployment |
| **Premium** | `bun run build:prod-premium` | All PROD + Premium + Advanced Monitoring | 340KB | 24% | Premium Deployment |
| **Test Build** | `bun run build:test` | ENV_DEVELOPMENT + Mock API | 180KB | 60% | CI/CD Testing |
| **Audit Build** | `bun run build:audit` | All features + Debug symbols | 600KB | 0% | Security Audit |

## Project Structure

```
geelark/
├── README.md              # Main project documentation
├── bunfig.toml           # Bun configuration
├── package.json           # Build configurations and scripts
├── tsconfig.json          # TypeScript configuration
├── meta.json              # System metadata and manifest
├── config/                # Configuration files (organized)
│   ├── README.md          # Configuration documentation
│   ├── build/             # Build configurations
│   │   ├── build-defines.json
│   │   └── custom-loaders.json
│   ├── security/          # Security configurations
│   │   ├── security-scanners.json
│   │   └── security-suppressions.xml
│   └── tsconfig/          # TypeScript configurations
│       ├── tsconfig.dev.json
│       ├── tsconfig.prod.json
│       └── tsconfig.audit.json
├── schemas/               # JSON Schema definitions
│   ├── README.md          # Schema documentation
│   └── meta.schema.json   # Meta manifest schema
├── docs/                  # Documentation suite
│   ├── README.md          # Documentation index
│   ├── api/               # API documentation
│   ├── architecture/      # Architecture docs
│   ├── cli/               # CLI documentation
│   ├── features/          # Feature documentation
│   ├── guides/            # Feature guides
│   ├── runtime/           # Runtime documentation
│   ├── testing/           # Testing documentation
│   └── tutorials/         # Tutorial documents
├── scripts/               # Automation scripts
│   ├── analysis/          # Analysis scripts
│   ├── build/             # Build scripts
│   ├── dev/               # Development scripts
│   └── validation/        # Validation scripts
├── tests/                 # Test files
│   ├── config/            # Test configuration
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/               # End-to-end tests
│   ├── performance/       # Performance benchmarks
│   └── cli/               # CLI tests
├── bench/                 # Benchmark suite
├── examples/              # Example code
│   ├── feature-flags/     # Feature flag examples
│   ├── bun-runtime/       # Bun runtime examples
│   ├── cli-args/          # CLI argument examples
│   ├── processes/         # Process examples
│   └── system/            # System examples
├── packages/              # Package templates
│   └── create/            # Workspace template generator
├── bin/                   # CLI entry points
│   ├── dev-hq-cli.ts      # Dev HQ CLI
│   ├── dev-hq.ts          # Dev HQ main
│   └── dev-hq-test.ts     # Dev HQ test runner
├── dev-hq/                # Dev HQ core modules
│   ├── core/              # Core automation
│   ├── servers/           # Server implementations
│   └── docs/              # Dev HQ documentation
└── src/                   # Source code
    ├── index.ts           # Main entry point
    ├── types.ts           # Type definitions
    ├── config.ts          # Feature configurations
    ├── FeatureRegistry.ts # Feature flag system
    ├── Dashboard.ts       # Dashboard components
    ├── Logger.ts          # Logging system
    ├── StringWidth.ts     # Unicode text utilities
    ├── CLI.ts             # Command-line interface
    ├── constants/         # Runtime constants
    │   ├── index.ts       # Main constants export
    │   ├── templates.ts   # Bun create templates
    │   └── features/       # Feature flag constants
    ├── context/           # Bun context wrappers
    ├── config/            # Config loading utilities
    ├── server/            # HTTP/WebSocket server
    ├── security/          # Security headers & TLS
    ├── decorators/        # HTTP decorators
    ├── components/        # JSX components
    └── preload/           # Preload scripts
```

## Configuration

### Configuration Directory

All configuration files are organized in the `config/` directory:

- **`config/build/`** - Build configurations (feature flags, custom loaders)
- **`config/security/`** - Security scanner configurations and suppressions
- **`config/tsconfig/`** - TypeScript configurations for different environments

See [`config/README.md`](config/README.md) for detailed configuration documentation.

### bunfig.toml

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

[http]
user-agent = "geelark/1.0.0"
connectTimeout = 10000
readTimeout = 30000
keepAlive = true
```

### Environment Variables

```bash
# API Configuration
GEELARK_API_KEY=your_api_key
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

## Feature Flags

### Core Feature Flags

| Flag | Enabled Badge | Disabled Badge | Impact |
|------|---------------|----------------|--------|
| `ENV_DEVELOPMENT` | `🌍 DEV` | `🌍 PROD` | +15% size |
| `ENV_PRODUCTION` | `🌍 PROD` | `🌍 DEV` | -25% size |
| `FEAT_PREMIUM` | `🏆 PREMIUM` | `🔓 FREE` | +15% size |
| `FEAT_AUTO_HEAL` | `🔄 AUTO-HEAL` | `⚠️ MANUAL` | +10% size |
| `FEAT_NOTIFICATIONS` | `🔔 ACTIVE` | `🔕 SILENT` | +8% size |
| `FEAT_ENCRYPTION` | `🔐 ENCRYPTED` | `⚠️ PLAINTEXT` | +5% size |
| `FEAT_MOCK_API` | `🧪 MOCK` | `🚀 REAL` | -20% size |
| `FEAT_EXTENDED_LOGGING` | `📝 VERBOSE` | `📋 NORMAL` | +12% size |
| `FEAT_ADVANCED_MONITORING` | `📈 ADVANCED` | `📊 BASIC` | +7% size |
| `FEAT_BATCH_PROCESSING` | `⚡ BATCH` | `🐌 SEQUENTIAL` | +8% size |
| `FEAT_VALIDATION_STRICT` | `✅ STRICT` | `⚠️ LENIENT` | +5% size |

### Compile-Time Features

See [`src/constants/features/compile-time.ts`](src/constants/features/compile-time.ts) for the complete feature flag system with dead code elimination.

## Dashboard System

### Dashboard Components

| Component | Update Frequency | Data Source |
|-----------|------------------|-------------|
| Top Status Bar | Real-time | Feature Registry |
| Environment Panel | On-change | ENV_* flags |
| Security Status | Real-time | Security flags |
| Notification Panel | 1 second | Notification queue |
| Performance Graph | 2 seconds | Performance metrics |
| Integration Grid | 30 seconds | Health checks |

### Unicode Support

The dashboard uses `Bun.stringWidth()` for accurate terminal width calculation:
- Flag emoji (🇺🇸) - 2 columns
- Skin tone modifiers (👋🏽) - 2 columns
- ZWJ sequences (👨‍👩‍👧) - 2 columns
- ANSI escape sequences - excluded from width
- OSC hyperlinks - excluded from width

## Testing

```bash
# Run all tests
bun test

# Test specific suites
bun test:unit                 # Unit tests only
bun test:integration          # Integration tests only
bun test:e2e                  # E2E tests only
bun test:types                # Type testing with expectTypeOf
bun test:servers              # Server tests
bun test:dev-hq-api          # Dev-HQ API tests

# Coverage
bun test:coverage

# Watch mode
bun test:watch
```

### Type Testing

```typescript
import { expectTypeOf } from "bun:test";

expectTypeOf(user).toMatchObjectOf<User>();
expectTypeOf(config).toBeObject();
expectTypeOf(fn).returns.toBeVoid();
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

### Bun-Pure Standards

```typescript
// Files
await Bun.file("path.txt").text()
await Bun.write("out.txt", "content")

// Server
Bun.serve({ port: 3000, fetch: req => new Response("OK") })

// Database
import { Database } from "bun:sqlite";
const db = new Database("app.db");

// Test
import { test, expect } from "bun:test";

// Glob
for await (const f of new Bun.Glob("**/*.ts").scan(".")) console.log(f)
```

## Documentation

| Document | Description |
|----------|-------------|
| [Documentation Index](docs/README.md) | Complete documentation suite |
| [CLI Reference](docs/api/CLI_REFERENCE.md) | Complete command-line interface reference |
| [Server API](docs/api/SERVER_API.md) | HTTP/WebSocket server documentation |
| [Deployment Guide](docs/tutorials/DEPLOYMENT.md) | Platform-specific deployment instructions |
| [Architecture](docs/architecture/ARCHITECTURE.md) | System architecture overview |
| [Bun Runtime Features](docs/runtime/BUN_RUNTIME_FEATURES.md) | Bun feature integration |
| [Bun Constants](docs/runtime/BUN_CONSTANTS.md) | Runtime constants reference |
| [Feature Matrix](docs/features/FEATURE_MATRIX.md) | Complete feature flags matrix |
| [expectTypeOf Guide](docs/guides/EXPECTTYPEOF_GUIDE.md) | Type checking guide |
| [Config Documentation](config/README.md) | Configuration files reference |
| [Schema Documentation](schemas/README.md) | JSON Schema definitions |

## Roadmap

### Phase 1: Core System ✅
- ✅ Feature flag system
- ✅ Unicode-aware string width calculations
- ✅ Comprehensive logging system
- ✅ Dashboard components
- ✅ CLI interface
- ✅ Health monitoring
- ✅ HTTP/WebSocket server
- ✅ Security headers & TLS
- ✅ Route decorators
- ✅ JSX components

### Phase 2: Advanced Features 🔄
- 🔄 Real-time dashboard with live updates
- 🔄 Advanced security features
- 🔄 Performance optimization
- 🔄 Notification system
- 🔄 Automated scaling

### Phase 3: Enterprise Features 📋
- 📋 Multi-tenant support
- 📋 Advanced analytics dashboard
- 📋 Automated scaling with load balancing
- 📋 Advanced monitoring integrations
- 📋 Enterprise security features
- 📋 Audit trail compliance
- 📋 Custom integration APIs

## Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** with proper TypeScript types and tests
4. **Run the test suite**: `bun test`
5. **Update documentation** if needed
6. **Commit your changes**: `git commit -m 'feat: add amazing feature'`
7. **Push to your branch**: `git push origin feature/your-feature-name`
8. **Open a Pull Request** with a clear description

### Development Guidelines

- **TypeScript First**: All new code must be written in TypeScript
- **Bun-Pure Standards**: No unnecessary dependencies - leverage Bun's built-in APIs
- **Testing**: Add comprehensive tests for new features (unit, integration, and E2E)
- **Documentation**: Update documentation for any API changes
- **Code Style**: Follow the existing code patterns and conventions
- **Performance**: Consider bundle size impact and runtime performance
- **Security**: Implement proper security measures for new features

### Commit Convention

We follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Testing changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/brendadeeznuts1111/geelark/issues)
- 💬 [Discussions](https://github.com/brendadeeznuts1111/geelark/discussions)

---

Built with [Bun](https://bun.sh) for exceptional performance.
