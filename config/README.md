# Dev HQ Configuration Directory

This directory contains all configuration files for the Dev HQ platform, organized by category. These configurations control build behavior, security scanning, and TypeScript compilation settings.

## Directory Structure

```
config/
├── build/              # Build configuration files
│   ├── build-defines.json      # Feature flag definitions for build configurations
│   └── custom-loaders.json     # Custom loader configurations for different environments
├── security/           # Security configuration files
│   ├── security-scanners.json # Security scanner configurations (Snyk, Trivy, etc.)
│   └── security-suppressions.xml # Security vulnerability suppressions
└── tsconfig/           # TypeScript configuration files
    ├── tsconfig.dev.json        # Development TypeScript configuration
    ├── tsconfig.prod.json       # Production TypeScript configuration
    └── tsconfig.audit.json      # Audit mode TypeScript configuration
```

## Build Configuration

### `build/build-defines.json`

Defines feature flags and build-time constants for different build configurations:
- `development` - Development build with debugging enabled
- `production-lite` - Minimal production build
- `production-standard` - Standard production build with core features
- `production-premium` - Premium production build with all features
- `audit` - Audit mode with strict validation

**Usage**: Referenced by build scripts to set feature flags during compilation.

### `build/custom-loaders.json`

Defines custom file loaders and JSX configurations for different environments:
- Loader mappings for `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.toml`, `.env`, `.md` files
- JSX runtime configurations (React, Preact)
- Environment-specific loader settings

**Usage**: Used by Bun's build system to determine how to process different file types.

## Security Configuration

### `security/security-scanners.json`

Configuration for security scanning tools:
- **Snyk**: Code, open source, container, and IaC scanning
- **Trivy**: Container and filesystem scanning
- **OWASP ZAP**: Web application security testing
- Severity thresholds and policies
- Excluded paths and scan types

**Usage**: Referenced by security audit scripts and CI/CD pipelines.

### `security/security-suppressions.xml`

XML file containing suppressed security vulnerabilities that have been reviewed and accepted as false positives or acceptable risks.

**Usage**: Used by security scanners to ignore specific vulnerabilities.

## TypeScript Configuration

### `tsconfig/tsconfig.dev.json`

Development TypeScript configuration:
- Relaxed type checking for faster development
- Source maps enabled
- Comments preserved
- Path aliases configured (`@/*`, `@/utils/*`, `@/types/*`)

**Usage**: Used by `bun build --tsconfig-override config/tsconfig/tsconfig.dev.json`

### `tsconfig/tsconfig.prod.json`

Production TypeScript configuration:
- Strict type checking enabled
- Source maps disabled
- Comments removed
- Test files excluded
- Optimized for production builds

**Usage**: Used by production build scripts.

### `tsconfig/tsconfig.audit.json`

Audit mode TypeScript configuration:
- Maximum strictness enabled
- All type checking options enabled
- Source maps enabled for debugging
- No emit on error
- Used for security audits and code quality checks

**Usage**: Used by audit and security build scripts.

## Path References

All TypeScript config files extend the root `tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json"
}
```

Path aliases are configured relative to the `src/` directory:
- `@/*` → `../../src/*`
- `@/utils/*` → `../../src/utils/*`
- `@/types/*` → `../../src/types/*`

## Usage in Build Scripts

Configuration files are referenced in `package.json` scripts:

```json
{
  "build:test": "bun build --tsconfig-override config/tsconfig/tsconfig.dev.json ...",
  "build:audit": "bun build --tsconfig-override config/tsconfig/tsconfig.audit.json ...",
  "build:analyze": "bun build --tsconfig-override config/tsconfig/tsconfig.prod.json ..."
}
```

## Adding New Configurations

When adding new configuration files:

1. **Place in appropriate subdirectory**:
   - Build configs → `config/build/`
   - Security configs → `config/security/`
   - TypeScript configs → `config/tsconfig/`

2. **Update this README** with:
   - File purpose
   - Usage instructions
   - Reference locations

3. **Update package.json scripts** if the config is used in build/test commands

4. **Update documentation** in `docs/` if the config affects user-facing behavior

## Migration from `configs/`

Previously, configuration files were split between:
- `config/` - Security files
- `configs/` - Build and TypeScript files

These have been consolidated into a single `config/` directory with logical subdirectories for better organization.

