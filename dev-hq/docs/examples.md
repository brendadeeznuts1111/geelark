# Dev HQ Examples

This document provides practical examples and use cases for the Dev HQ automation suite.

## 🚀 Quick Start Examples

### Basic API Server Usage

```typescript
import { getServer } from './api-server.js';

// Start the server
const server = getServer();
console.log(`🚀 Server running at: ${server.url.href}`);

// Test all endpoints
const endpoints = ['health', 'secrets', 'mmap', 'plugin', 'glob'];
for (const endpoint of endpoints) {
  const response = await fetch(`${server.url.href}${endpoint}`);
  const data = await response.json();
  console.log(`${endpoint}:`, data.success ? '✅' : '❌');
}
```

### Command Automation Examples

```typescript
import { DevHQAutomation } from './automation.js';

const automation = new DevHQAutomation();

// Example 1: File operations
async function processFiles() {
  const files = await automation.runCommand('list-files', ['ls', '-la', '*.txt']);
  if (files.exitCode === 0) {
    const fileNames = files.stdout.split('\n').filter(line => line.includes('.txt'));
    console.log('Found files:', fileNames);

    // Process each file concurrently
    const results = await Promise.all(
      fileNames.map(file =>
        automation.runCommand(`process-${file}`, ['wc', '-l', file])
      )
    );

    return results.map(r => r.stdout.trim());
  }
}

// Example 2: Git operations
async function gitStatus() {
  const status = await automation.runCommand('git-status', ['git', 'status', '--porcelain']);
  const changed = status.stdout.split('\n').filter(line => line.trim());

  if (changed.length > 0) {
    console.log(`📝 ${changed.length} files changed`);

    // Stage all changes
    await automation.runCommand('git-add', ['git', 'add', '.']);

    // Commit with message
    await automation.runCommand('git-commit', [
      'git', 'commit', '-m', 'Automated commit from Dev HQ'
    ]);

    console.log('✅ Changes committed');
  }
}

// Example 3: Build and test
async function buildAndTest() {
  console.log('🔨 Building project...');

  // Clean previous build
  await automation.runCommand('clean', ['rm', '-rf', 'dist']);

  // Install dependencies
  const install = await automation.runCommand('install', ['bun', 'install']);
  if (install.exitCode !== 0) {
    throw new Error('Failed to install dependencies');
  }

  // Build project
  const build = await automation.runCommand('build', ['bun', 'build', './src/index.ts']);
  if (build.exitCode !== 0) {
    console.error('Build failed:', build.stderr);
    return;
  }

  // Run tests
  console.log('🧪 Running tests...');
  const tests = await automation.runCommand('test', ['bun', 'test', '--coverage']);

  console.log('✅ Build and test completed');
  console.log('Test output:', tests.stdout);
}
```

### Spawn Server Examples

```typescript
import { EnhancedDevHQServer } from './spawn-server.js';

// Example 1: Basic HTTP API
const server = new EnhancedDevHQServer({
  port: 3001,
  enableAuth: true,
  enableMetrics: true
});

server.start();

// Execute command via HTTP
async function executeCommand(command, args = []) {
  const response = await fetch('http://localhost:3001/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-auth-token'
    },
    body: JSON.stringify({
      cmd: [command, ...args],
      timeout: 5000
    })
  });

  return await response.json();
}

// Example 2: WebSocket streaming
function streamCommand(command) {
  const ws = new WebSocket('ws://localhost:3001/stream?token=your-auth-token');

  ws.onopen = () => {
    ws.send(JSON.stringify({
      cmd: command,
      stream: true
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.output) {
      console.log(data.output);
    }
    if (data.done) {
      ws.close();
    }
  };
}

// Example usage:
streamCommand(['tail', '-f', '/var/log/syslog']);
```

## 🔄 Advanced Patterns

### Concurrent Processing

