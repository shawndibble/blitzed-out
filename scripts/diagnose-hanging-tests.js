#!/usr/bin/env node

/**
 * Test Diagnostics - Find hanging tests
 * Runs each test file individually to identify problematic ones
 */

/* eslint-env node */
/* global process */

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const TEST_TIMEOUT = 30000; // 30 seconds per test file

function findTestFiles(dir, testFiles = []) {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findTestFiles(fullPath, testFiles);
    } else if (file.match(/\.(test|spec)\.(js|jsx|ts|tsx)$/)) {
      testFiles.push(fullPath);
    }
  }

  return testFiles;
}

function runSingleTest(testFile, index, total) {
  const relativePath = testFile.replace(process.cwd() + '/', '');
  console.log(`\n[${index + 1}/${total}] Testing: ${relativePath}`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    // Use vitest with a timeout and simpler config for diagnostics
    const command = `NODE_OPTIONS='--max-old-space-size=2048' npx vitest run --no-watch --reporter=verbose "${testFile}" --testTimeout=5000 --hookTimeout=5000`;

    execSync(command, {
      stdio: 'pipe',
      timeout: TEST_TIMEOUT, // 30 seconds
      encoding: 'utf8',
    });

    const duration = Date.now() - startTime;
    console.log(`✅ PASSED (${duration}ms): ${relativePath}`);

    return { file: relativePath, status: 'passed', duration, error: null };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (
      error.signal === 'SIGTERM' ||
      error.code === 'ETIMEDOUT' ||
      duration >= TEST_TIMEOUT - 100
    ) {
      console.log(`🚨 TIMEOUT (${duration}ms): ${relativePath}`);
      console.log('   ^ This test is hanging and causing CI issues');
      return { file: relativePath, status: 'timeout', duration, error: 'Test timed out after 30s' };
    } else {
      console.log(`❌ FAILED (${duration}ms): ${relativePath}`);
      const errorMsg = error.message ? error.message.split('\n')[0] : 'Unknown error';
      console.log(`Error: ${errorMsg}`);
      return { file: relativePath, status: 'failed', duration, error: errorMsg };
    }
  }
}

async function main() {
  console.log('🔍 Diagnosing hanging tests...\n');

  const testFiles = findTestFiles('src');
  console.log(`Found ${testFiles.length} test files\n`);

  const results = [];
  const startTime = Date.now();

  // Sort by likely problematic files first (based on patterns we found)
  const priorityPatterns = [
    /auth\.test\./,
    /messages\.test\./,
    /usePlayerMove\.test\./,
    /firebase.*test\./,
    /NavigationAndDefaults\.test\./,
  ];

  testFiles.sort((a, b) => {
    const aPriority = priorityPatterns.some((pattern) => pattern.test(a)) ? 0 : 1;
    const bPriority = priorityPatterns.some((pattern) => pattern.test(b)) ? 0 : 1;
    return aPriority - bPriority;
  });

  for (let i = 0; i < testFiles.length; i++) {
    const result = runSingleTest(testFiles[i], i, testFiles.length);
    results.push(result);

    // If we hit multiple timeouts, stop and report
    const timeouts = results.filter((r) => r.status === 'timeout');
    if (timeouts.length >= 3) {
      console.log('\n🚨 Multiple timeouts detected, stopping early...');
      break;
    }
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'passed');
  const failed = results.filter((r) => r.status === 'failed');
  const timeouts = results.filter((r) => r.status === 'timeout');

  console.log(`Total files tested: ${results.length}/${testFiles.length}`);
  console.log(`Total duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(`✅ Passed: ${passed.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`🚨 Timeouts: ${timeouts.length}`);

  if (timeouts.length > 0) {
    console.log('\n🚨 PROBLEMATIC FILES (TIMEOUTS):');
    timeouts.forEach((result) => {
      console.log(`  • ${result.file} (${result.duration}ms)`);
    });

    console.log('\n💡 RECOMMENDED CI EXCLUSIONS:');
    timeouts.forEach((result) => {
      console.log(`  --exclude "${result.file}"`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED FILES:');
    failed.forEach((result) => {
      console.log(`  • ${result.file}: ${result.error}`);
    });
  }

  // Find slowest tests
  const slowTests = results
    .filter((r) => r.status === 'passed')
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);

  if (slowTests.length > 0) {
    console.log('\n⏰ SLOWEST TESTS:');
    slowTests.forEach((result) => {
      console.log(`  • ${result.file} (${result.duration}ms)`);
    });
  }

  console.log('\n');

  if (timeouts.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
