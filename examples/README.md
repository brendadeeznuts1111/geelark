# Bun Examples - Processes, System, Shell, Time Zone & Config

This directory contains practical examples demonstrating Bun's process spawning, system interaction, shell command execution, time zone configuration, and environment variable management capabilities.

## Overview

The examples are organized into several categories:

### 🚀 Processes (`processes/`)

Examples of child process management using `Bun.spawn()`:

- **`basic-spawn.ts`** - Fundamental process spawning operations
- **`process-config.ts`** - Configuration options (environment, working directory, exit handlers)
- **`stdout-stderr.ts`** - Working with process output streams as `ReadableStream`

### 🔧 System (`system/`)

Examples of system integration and file operations:

- **`file-operations.ts`** - File reading/writing with `Bun.write()` and `Bun.read()`
- **`working-directory.ts`** - Directory management and path resolution

### 🖥️ CLI (`cli-args.ts`)

Command-line argument parsing with Bun.argv and util.parseArgs:

- Basic `Bun.argv` access and manual parsing
- Structured argument parsing with `util.parseArgs`
- Building complete CLI tools with help and version flags

### 🐚 Shell Commands (`shell/`)

Examples of shell command execution using the `$` tagged template function:

- **`index.ts`** - Basic command execution with `$` template literals
- (**`README.md`** - Shell command execution documentation)

Includes capturing output as text, processing line-by-line, and async/await integration.

### 📅 Time Zone Management (`timezone.ts`)

Time zone configuration using the TZ environment variable:

- Setting timezone programmatically with `process.env.TZ`
- Demonstrating timezone effects on Date instances
- Command-line timezone specification

### ⚙️ Environment Variables (`env-vars.ts`)

Environment variable management and configuration loading:

- Accessing variables with `Bun.env` and `process.env`
- Automatic `.env` file loading (`.env`, `.env.production`, etc.)
- Command-line environment variable setting
- Environment-based configuration patterns

### ✏️ I/O Streams (`stdin-reading.ts`)

Reading from stdin using different approaches:

- `console` as AsyncIterable for line-by-line interactive input
- `Bun.stdin.stream()` for chunked data reading
- Handling piped vs interactive stdin scenarios

## Key Features Demonstrated

### Child Process Management
```ts
// Basic spawning
const proc = Bun.spawn(["echo", "hello"]);
await proc.exited;

// With configuration
const proc = Bun.spawn(["command"], {
  cwd: "/tmp",
  env: { CUSTOM_VAR: "value" },
  onExit(proc, exitCode, signalCode, error) {
    // exit handler
  },
});

// Reading output
const output = await proc.stdout.text(); // "hello\n"
```

### Shell Command Execution
```ts
// Basic command execution
await $`echo Hello, world!`; // => "Hello, world!"

// Capturing output
const output = await $`ls -l`.text();

// Processing line-by-line
for await (const line of $`ls -l`.lines()) {
  console.log(line);
}
```

### Time Zone Configuration
```ts
// Set timezone programmatically
process.env.TZ = "America/New_York";

// Date instances now use New York time zone
new Date().getHours(); // Hours in New York timezone

// Or set from command line
// TZ=America/New_York bun run example.ts
```

### Environment Variable Management
```ts
// Accessing environment variables
console.log(Bun.env.API_TOKEN);     // => "secret"
console.log(process.env.API_TOKEN);  // => "secret"

// Setting programmatically
process.env.CUSTOM_VAR = "value";

// .env file auto-loading (.env, .env.production, .env.test, etc.)
```

### System Integration
```ts
// File operations
await Bun.write("/tmp/file.json", JSON.stringify(data));
const content = await Bun.read("/tmp/file.json");
```

## Running Examples

All examples are executable TypeScript files that demonstrate real functionality:

```bash
# Run any example
bun run examples/processes/basic-spawn.ts
bun run examples/system/file-operations.ts
bun run examples/shell/index.ts
bun run examples/timezone.ts
bun run examples/env-vars.ts
```

## Bun.spawn() Documentation

For complete documentation on child process management, see:
[Bun.spawn() - Child Processes](https://bun.sh/docs/runtime/child-process)

This implementation covers the core functionality shown in the documentation examples and extends it with additional practical scenarios.