```typescript
// Process multiple files concurrently
async function processBatch(files) {
  const CONCURRENT_LIMIT = 5;
  const results = [];

  for (let i = 0; i < files.length; i += CONCURRENT_LIMIT) {
    const batch = files.slice(i, i + CONCURRENT_LIMIT);
    const batchResults = await Promise.all(
      batch.map(file =>
        automation.runCommand(`process-${file}`, ['node', 'processor.js', file])
      )
    );
    results.push(...batchResults);
  }

  return results;
}

// Use processConcurrently utility for large collections
import { processConcurrently, CONCURRENT_CONFIGS } from './ConcurrentProcessor.js';

const results = await processConcurrently(
  largeFileList,
  async (file) => {
    const result = await automation.runCommand(`process-${file}`, ['cat', file]);
    return { file, content: result.stdout };
  },
  CONCURRENT_CONFIGS.IO_BOUND
);
```

### Error Handling & Retries

```typescript
async function robustCommand(label, command, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await automation.runCommand(label, command, {
        timeout: 10000,
        retry: attempt > 1
      });

      if (result.exitCode === 0) {
        return result;
      }

      console.warn(`Attempt ${attempt} failed for ${label}`);

      if (attempt === maxRetries) {
        throw new Error(`Command failed after ${maxRetries} attempts: ${result.stderr}`);
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));

    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.warn(`Attempt ${attempt} error for ${label}:`, error.message);
    }
  }
}

// Usage:
const result = await robustCommand('deploy', ['npm', 'run', 'deploy']);
```

### Memory Management

```typescript
import { memoryManager } from './MemoryManager.js';

// Register resources for automatic cleanup
function setupResourceManagement() {
  // Register database connections
  const dbConnection = createDatabaseConnection();
  memoryManager.registerResource(dbConnection, () => {
    dbConnection.close();
    console.log('🧹 Database connection cleaned up');
  }, 'DatabaseConnection');

  // Register file handles
  const fileHandle = await openFile('large-file.log');
  memoryManager.registerResource(fileHandle, () => {
    fileHandle.close();
    console.log('🧹 File handle cleaned up');
  }, 'FileHandle');

  // Monitor memory usage
  setInterval(() => {
    const stats = memoryManager.getMemoryStats();
    if (stats.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('⚠️ High memory usage detected:', stats);
      memoryManager.forceGC();
    }
  }, 30000);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  memoryManager.shutdown();
  process.exit(0);
});
```

## 🌐 Real-World Use Cases

### 1. CI/CD Pipeline Automation

```typescript
class CIPipeline {
  constructor(automation) {
    this.automation = automation;
  }

  async runPipeline() {
    try {
      await this.setupEnvironment();
      await this.runTests();
      await this.buildArtifact();
      await this.deployToStaging();
      await this.runIntegrationTests();
      await this.deployToProduction();

      console.log('✅ Pipeline completed successfully');
    } catch (error) {
      console.error('❌ Pipeline failed:', error.message);
      await this.notifyFailure(error);
      throw error;
    }
  }

  async setupEnvironment() {
    console.log('🔧 Setting up environment...');
    await this.automation.runCommand('env-setup', ['npm', 'ci']);
    await this.automation.runCommand('env-config', ['cp', '.env.example', '.env']);
  }

  async runTests() {
    console.log('🧪 Running tests...');
    const result = await this.automation.runCommand('tests', ['npm', 'test', '--', '--coverage']);

    if (result.exitCode !== 0) {
      throw new Error('Tests failed');
    }
  }

  async buildArtifact() {
    console.log('📦 Building artifact...');
    const result = await this.automation.runCommand('build', ['npm', 'run', 'build']);

    if (result.exitCode !== 0) {
      throw new Error('Build failed');
    }
  }

  async deployToStaging() {
    console.log('🚀 Deploying to staging...');
    await this.automation.runCommand('deploy-staging', [
      'rsync', '-avz', 'dist/', 'user@staging-server:/app/'
    ]);
  }

  async runIntegrationTests() {
    console.log('🔍 Running integration tests...');
    const result = await this.automation.runCommand('integration-tests', [
      'curl', '-f', 'https://staging.example.com/health'
    ]);

    if (result.exitCode !== 0) {
      throw new Error('Integration tests failed');
    }
  }

  async deployToProduction() {
    console.log('🎉 Deploying to production...');
    await this.automation.runCommand('deploy-prod', [
      'rsync', '-avz', 'dist/', 'user@prod-server:/app/'
    ]);
  }

  async notifyFailure(error) {
    await this.automation.runCommand('notify', [
      'curl', '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({
        text: `❌ CI Pipeline Failed: ${error.message}`,
        channel: '#alerts'
      }),
      'https://hooks.slack.com/your-webhook-url'
    ]);
  }
}

// Usage:
const pipeline = new CIPipeline(automation);
await pipeline.runPipeline();
```

