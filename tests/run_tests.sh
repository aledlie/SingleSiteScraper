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
echo ""

# Parse command line arguments
QUICK_MODE=false
UNIT_ONLY=false
INTEGRATION_ONLY=false

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
    --help|-h)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --quick           Skip slower integration tests"
      echo "  --unit-only       Run only unit tests (vitest)"
      echo "  --integration-only Run only integration tests"
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

# Run unit tests (vitest)
if [ "$INTEGRATION_ONLY" = false ]; then
  echo "📚 Unit Tests (vitest)"
  echo "---------------------"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_test "Unit Tests" "npm run test -- --run --reporter=verbose"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
fi

# Run integration tests
if [ "$UNIT_ONLY" = false ]; then
  echo "🔗 Integration Tests"
  echo "-------------------"
  
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
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS ✅"
echo "Failed: $FAILED_TESTS ❌"

if [ $FAILED_TESTS -eq 0 ]; then
  echo ""
  echo "🎉 All tests passed!"
  exit 0
else
  echo ""
  echo "⚠️  Some tests failed. Check the output above for details."
  exit 1
fi