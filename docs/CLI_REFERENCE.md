# 🚀 Dev HQ CLI - Complete Command Reference

## 📋 Overview

Dev HQ CLI is a powerful codebase analysis tool built with Bun-native features, providing comprehensive insights into your project's health, performance, and structure.

**Version:** 2.0.0
**Built with:** Bun runtime for maximum performance

## 🎯 Quick Start

```bash
# Install and run
bunx dev-hq --help

# Basic usage
bunx dev-hq insights                    # Analyze codebase
bunx dev-hq insights --table            # Table format
bunx dev-hq insights --json             # JSON format
bunx dev-hq health                      # System health check
```

## 📚 Commands Reference

### 🔍 `insights` - Comprehensive Codebase Analysis

**Aliases:** `analyze`, `i`
**Description:** Analyzes your entire codebase and provides detailed insights

```bash
bunx dev-hq insights [options]
bunx dev-hq analyze [options]
bunx dev-hq i [options]
```

**Output Formats:**
- `--table` - Table format using Bun.inspect.table (default)
- `--json` - JSON format for programmatic use
- `--csv` - CSV format for spreadsheet analysis
- `--markdown` - Markdown format for documentation

**Examples:**
```bash
bunx dev-hq insights --table > insights.txt
bunx dev-hq insights --json > insights.json
bunx dev-hq insights --csv > insights.csv
bunx dev-hq insights --markdown > README.md
```

### 📊 `git` - Git Repository Analysis

**Aliases:** `g`
**Description:** Provides comprehensive Git repository insights

```bash
bunx dev-hq git [options]
bunx dev-hq g [options]
```

**Features:**
- Commit history analysis
- Branch information
- Repository size and statistics
- Contributor insights

### 🔢 `cloc` - Count Lines of Code

**Aliases:** `c`
**Description:** Counts lines of code across your project

```bash
bunx dev-hq cloc [options]
bunx dev-hq c [options]
```

**Metrics:**
- Total lines of code
- Language breakdown
- File count by type
- Code vs comments ratio

### 🧪 `test` - Run Tests

**Aliases:** `t`
**Description:** Execute tests with optional coverage

```bash
bunx dev-hq test [options]
bunx dev-hq t [options]
```

**Options:**
- `--coverage` - Run tests with coverage report
- `--watch` - Enable watch mode for continuous testing

### 🐳 `docker` - Docker Container Insights

**Aliases:** `d`
**Description:** Analyze Docker containers and images

```bash
bunx dev-hq docker [options]
bunx dev-hq d [options]
```

**Features:**
- Running containers status
- Image analysis
- Resource usage metrics
- Container health checks

### ❤️ `health` - System Health Check

**Aliases:** `h`
**Description:** Comprehensive system health analysis

```bash
bunx dev-hq health [options]
bunx dev-hq h [options]
```

**Checks:**
- Bun runtime availability
- Git installation
- Docker installation
- Node.js modules status
- System resources

### 🚀 `serve` - Start Dev HQ Server

**Aliases:** `s`
**Description:** Start the Dev HQ web server

```bash
bunx dev-hq serve [options]
bunx dev-hq s [options]
```

**Options:**
- `--port <port>` - Specify port number (default: 3000)

**Examples:**
```bash
bunx dev-hq serve --port 8080
bunx dev-hq serve --port 3000
```

### 🏃 `run` - Execute Commands

**Aliases:** `r`
**Description:** Execute any command with Dev HQ monitoring

```bash
bunx dev-hq run <command> [options]
bunx dev-hq r <command> [options]
```

**Options:**
- `-m, --metrics` - Capture performance metrics

**Examples:**
```bash
bunx dev-hq run "npm run build" --metrics
bunx dev-hq run "bun test" --metrics
bunx dev-hq run "ls -la"
```

## 🌍 Global Options

These options can be used with any command:

### Output Formatting
- `--json` - Output in JSON format
- `--table` - Output in table format (Bun.inspect.table)
- `--format <format>` - Specify format: `json|table|pretty` (default: pretty)

### Performance & Debugging
- `--perf` - Show Bun execution timing
- `--verbose` - Enable verbose logging
- `--quiet` - Quiet mode (minimal output)
- `--timeout <ms>` - Command timeout in milliseconds (default: 30000)