### 2. Development Environment Manager

```typescript
class DevEnvironment {
  constructor(automation) {
    this.automation = automation;
  }

  async startDevelopment() {
    console.log('🚀 Starting development environment...');

    // Start all services
    await this.startDatabase();
    await this.startRedis();
    await this.startBackend();
    await this.startFrontend();

    console.log('✅ Development environment ready');
    console.log('📊 Services:');
    console.log('  - Database: http://localhost:5432');
    console.log('  - Redis: http://localhost:6379');
    console.log('  - Backend: http://localhost:3000');
    console.log('  - Frontend: http://localhost:5173');
  }

  async startDatabase() {
    await this.automation.runCommand('database', ['docker', 'run', '-d',
      '--name', 'dev-db',
      '-e', 'POSTGRES_PASSWORD=dev',
      '-p', '5432:5432',
      'postgres:15'
    ], { stream: true });

    // Wait for database to be ready
    await this.waitForService('localhost:5432');
  }

  async startRedis() {
    await this.automation.runCommand('redis', ['docker', 'run', '-d',
      '--name', 'dev-redis',
      '-p', '6379:6379',
      'redis:7'
    ]);
  }

  async startBackend() {
    await this.automation.runCommand('backend', ['npm', 'run', 'dev'], {
      stream: true,
      cwd: './backend'
    });
  }

  async startFrontend() {
    await this.automation.runCommand('frontend', ['npm', 'run', 'dev'], {
      stream: true,
      cwd: './frontend'
    });
  }

  async waitForService(hostAndPort, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.automation.runCommand('check-service', [
          'nc', '-z', ...hostAndPort.split(':')
        ]);
        console.log(`✅ ${hostAndPort} is ready`);
        return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error(`Service ${hostAndPort} failed to start`);
  }

  async stopDevelopment() {
    console.log('🛑 Stopping development environment...');

    await this.automation.runCommand('stop-db', ['docker', 'stop', 'dev-db']);
    await this.automation.runCommand('stop-redis', ['docker', 'stop', 'dev-redis']);
    await this.automation.runCommand('cleanup', ['docker', 'rm', 'dev-db', 'dev-redis']);

    console.log('✅ Development environment stopped');
  }
}

// Usage:
const devEnv = new DevEnvironment(automation);
await devEnv.startDevelopment();

// Stop when done
process.on('SIGINT', async () => {
  await devEnv.stopDevelopment();
  process.exit(0);
});
```

### 3. Log Analysis & Monitoring

