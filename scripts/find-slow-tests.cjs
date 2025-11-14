#!/usr/bin/env node
/* eslint-env node */
/* global require, process, module */
/**
 * Script to identify slow-running tests
 * Usage: node scripts/find-slow-tests.js
 */

const { spawn } = require('child_process');

// Run vitest with JSON reporter to get detailed test results
const runTests = () => {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['test', '--', '--reporter=json'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the JSON output - vitest outputs JSON on the last line
          const lines = stdout.trim().split('\n');
          const jsonLine = lines[lines.length - 1];
          const results = JSON.parse(jsonLine);
          resolve(results);
        } catch (err) {
          reject(new Error(`Failed to parse test results: ${err.message}`));
        }
      } else {
        reject(new Error(`Tests failed with code ${code}. Error: ${stderr}`));
      }
    });
  });
};

// Analyze test results and identify slow tests
const analyzeResults = (results) => {
  const slowTests = [];
  const SLOW_THRESHOLD = 1000; // 1 second

  const analyzeTestFile = (testFile) => {
    if (testFile.tasks) {
      testFile.tasks.forEach((task) => {
        if (task.result && task.result.duration > SLOW_THRESHOLD) {
          slowTests.push({
            file: testFile.name,
            test: task.name,
            duration: task.result.duration,
            status: task.result.state,
          });
        }

        // Check nested tasks (describe blocks)
        if (task.tasks) {
          task.tasks.forEach((subtask) => {
            if (subtask.result && subtask.result.duration > SLOW_THRESHOLD) {
              slowTests.push({
                file: testFile.name,
                test: `${task.name} > ${subtask.name}`,
                duration: subtask.result.duration,
                status: subtask.result.state,
              });
            }
          });
        }
      });
    }
  };

  if (results.testResults) {
    results.testResults.forEach(analyzeTestFile);
  }

  return slowTests;
};

// Generate recommendations for slow tests
const generateRecommendations = (slowTests) => {
  const recommendations = [];

  slowTests.forEach((test) => {
    let recommendation = `${test.file} - "${test.test}" (${test.duration}ms)`;

    if (test.duration > 5000) {
      recommendation += ' - CRITICAL: Over 5 seconds, consider removing or major refactor';
    } else if (test.duration > 3000) {
      recommendation += ' - HIGH: Over 3 seconds, needs optimization';
    } else if (test.duration > 2000) {
      recommendation += ' - MEDIUM: Over 2 seconds, could be optimized';
    } else {
      recommendation += ' - LOW: Over 1 second, minor optimization needed';
    }

    recommendations.push(recommendation);
  });

  return recommendations;
};

// Main function
const main = async () => {
  console.info('🔍 Analyzing test performance...\n');

  try {
    console.info('Running tests with performance monitoring...');
    const results = await runTests();

    console.info('📊 Analyzing results...');
    const slowTests = analyzeResults(results);

    if (slowTests.length === 0) {
      console.info('✅ Great! No tests over 1 second found.');
      return;
    }

    console.info(`\n⚠️  Found ${slowTests.length} slow tests:\n`);

    // Sort by duration (slowest first)
    slowTests.sort((a, b) => b.duration - a.duration);

    const recommendations = generateRecommendations(slowTests);
    recommendations.forEach((rec) => console.info(`  ${rec}`));

    console.info('\n💡 Recommendations:');
    console.info('  • Tests over 5s: Remove or completely rewrite');
    console.info('  • Tests over 3s: Major refactoring needed');
    console.info('  • Tests over 2s: Optimize async operations');
    console.info('  • Tests over 1s: Remove unnecessary waits, use fake timers');

    console.info('\n🛠️  Common optimizations:');
    console.info('  • Use vi.useFakeTimers() instead of real delays');
    console.info('  • Mock heavy operations');
    console.info('  • Reduce waitFor timeouts');
    console.info('  • Use vi.advanceTimersByTime() for timer-based tests');
    console.info('  • Replace setTimeout with immediate callbacks in mocks');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { runTests, analyzeResults, generateRecommendations };
