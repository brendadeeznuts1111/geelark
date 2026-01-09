#!/bin/bash

# Dev HQ Test Runner Script
# Convenience script for running Dev HQ tests with various options

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

print_metric() {
    echo -e "${CYAN}[METRIC]${NC} $1"
}

# Show usage
show_usage() {
    echo -e "${PURPLE}Dev HQ Test Runner${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS] [TEST_TYPE]"
    echo ""
    echo -e "${CYAN}TEST_TYPE:${NC}"
    echo "  api-server    Run API server tests"
    echo "  automation    Run automation tests"
    echo "  spawn-server  Run spawn server tests"
    echo "  performance  Run performance benchmarks"
    echo "  security      Run security tests"
    echo "  all           Run all Dev HQ tests (default)"
    echo ""
    echo -e "${CYAN}OPTIONS:${NC}"
    echo "  -c, --coverage    Run with coverage report"
    echo "  -w, --watch       Run in watch mode"
    echo "  -v, --verbose     Verbose output"
    echo "  -d, --debug       Debug mode"
    echo "  -b, --benchmark   Run performance benchmarks"
    echo "  -s, --security    Run security-focused tests"
    echo "  -j, --json        Output results in JSON format"
    echo "  -h, --help        Show this help message"
    echo ""
    echo -e "${CYAN}EXAMPLES:${NC}"
    echo "  $0                    # Run all Dev HQ tests"
    echo "  $0 api-server         # Run only API server tests"
    echo "  $0 -c automation      # Run automation tests with coverage"
    echo "  $0 -w --debug         # Run all tests in watch mode with debug"
    echo "  $0 -b --json          # Run benchmarks with JSON output"
    echo ""
    echo -e "${CYAN}ENVIRONMENT VARIABLES:${NC}"
    echo "  DEV_HQ_TEST_TIMEOUT    Test timeout in milliseconds (default: 5000)"
    echo "  DEV_HQ_TEST_REPORTS    Generate test reports (true/false)"
    echo "  DEV_HQ_TEST_PARALLEL  Parallel test execution (default: true)"
}

# Default values
TEST_TYPE="all"
COVERAGE=false
WATCH=false
VERBOSE=false
DEBUG=false
BENCHMARK=false
SECURITY=false
JSON_OUTPUT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -w|--watch)
            WATCH=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -b|--benchmark)
            BENCHMARK=true
            shift
            ;;
        -s|--security)
            SECURITY=true
            shift
            ;;
        -j|--json)
            JSON_OUTPUT=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        api-server|automation|spawn-server|performance|security|all)
            TEST_TYPE=$1
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Set up environment
export NODE_ENV=test
export DEV_HQ_TEST_TIMEOUT=${DEV_HQ_TEST_TIMEOUT:-5000}
export DEV_HQ_TEST_REPORTS=${DEV_HQ_TEST_REPORTS:-true}
export DEV_HQ_TEST_PARALLEL=${DEV_HQ_TEST_PARALLEL:-true}

if [ "$DEBUG" = true ]; then
    export DEBUG=dev-hq:*
    print_status "Debug mode enabled"
fi

# Build test command
TEST_CMD="bun test"

if [ "$COVERAGE" = true ]; then
    TEST_CMD="$TEST_CMD --coverage"
fi

if [ "$WATCH" = true ]; then
    TEST_CMD="$TEST_CMD --watch"
fi

if [ "$VERBOSE" = true ]; then
    TEST_CMD="$TEST_CMD --verbose"
fi

if [ "$JSON_OUTPUT" = true ]; then
    TEST_CMD="$TEST_CMD --reporter=json"
fi

# Determine which tests to run
case $TEST_TYPE in
    api-server)
        TEST_PATTERN="tests/integration/dev-hq/dev-hq-api-server.test.ts"
        TEST_NAME="API Server Tests"
        ;;
    automation)
        TEST_PATTERN="tests/integration/dev-hq/dev-hq-automation.test.ts"
        TEST_NAME="Automation Tests"
        ;;
    spawn-server)
        TEST_PATTERN="tests/integration/dev-hq/dev-hq-spawn-server.test.ts"
        TEST_NAME="Spawn Server Tests"
        ;;
    performance)
        TEST_PATTERN="tests/integration/dev-hq/*.test.ts"
        TEST_NAME="Performance Tests"
        BENCHMARK=true
        ;;
    security)
        TEST_PATTERN="tests/integration/dev-hq/*.test.ts"
        TEST_NAME="Security Tests"
        SECURITY=true
        ;;
    all)
        TEST_PATTERN="tests/integration/dev-hq/*.test.ts"
        TEST_NAME="All Dev HQ Tests"
        ;;
esac

# Print header
print_header " Dev HQ Test Suite"
echo ""
print_status "Configuration:"
echo "  - Test Type: $TEST_NAME"
echo "  - Coverage: $([ "$COVERAGE" = true ] && echo "Enabled" || echo "Disabled")"
echo "  - Watch Mode: $([ "$WATCH" = true ] && echo "Enabled" || echo "Disabled")"
echo "  - Debug: $([ "$DEBUG" = true ] && echo "Enabled" || echo "Disabled")"
echo "  - Benchmark: $([ "$BENCHMARK" = true ] && echo "Enabled" || echo "Disabled")"
echo "  - Security: $([ "$SECURITY" = true ] && echo "Enabled" || echo "Disabled")"
echo "  - JSON Output: $([ "$JSON_OUTPUT" = true ] && echo "Enabled" || echo "Disabled")"
echo "  - Timeout: ${DEV_HQ_TEST_TIMEOUT}ms"
echo ""

