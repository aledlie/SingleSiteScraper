#!/bin/bash

# Test runner script for SingleSiteScraper
# This script runs all tests in the tests directory while maintaining the proper working directory

set -e  # Exit on first error

# Change to project root directory
cd "$(dirname "$0")/.." || exit 1

echo "🧪 SingleSiteScraper Test Suite"
echo "================================"
echo "Running tests from: $(pwd)"
echo "Test files located in: tests/"

# Show what will be run based on arguments
if [ "$UNIT_ONLY" = true ]; then
  echo "Mode: Unit tests only (vitest)"
elif [ "$INTEGRATION_ONLY" = true ]; then
  echo "Mode: Integration tests only"
elif [ "$PROVIDER_ONLY" = true ]; then
  echo "Mode: Provider system tests only"
elif [ "$QUICK_MODE" = true ]; then
  echo "Mode: Quick run (unit + core integration tests)"
else
  echo "Mode: Full test suite (unit + provider system + legacy integration)"
fi

echo ""

# Parse command line arguments
QUICK_MODE=false
UNIT_ONLY=false
INTEGRATION_ONLY=false
PROVIDER_ONLY=false

for arg in "$@"; do
  case $arg in
    --quick)
      QUICK_MODE=true
      shift
      ;;
    --unit-only)
      UNIT_ONLY=true
      shift
      ;;
    --integration-only)
      INTEGRATION_ONLY=true
      shift
      ;;
    --provider-only)
      PROVIDER_ONLY=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --quick           Skip slower integration tests"
      echo "  --unit-only       Run only unit tests (vitest)"
      echo "  --integration-only Run only integration tests"
      echo "  --provider-only   Run only provider system tests"
      echo "  --help           Show this help message"
      exit 0
      ;;
  esac
done

# Function to run a test with proper error handling
run_test() {
  local test_name="$1"
  local test_command="$2"
  
  echo "🔄 Running $test_name..."
  if eval "$test_command"; then
    echo "✅ $test_name passed"
    return 0
  else
    echo "❌ $test_name failed"
    return 1
  fi
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run unit tests (vitest) including provider tests
if [ "$INTEGRATION_ONLY" = false ] && [ "$PROVIDER_ONLY" = false ]; then
  echo "📚 Unit Tests (vitest)"
  echo "---------------------"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test "Unit Tests (includes Provider System Tests)" "npm run test -- --run --reporter=verbose"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
fi

# Run provider system tests separately (for focused testing)
if [ "$PROVIDER_ONLY" = true ] || ([ "$INTEGRATION_ONLY" = false ] && [ "$UNIT_ONLY" = false ]); then
  echo "🔧 Provider System Tests"
  echo "------------------------"
  
  # Core Provider Tests
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test "Base Provider Tests" "npm run test -- tests/src/scraper/providers/base.test.ts --run --reporter=verbose"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
  
  # Provider Manager Tests
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test "Provider Manager Tests" "npm run test -- tests/src/scraper/providers/manager.test.ts --run --reporter=verbose"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
  
  # Legacy Provider Tests
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test "Legacy Provider Tests" "npm run test -- tests/src/scraper/providers/legacy.test.ts --run --reporter=verbose"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
  
  # Playwright Provider Tests
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test "Playwright Provider Tests" "npm run test -- tests/src/scraper/providers/playwright.test.ts --run --reporter=verbose"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
  
  # Integration Tests (Provider Fallbacks)
  if [ "$QUICK_MODE" = false ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test "Provider Integration Tests" "npm run test -- tests/src/scraper/providers/integration.test.ts --run --reporter=verbose --testTimeout=15000"; then
      PASSED_TESTS=$((PASSED_TESTS + 1))
    else
      FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
  fi
fi

# Run integration tests (legacy)
if [ "$UNIT_ONLY" = false ] && [ "$PROVIDER_ONLY" = false ]; then
  echo "🔗 Legacy Integration Tests"
  echo "----------------------------"
  
  # Enhanced Scraper Provider Tests
  if [ "$QUICK_MODE" = false ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test "Enhanced Scraper Test Suite" "npx tsx tests/test-enhanced-scraper.js"; then
      PASSED_TESTS=$((PASSED_TESTS + 1))
    else
      FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
  fi
  
  # Provider Debug Tests
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test "Provider Debug Tests" "timeout 30s npx tsx tests/debug-providers.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
  
  # Direct Provider Tests
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test "Direct Provider Tests" "npx tsx tests/test-providers-direct.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
  
  # Performance Comparison (only in full mode)
  if [ "$QUICK_MODE" = false ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test "Performance Comparison" "npx tsx tests/performance-comparison.js"; then
      PASSED_TESTS=$((PASSED_TESTS + 1))
    else
      FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
  fi
fi

# Test Summary
echo "📊 Test Summary"
echo "==============="
echo "Total Test Suites: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS ✅"
echo "Failed: $FAILED_TESTS ❌"

if [ $FAILED_TESTS -eq 0 ]; then
  echo ""
  echo "🎉 All test suites passed!"
  echo ""
  echo "📋 Test Coverage Includes:"
  echo "   • Unit tests (vitest) - Core functionality"
  echo "   • Provider System Tests - Scraping providers & fallbacks"
  echo "   • Legacy Integration Tests - End-to-end scenarios"
  echo ""
  echo "🔧 Provider System Tests validate:"
  echo "   • Base provider functionality & metrics"
  echo "   • Provider manager & selection strategies"
  echo "   • Legacy CORS proxy implementation"
  echo "   • Playwright browser automation"
  echo "   • Integration & fallback scenarios"
  exit 0
else
  echo ""
  echo "⚠️  Some test suites failed. Check the output above for details."
  echo ""
  echo "💡 To run specific test categories:"
  echo "   $0 --unit-only          # Run only vitest unit tests"
  echo "   $0 --provider-only      # Run only provider system tests"
  echo "   $0 --integration-only   # Run only integration tests"
  echo "   $0 --quick              # Skip slow integration tests"
  exit 1
fi