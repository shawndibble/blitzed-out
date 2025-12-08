#!/bin/bash
# Script to identify slow or hanging test files
# Usage: ./scripts/find-slow-tests.sh [shard] [timeout_seconds]
# Example: ./scripts/find-slow-tests.sh 2/3 30

SHARD=${1:-"2/3"}
TIMEOUT=${2:-30}

echo "Finding test files for shard $SHARD..."

# Get list of test files that would run in this shard
TEST_FILES=$(npx vitest run --no-watch --reporter=json --config=vitest.ci.config.ts --shard=$SHARD 2>/dev/null | grep -o '"file":"[^"]*"' | sed 's/"file":"//g' | sed 's/"//g' | sort -u)

if [ -z "$TEST_FILES" ]; then
  echo "Could not get test file list. Running with --list instead..."
  # Alternative: just list all test files and run them one by one
  TEST_FILES=$(find src -name "*.test.ts" -o -name "*.test.tsx" | sort)
fi

echo ""
echo "Testing each file with ${TIMEOUT}s timeout..."
echo "============================================"

for file in $TEST_FILES; do
  if [ -f "$file" ]; then
    echo -n "Testing: $file ... "

    # Run single file with timeout
    START=$(date +%s)

    # Use perl for cross-platform timeout (works on macOS and Linux)
    perl -e "alarm $TIMEOUT; exec @ARGV" \
      npx vitest run --no-watch --reporter=dot --config=vitest.ci.config.ts "$file" \
      > /dev/null 2>&1

    EXIT_CODE=$?
    END=$(date +%s)
    DURATION=$((END - START))

    if [ $EXIT_CODE -eq 142 ] || [ $EXIT_CODE -eq 137 ]; then
      echo "⏰ TIMEOUT after ${TIMEOUT}s (likely hanging)"
    elif [ $EXIT_CODE -eq 0 ]; then
      echo "✓ ${DURATION}s"
    else
      echo "✗ FAILED (${DURATION}s)"
    fi
  fi
done

echo ""
echo "Done!"