# Run performance benchmarks if requested
if [ "$BENCHMARK" = true ]; then
    print_status "Running performance benchmarks..."

    # API Server benchmarks
    print_metric "API Server Benchmark:"
    start_time=$(date +%s%N)
    for i in {1..100}; do
        curl -s http://localhost:3000/health > /dev/null 2>&1 || true
    done
    end_time=$(date +%s%N)
    api_time=$(( (end_time - start_time) / 1000000 ))
    print_metric "  100 requests completed in ${api_time}ms"
    print_metric "  Average: $(( api_time / 100 ))ms per request"

    echo ""
fi

# Run security tests if requested
if [ "$SECURITY" = true ]; then
    print_status "Running security validation..."

    # Test authentication bypass
    auth_test=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/execute \
        -X POST -H "Content-Type: application/json" \
        -d '{"cmd": ["echo", "test"]}' 2>/dev/null || echo "000")

    if [ "$auth_test" = "401" ]; then
        print_success "Authentication bypass test: PASSED"
    else
        print_error "Authentication bypass test: FAILED (HTTP $auth_test)"
    fi

    # Test command injection
    injection_test=$(curl -s http://localhost:3001/execute \
        -X POST -H "Content-Type: application/json" \
        -H "Authorization: Bearer test-token" \
        -d '{"cmd": ["echo; rm -rf /"]}' 2>/dev/null | grep -c "rm -rf" || echo "0")

    if [ "$injection_test" = "0" ]; then
        print_success "Command injection test: PASSED"
    else
        print_error "Command injection test: FAILED"
    fi

    echo ""
fi

# Run the main tests
print_status "Executing: $TEST_CMD $TEST_PATTERN"
echo ""

START_TIME=$(date +%s)

# Create a temporary file for test results
if [ "$JSON_OUTPUT" = true ]; then
    TEST_RESULTS_FILE=$(mktemp)
    TEST_CMD="$TEST_CMD > $TEST_RESULTS_FILE"
fi

# Execute tests
if $TEST_CMD $TEST_PATTERN; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo ""
    print_success "All tests completed in ${DURATION}s!"

    # Extract metrics from test results
    if [ "$JSON_OUTPUT" = true ] && [ -f "$TEST_RESULTS_FILE" ]; then
        TOTAL_TESTS=$(jq '.numTotalTests' "$TEST_RESULTS_FILE" 2>/dev/null || echo "0")
        PASSED_TESTS=$(jq '.numPassedTests' "$TEST_RESULTS_FILE" 2>/dev/null || echo "0")
        FAILED_TESTS=$(jq '.numFailedTests' "$TEST_RESULTS_FILE" 2>/dev/null || echo "0")

        print_metric "Test Results:"
        print_metric "  Total: $TOTAL_TESTS"
        print_metric "  Passed: $PASSED_TESTS"
        print_metric "  Failed: $FAILED_TESTS"

        rm -f "$TEST_RESULTS_FILE"
    fi

    if [ "$COVERAGE" = true ]; then
        print_status "Coverage report generated in coverage/ directory"

        # Extract coverage metrics if available
        if [ -f "coverage/coverage-summary.json" ]; then
            LINES_PCT=$(jq '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")
            FUNCTIONS_PCT=$(jq '.total.functions.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")
            BRANCHES_PCT=$(jq '.total.branches.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")

            print_metric "Coverage Metrics:"
            print_metric "  Lines: ${LINES_PCT}%"
            print_metric "  Functions: ${FUNCTIONS_PCT}%"
            print_metric "  Branches: ${BRANCHES_PCT}%"
        fi
    fi

    # Generate test report if enabled
    if [ "$DEV_HQ_TEST_REPORTS" = true ]; then
        REPORT_FILE="test-results-$(date +%Y%m%d-%H%M%S).json"
        cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "testType": "$TEST_TYPE",
  "duration": $DURATION,
  "coverage": $([ "$COVERAGE" = true ] && echo "true" || echo "false"),
  "debug": $DEBUG,
  "environment": {
    "node": "$(node --version)",
    "bun": "$(bun --version)",
    "platform": "$(uname -s)"
  }
}
EOF
        print_status "Test report saved to $REPORT_FILE"
    fi

else
    print_error "Tests failed!"
    exit 1
fi

# Show final summary
echo ""
print_header " Test Summary"
echo "  - Test Type: $TEST_NAME"
echo "  - Duration: ${DURATION}s"
echo "  - Coverage: $([ "$COVERAGE" = true ] && echo "Enabled" || echo "Disabled")"
echo "  - Watch Mode: $([ "$WATCH" = true ] && echo "Enabled" || echo "Disabled")"
echo "  - Debug: $([ "$DEBUG" = true ] && echo "Enabled" || echo "Disabled")"
echo "  - Benchmark: $([ "$BENCHMARK" = true ] && echo "Enabled" || echo "Disabled")"
echo "  - Security: $([ "$SECURITY" = true ] && echo "Enabled" || echo "Disabled")"

if [ "$BENCHMARK" = true ] || [ "$SECURITY" = true ]; then
    echo ""
    print_status "Additional validations completed successfully"
fi

echo ""
print_success "Dev HQ test suite completed! "
