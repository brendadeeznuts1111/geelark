# Test Suite Documentation

## Current Test Status

### Overview
The test suite contains 36 test files covering various aspects of the Dev HQ CLI and Bun integration. However, there are currently some issues with flag parsing tests.

### Test Categories

#### 1. Flag Separation Pattern Tests (`tests/pattern.test.ts`)
**Status**: ⚠️ Partial Failures (6/10 failing)

This is the core test suite for the flag separation pattern. Tests include:

- ✅ `bun flags + cli flags` - Basic pattern demonstration
- ❌ `multiple bun flags + multiple cli flags` - Flag detection issue
- ❌ `bun define flag with cli timeout flag` - Timeout/failure
- ❌ `bun watch flag with cli quiet flag` - Flag detection issue
- ✅ `no bun flags + cli flags only` - Working correctly
- ❌ `bun flags only + no cli flags` - Flag detection issue
- ❌ `complex real-world scenario` - Flag detection issue
- ✅ `output formatting verification` - Working correctly
- ❌ `flag parsing edge cases` - Flag detection issue
- ✅ `help command shows pattern documentation` - Working correctly

**Issue**: Bun flags are not being properly detected by the `parseArguments()` method, causing tests to expect `🟡 Bun flags: [--hot, --watch]` but receive `🟡 Bun flags: []`.

#### 2. Feature Elimination Tests
**Files**:
- `tests/feature-elimination.test.ts`
- `tests/advanced-feature-elimination.test.ts`
- `tests/feature-flag-pro-tips.test.ts`

**Status**: ❌ Module loading errors

#### 3. Type Testing Suite
**Files**:
- `tests/type-testing.test.ts`
- `tests/expectTypeOf-*.test.ts` (multiple files)
- `tests/advanced-expectTypeOf.test.ts`

**Status**: ❌ Module loading errors

#### 4. Bun CLI Integration Tests
**Files**:
- `tests/bun-cli-*.test.ts` (multiple files)
- `tests/bun-specific-flag-combo.test.ts`
- `tests/bun-watch-*.test.ts` (multiple files)

**Status**: ❌ Module loading errors

#### 5. API and Network Tests
**Files**:
- `tests/api-fixes*.test.ts`
- `tests/fetch-proxy-headers.test.ts`
- `tests/http-agent-keepalive.test.ts`
- `tests/proxy-connection.test.ts`

**Status**: ❌ Module loading errors

#### 6. Utility Tests
**Files**:
- `tests/glob*.test.ts`
- `tests/server.test.ts`
- `tests/create-fixtures.test.ts`

**Status**: ❌ Module loading errors

## Test Categories Breakdown

### Working Tests (4/10)
1. **Basic Flag Separation** - Demonstrates the core pattern
2. **CLI Flags Only** - Handles CLI-only scenarios
3. **Output Formatting** - Verifies table/JSON output
4. **Help Documentation** - Ensures help displays correctly

### Failing Tests (6/10)
1. **Multiple Bun Flags Detection** - Bun flags not recognized
2. **Flag Value Parsing** - Complex flag combinations fail
3. **Timeout Issues** - Some tests timeout after 5000ms
4. **Edge Case Handling** - Complex scenarios not handled

### Module Loading Errors
Many tests fail with "Expected 'contents' to be a string or an ArrayBufferView" errors, indicating:
- Missing dependencies
- Import resolution issues
- File system access problems

## Root Cause Analysis

### Flag Parsing Issue
The `parseArguments()` method in `dev-hq-cli.ts` has a logic issue:

```typescript
// Current problematic logic
if (knownBunFlags.includes(arg) ||
    arg.startsWith("--define") ||
    arg.startsWith("--drop") ||
    arg.startsWith("--loader")) {
  bunFlags.push(arg);
  // ... handle values
}
```

**Problem**: When Bun processes flags like `--hot`, `--watch`, they don't reach the script's `argv` because Bun consumes them first.

### Expected vs Actual Behavior

**Test Expectation**:
```bash
bun --hot --watch dev-hq-cli.ts git --json
```
Should show: `🟡 Bun flags: [--hot, --watch]`

**Actual Result**:
Shows: `🟡 Bun flags: []`

**Reason**: Bun processes `--hot` and `--watch` before the script runs, so they're not in `process.argv`.

## Test Coverage Areas

### 1. Flag Separation Pattern
- ✅ Basic pattern demonstration
- ❌ Complex flag combinations
- ❌ Bun flag detection
- ✅ CLI flag handling
- ✅ Command execution

### 2. Output Formatting
- ✅ Table format
- ✅ JSON format
- ✅ Standard output
- ❌ Custom formats

### 3. Command Execution
- ✅ All basic commands (insights, git, cloc, etc.)
- ❌ Complex command scenarios
- ❌ Error handling
- ❌ Timeout handling

### 4. Integration Testing
- ❌ Bun runtime integration
- ❌ File watching
- ❌ Hot reloading
- ❌ Environment variables

## Recommendations

### Immediate Fixes
1. **Fix Flag Detection Logic**: Update `parseArguments()` to handle the fact that Bun consumes its flags
2. **Update Test Expectations**: Tests should expect empty Bun flags when using `dev-hq-cli.ts` directly
3. **Fix Module Loading**: Resolve import/dependency issues causing loading errors

### Test Improvements
1. **Add Integration Tests**: Test the full `bun --flags dev-hq-cli.ts command --flags` pattern
2. **Add Error Scenarios**: Test invalid flags, missing commands, etc.
3. **Performance Tests**: Add timing and memory usage tests
4. **End-to-End Tests**: Test complete workflows

### Documentation Updates
1. **Clarify Flag Handling**: Document which flags are handled by Bun vs CLI
2. **Test Examples**: Provide working test examples
3. **Troubleshooting Guide**: Document common test failures and solutions

## Running Tests

### Working Tests
```bash
# Run only the working pattern tests
bun test tests/pattern.test.ts -t "bun flags + cli flags"
bun test tests/pattern.test.ts -t "no bun flags + cli flags only"
bun test tests/pattern.test.ts -t "output formatting verification"
bun test tests/pattern.test.ts -t "help command"
```

### All Tests (with failures)
```bash
bun test tests/pattern.test.ts
```

### Specific Test Categories
```bash
# Run only snapshot tests
bun test tests/snapshot-testing.test.ts

# Run only seeded tests
bun test tests/seeded-testing.test.ts
```

## Test Environment

- **Runtime**: Bun v1.3.6
- **Platform**: macOS (darwin) arm64
- **Node Version**: v24.3.0
- **Test Framework**: Bun's built-in test runner

## Test Files Summary

| Category | Files | Status | Coverage |
|----------|-------|--------|----------|
| Flag Pattern | 3 | ⚠️ Partial | Core pattern working, flag detection broken |
| Feature Flags | 3 | ❌ Failing | Module loading issues |
| Type Testing | 5 | ❌ Failing | Module loading issues |
| Bun CLI | 8 | ❌ Failing | Module loading issues |
| API/Network | 5 | ❌ Failing | Module loading issues |
| Utilities | 4 | ❌ Failing | Module loading issues |
| Snapshots | 2 | ✅ Working | Basic snapshot tests pass |
| **Total** | **36** | **❌ Mostly Failing** | **~11% passing** |

## Next Steps

1. **Fix Flag Parsing**: Resolve the core issue with Bun flag detection
2. **Resolve Module Loading**: Fix import/dependency issues
3. **Update Test Expectations**: Align tests with actual Bun behavior
4. **Add Missing Tests**: Fill gaps in test coverage
5. **Improve Test Reliability**: Add better error handling and timeouts
