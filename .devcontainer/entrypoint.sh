#!/bin/bash
set -e

echo "🚀 Starting Geelark Development Environment"
echo "==========================================="

# Check if we need to install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Check if we need to build the project
if [ ! -f "dist/dev/index.js" ]; then
    echo "🔨 Building development version..."
    bun run build:dev
fi

# Initialize git if not already a repository
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git config user.email "developer@geelark.dev"
    git config user.name "Geelark Developer"
fi

# Set up git hooks for security scanning
if [ ! -d ".git/hooks" ]; then
    mkdir -p .git/hooks
fi

# Create pre-commit hook for security scanning
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Running pre-commit security checks..."

# Run security scanning
if command -v snyk &> /dev/null; then
    echo "🔒 Running Snyk security scan..."
    snyk test --severity-threshold=high || {
        echo "❌ Security vulnerabilities found. Commit blocked."
        exit 1
    }
fi

# Run bandit for Python security (if any Python files)
if command -v bandit &> /dev/null && find . -name "*.py" | grep -q .; then
    echo "🐍 Running Bandit security scan..."
    bandit -r . -ll || {
        echo "❌ Python security issues found. Commit blocked."
        exit 1
    }
fi

echo "✅ Security checks passed!"
EOF

chmod +x .git/hooks/pre-commit

# Create pre-push hook for comprehensive testing
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
echo "🧪 Running pre-push tests..."

# Run feature flag elimination tests
echo "📊 Testing feature flag elimination..."
bun test tests/feature-elimination.test.ts

# Run type safety tests
echo "📐 Testing type safety..."
bun test tests/type-testing.test.ts

# Run bundle size validation
echo "📦 Validating bundle sizes..."
bun run build:compare

echo "✅ All pre-push tests passed!"
EOF

chmod +x .git/hooks/pre-push

# Start development services based on environment
if [ "$START_SERVICES" = "true" ]; then
    echo "🌐 Starting development services..."
    
    # Start dev-hq automation server in background
    echo "🤖 Starting Dev HQ automation server..."
    bun run dev-hq server &
    
    # Start the main application in development mode
    echo "🚀 Starting Geelark application..."
    bun run start:dev &
    
    # Start monitoring dashboard
    echo "📊 Starting monitoring dashboard..."
    bun run dashboard &
fi

# Display development environment information
echo ""
echo "🎉 Development Environment Ready!"
echo "================================="
echo "📁 Workspace: /workspace"
echo "🐰 Bun Version: $(bun --version)"
echo "📦 Node Version: $(node --version)"
echo "🔧 Tools Available:"
echo "   - Snyk: $(command -v snyk > /dev/null && echo '✅' || echo '❌')"
echo "   - Trivy: $(command -v trivy > /dev/null && echo '✅' || echo '❌')"
echo "   - Bandit: $(command -v bandit > /dev/null && echo '✅' || echo '❌')"
echo "   - Grype: $(command -v grype > /dev/null && echo '✅' || echo '❌')"
echo ""
echo "📚 Available Commands:"
echo "   bun run build:dev     - Build development version"
echo "   bun run test          - Run all tests"
echo "   bun run dashboard     - Open monitoring dashboard"
echo "   bun run dev-hq        - Use Dev HQ automation tools"
echo ""
echo "🔒 Security Tools:"
echo "   snyk test             - Run security vulnerability scan"
echo "   bandit -r .           - Run Python security scan"
echo "   trivy fs .            - Run container vulnerability scan"
echo "   grype .               - Run vulnerability scan"
echo ""
echo "💡 Development Tips:"
echo "   - Git hooks are installed for security scanning"
echo "   - Use 'bun run' to see all available scripts"
echo "   - Check package.json for build configurations"
echo ""

# If we're starting services, keep container running
if [ "$START_SERVICES" = "true" ]; then
    echo "🔄 Services running. Press Ctrl+C to stop."
    # Keep container running
    tail -f /dev/null
else
    echo "🏃 Ready for development. Start services with:"
    echo "   export START_SERVICES=true && /entrypoint.sh"
    echo ""
    exec "$@"
fi