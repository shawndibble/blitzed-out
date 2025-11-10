#!/bin/bash

# Script to identify which test file is hanging by running them individually

echo "🔍 Testing individual files to find hanging test..."

# Get all test files
test_files=$(find src -name "*.test.ts" -o -name "*.test.tsx")

# Track progress
total=$(echo "$test_files" | wc -l | tr -d ' ')
current=0

for test_file in $test_files; do
  current=$((current + 1))
  echo "[$current/$total] Testing: $test_file"

  # Run with 5 second timeout
  timeout 5s npx vitest run "$test_file" --reporter=dot --no-coverage 2>&1 > /dev/null

  exit_code=$?

  if [ $exit_code -eq 124 ]; then
    echo "⚠️  TIMEOUT: $test_file (took >5s)"
  elif [ $exit_code -ne 0 ]; then
    echo "❌ FAILED: $test_file"
  fi
done

echo "✅ Scan complete"
