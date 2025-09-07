#!/bin/bash

# Test runner script for SingleSiteScraper
# This script runs all tests in the tests directory while maintaining the proper working directory

# Change to project root directory
cd "$(dirname "$0")/.." || exit 1

echo "Running tests from: $(pwd)"
echo "Test files located in: tests/"
echo ""

# Run vitest with proper configuration
npm run test "$@"