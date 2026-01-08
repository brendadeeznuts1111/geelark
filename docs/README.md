# Dev HQ Documentation Index

Complete documentation for the Dev HQ codebase analysis and automation platform.

## Getting Started

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Main project documentation with quick start |
| [SETUP.md](tutorials/SETUP.md) | Installation and setup guide |
| [USER_GUIDE.md](tutorials/USER_GUIDE.md) | Comprehensive user manual |
| [DEPLOYMENT.md](tutorials/DEPLOYMENT.md) | Deployment guide for all platforms |

## API Documentation

| Document | Description |
|----------|-------------|
| [CLI_REFERENCE.md](api/CLI_REFERENCE.md) | Complete command-line interface reference |
| [SERVER_API.md](api/SERVER_API.md) | HTTP/WebSocket server API documentation |
| [flags-reference.md](api/flags-reference.md) | Feature flags reference documentation |

## Architecture & Design

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture overview |
| [SPECIFICATION.md](SPECIFICATION.md) | Technical specifications |
| [ROADMAP.md](ROADMAP.md) | Project roadmap and planning |
| [BUN_RUNTIME_FEATURES.md](BUN_RUNTIME_FEATURES.md) | Bun runtime features integration |
| [BUN_DEPENDENCIES_TRANSPIRATION.md](BUN_DEPENDENCIES_TRANSPIRATION.md) | Dependency management and transpilation |
| [BUN_CONSTANTS.md](BUN_CONSTANTS.md) | Bun runtime constants and defaults reference |

## Feature Guides

| Document | Description |
|----------|-------------|
| [EXPECTTYPEOF_GUIDE.md](guides/EXPECTTYPEOF_GUIDE.md) | Type checking with expectTypeOf |
| [expectTypeOf-implementation-summary.md](guides/expectTypeOf-implementation-summary.md) | Type checking implementation details |
| [expectTypeOf-pro-tips.md](guides/expectTypeOf-pro-tips.md) | Advanced type patterns |
| [expectTypeOf-runtime-complete.md](guides/expectTypeOf-runtime-complete.md) | Runtime type checking |
| [FEATURE_FLAGS_PRO_TIPS.md](guides/FEATURE_FLAGS_PRO_TIPS.md) | Feature flag patterns and best practices |
| [TESTING_ALIGNMENT.md](guides/TESTING_ALIGNMENT.md) | Testing strategies |

## Process & Runtime

| Document | Description |
|----------|-------------|
| [PROCESS_LIFECYCLE.md](PROCESS_LIFECYCLE.md) | Process lifecycle management |
| [RUNTIME_CONTROLS.md](RUNTIME_CONTROLS.md) | Runtime control mechanisms |
| [FLAG_FLOW_DIAGRAM.md](FLAG_FLOW_DIAGRAM.md) | Feature flag flow diagrams |
| [flag-separation-pattern.md](flag-separation-pattern.md) | Flag separation patterns |

## Development Tools

| Document | Description |
|----------|-------------|
| [CLI_IMPLEMENTATION_SUMMARY.md](CLI_IMPLEMENTATION_SUMMARY.md) | CLI implementation details |
| [dev-hq-cli-enhanced.md](dev-hq-cli-enhanced.md) | Dev HQ CLI enhancements |

## Testing & Quality

| Document | Description |
|----------|-------------|
| [test-coverage.md](test-coverage.md) | Test coverage reports |
| [UNHANDLED_REJECTIONS.md](UNHANDLED_REJECTIONS.md) | Error handling patterns |

## Quick Reference

### Bun Features Implemented

| Feature | Implementation | File |
|---------|----------------|------|
| `Bun.serve()` | HTTP/WebSocket server | `src/server/BunServe.ts` |
| `Bun.file()` | Config loading | `src/config/ConfigLoader.ts` |
| `Bun.main` | Entry point detection | `src/context/BunContext.ts` |
| `Bun.env` | Environment access | `src/context/BunContext.ts` |
| JSX/TSX | Components | `src/components/FormattedOutput.tsx` |
| Decorators | HTTP endpoints | `src/decorators/Route.ts`, `src/decorators/Middleware.ts` |
| Security Headers | Middleware | `src/security/Headers.ts` |
| TLS/HTTPS | Certificate handling | `src/security/TLS.ts` |

### Key Directories

```
src/
├── context/          # Bun runtime wrappers (Bun.main, Bun.env)
├── config/           # Configuration loading with Bun.file()
├── constants/        # Bun runtime constants and feature flags
├── server/           # HTTP/WebSocket server
├── security/         # Security headers and TLS
├── decorators/       # HTTP route decorators
├── components/       # JSX components
└── preload/          # Preload scripts for test setup

tests/
├── unit/             # Unit tests
├── integration/      # Integration tests
├── e2e/              # End-to-end tests
└── performance/      # Performance benchmarks

docs/
├── api/              # API documentation
├── guides/           # Feature guides
└── tutorials/        # Tutorial documents
```

### Common Commands

```bash
# Development
bun dev                    # Start with hot reload
bun type-check            # Type checking
bun lint                  # Lint code

# Testing
bun test                  # Run all tests
bun test:coverage         # Test with coverage
bun test:watch            # Watch mode

# CLI
bun insights              # Codebase analysis
bun health                # Health check
bun serve                 # Start server

# Builds
bun run build:dev         # Development build
bun run build:prod-standard # Production build
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `insights` | Comprehensive codebase analysis |
| `health` | System health check |
| `test` | Run tests with coverage |
| `git` | Git repository analysis |
| `cloc` | Count lines of code |
| `docker` | Docker container insights |
| `serve` | Start development server |
| `run` | Execute commands with monitoring |

## Contributing to Documentation

When adding new features:
1. Update the relevant guide or API documentation
2. Add examples to the appropriate tutorial
3. Update this index with links to new documents
4. Ensure all internal links work correctly

## Documentation Standards

- Use clear, concise language
- Include code examples for all APIs
- Link to related documentation
- Keep examples up-to-date with code
- Use proper formatting (tables, code blocks, etc.)