```typescript
class LogAnalyzer {
  constructor(automation) {
    this.automation = automation;
  }

  async analyzeLogs(logFile, pattern) {
    console.log(`📊 Analyzing ${logFile} for pattern: ${pattern}`);

    // Extract matching lines
    const grep = await this.automation.runCommand('grep', [
      'grep', '-n', pattern, logFile
    ]);

    if (grep.exitCode !== 0) {
      console.log('No matches found');
      return [];
    }

    const lines = grep.stdout.split('\n').filter(line => line.trim());

    // Analyze patterns
    const analysis = {
      totalMatches: lines.length,
      timeDistribution: this.analyzeTimeDistribution(lines),
      topErrors: this.extractTopErrors(lines),
      severityBreakdown: this.categorizeBySeverity(lines)
    };

    console.log('📈 Analysis Results:');
    console.log(`  Total matches: ${analysis.totalMatches}`);
    console.log(`  Error breakdown:`, analysis.severityBreakdown);
    console.log(`  Top errors:`, analysis.topErrors.slice(0, 5));

    return analysis;
  }

  analyzeTimeDistribution(lines) {
    const hours = {};

    lines.forEach(line => {
      const timeMatch = line.match(/\d{2}:\d{2}:\d{2}/);
      if (timeMatch) {
        const hour = timeMatch[0].split(':')[0];
        hours[hour] = (hours[hour] || 0) + 1;
      }
    });

    return hours;
  }

  extractTopErrors(lines) {
    const errorCounts = {};

    lines.forEach(line => {
      const errorMatch = line.match(/ERROR:\s*(.+)/);
      if (errorMatch) {
        const error = errorMatch[1].trim();
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      }
    });

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([error, count]) => ({ error, count }));
  }

  categorizeBySeverity(lines) {
    const categories = {
      ERROR: 0,
      WARN: 0,
      INFO: 0,
      DEBUG: 0
    };

    lines.forEach(line => {
      if (line.includes('ERROR')) categories.ERROR++;
      else if (line.includes('WARN')) categories.WARN++;
      else if (line.includes('INFO')) categories.INFO++;
      else if (line.includes('DEBUG')) categories.DEBUG++;
    });

    return categories;
  }

  async generateReport(analysis, outputFile) {
    const report = `
# Log Analysis Report

## Summary
- Total matches: ${analysis.totalMatches}
- Generated: ${new Date().toISOString()}

## Severity Breakdown
- ERROR: ${analysis.severityBreakdown.ERROR}
- WARN: ${analysis.severityBreakdown.WARN}
- INFO: ${analysis.severityBreakdown.INFO}
- DEBUG: ${analysis.severityBreakdown.DEBUG}

## Top Errors
${analysis.topErrors.map(({error, count}) => `- ${error} (${count} times)`).join('\n')}

## Time Distribution
${Object.entries(analysis.timeDistribution)
  .map(([hour, count]) => `- ${hour}:00 - ${count} occurrences`)
  .join('\n')}
`;

    await this.automation.runCommand('write-report', [
      'tee', outputFile
    ], { input: report });

    console.log(`📄 Report saved to ${outputFile}`);
  }
}

// Usage:
const analyzer = new LogAnalyzer(automation);
const analysis = await analyzer.analyzeLogs('/var/log/app.log', 'ERROR');
await analyzer.generateReport(analysis, 'log-analysis-report.md');
```

## 🔧 Integration Examples

### Docker Integration

```bash
# Dockerfile for Dev HQ
FROM oven/bun:1.3

WORKDIR /app
COPY package*.json ./
RUN bun install

COPY . .
RUN bun build ./dev-hq/api-server.ts --outdir=./dist

EXPOSE 3000 3001

CMD ["bun", "run", "./dev-hq/spawn-server.ts"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  dev-hq-api:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DEV_HQ_ENABLE_AUTH=true
      - DEV_HQ_SECRET_KEY=${DEV_HQ_SECRET_KEY}
    volumes:
      - ./logs:/app/logs
      - /var/run/docker.sock:/var/run/docker.sock
```

### Kubernetes Integration

```yaml
# dev-hq-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dev-hq
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dev-hq
  template:
    metadata:
      labels:
        app: dev-hq
    spec:
      containers:
      - name: dev-hq
        image: your-registry/dev-hq:latest
        ports:
        - containerPort: 3000
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DEV_HQ_ENABLE_AUTH
          value: "true"
        - name: DEV_HQ_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: dev-hq-secrets
              key: secret-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: dev-hq-service
spec:
  selector:
    app: dev-hq
  ports:
  - name: api
    port: 3000
    targetPort: 3000
  - name: automation
    port: 3001
    targetPort: 3001
  type: LoadBalancer
```

These examples demonstrate the versatility and power of the Dev HQ automation suite across various development and deployment scenarios.