### Bun-Specific Features
- `--bun` - Enable Bun-themed ASCII output
- `--check-deps` - Validate package.json dependencies

### Output Management
- `--output <file>` - Save output to file
- `--help` - Show help information
- `--version` - Show version information

## 🎨 Usage Examples

### Basic Analysis
```bash
# Quick project overview
bunx dev-hq insights

# Detailed analysis with timing
bunx dev-hq insights --perf --verbose

# Export to different formats
bunx dev-hq insights --json > report.json
bunx dev-hq insights --csv > analysis.csv
bunx dev-hq insights --markdown > docs.md
```

### Development Workflow
```bash
# Check system health
bunx dev-hq health

# Validate dependencies
bunx dev-hq insights --check-deps

# Run tests with coverage
bunx dev-hq test --coverage

# Start development server
bunx dev-hq serve --port 3000
```

### CI/CD Integration
```bash
# JSON output for automation
bunx dev-hq insights --json --quiet > ci-report.json

# Health check for deployment
bunx dev-hq health --json

# Performance monitoring
bunx dev-hq run "npm run build" --metrics --json > build-metrics.json
```

### Advanced Usage
```bash
# Combine multiple options
bunx dev-hq insights --table --perf --check-deps --output analysis.txt

# Custom timeout and output
bunx dev-hq git --json --timeout 60000 --output git-analysis.json

# Quiet mode with metrics
bunx dev-hq run "npm run test" --metrics --quiet
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `DEV_HQ_TIMEOUT` - Default timeout override
- `DEV_HQ_OUTPUT_DIR` - Default output directory

### Configuration Files
The CLI looks for configuration in:
1. `devhq.config.json` in project root
2. `devhq` section in `package.json`
3. Environment variables

### Example Configuration
```json
{
  "devhq": {
    "defaultFormat": "table",
    "timeout": 30000,
    "checkDeps": true,
    "outputDir": "./reports"
  }
}
```

## 🚨 Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - Command timeout
- `4` - System check failed

## 🆘 Troubleshooting

### Common Issues

**Command not found:**
```bash
# Install globally
npm install -g @dev-hq/cli

# Or use npx
npx dev-hq --help
```

**Permission denied:**
```bash
# Make executable
chmod +x bin/dev-hq-cli.ts

# Or use bun directly
bun bin/dev-hq-cli.ts --help
```

**Timeout errors:**
```bash
# Increase timeout
bunx dev-hq insights --timeout 60000

# Or disable timeout
bunx dev-hq insights --timeout 0
```

### Debug Mode
```bash
# Enable verbose output
bunx dev-hq insights --verbose

# Check system health
bunx dev-hq health --verbose

# Performance analysis
bunx dev-hq insights --perf --verbose
```

## 📊 Performance Tips

1. **Use JSON format** for programmatic processing
2. **Enable quiet mode** in CI/CD pipelines
3. **Adjust timeout** for large codebases
4. **Use specific commands** instead of general analysis when possible
5. **Cache results** for repeated analysis

## 🔗 Integration Examples

### GitHub Actions
```yaml
- name: Code Analysis
  run: |
    bunx dev-hq insights --json --quiet > analysis.json
    bunx dev-hq health --json --quiet > health.json
```

### npm Scripts
```json
{
  "scripts": {
    "analyze": "dev-hq insights --table",
    "health": "dev-hq health",
    "analyze:json": "dev-hq insights --json > analysis.json",
    "serve": "dev-hq serve --port 3000"
  }
}
```

### Makefile
```makefile
analyze:
	dev-hq insights --table --output analysis.txt

health:
	dev-hq health --verbose

ci:
	dev-hq insights --json --quiet > ci-report.json
```

## 📚 Additional Resources

- **GitHub Repository:** [Dev HQ Source](https://github.com/your-org/dev-hq)
- **Bun Documentation:** [bun.sh](https://bun.sh)
- **Issue Tracker:** [GitHub Issues](https://github.com/your-org/dev-hq/issues)
- **Discord Community:** [Join our Discord](https://discord.gg/dev-hq)

---

*Dev HQ CLI - Built with ❤️ and Bun for maximum performance*
