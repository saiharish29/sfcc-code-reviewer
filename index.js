#!/usr/bin/env node

/**
 * SFCC/PWA Code Review & Security Analysis CLI
 * ==============================================
 * AI-powered code review tool for Salesforce Commerce Cloud,
 * PWA Kit (React), SFRA, and Node.js projects.
 *
 * Usage: node index.js
 * The tool will prompt for all required inputs including the Claude API key.
 *
 * Author: ETG Digital
 * Version: 1.0.0
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const { scanRepository } = require('./src/scanner');
const { analyzeWithClaude } = require('./src/analyzer');
const { generateHTMLReport } = require('./src/report-generator');
const { runLocalChecks } = require('./src/local-checks');
const { runCodingStandardsChecks } = require('./src/coding-standards');

// ─────────────────────────────────────────────
// Banner
// ─────────────────────────────────────────────
function showBanner() {
  console.log(chalk.cyan.bold(`
  ╔══════════════════════════════════════════════════════╗
  ║                                                      ║
  ║   🔍  SFCC/PWA Code Review & Security Analyzer       ║
  ║       AI-Powered  •  OWASP Top 10  •  Full Stack     ║
  ║                                                      ║
  ║   Supports: PWA Kit · SFRA · Node.js · React         ║
  ║   Version: 1.0.0                ETG Digital           ║
  ║                                                      ║
  ╚══════════════════════════════════════════════════════╝
  `));
}

// ─────────────────────────────────────────────
// Input Collection
// ─────────────────────────────────────────────
async function collectInputs() {
  const questions = [
    {
      type: 'password',
      name: 'apiKey',
      message: chalk.yellow('🔑 Enter your Claude API Key:'),
      mask: '*',
      validate: (input) => {
        if (!input || input.trim().length < 10) {
          return 'Please enter a valid Claude API key (starts with sk-ant-...)';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'repoPath',
      message: chalk.yellow('📁 Repository path (absolute or relative):'),
      default: '.',
      validate: (input) => {
        const resolved = path.resolve(input);
        if (!fs.existsSync(resolved)) {
          return `Path does not exist: ${resolved}`;
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'branch',
      message: chalk.yellow('🌿 Branch name (leave empty for current branch):'),
      default: '',
    },
    {
      type: 'list',
      name: 'scope',
      message: chalk.yellow('🎯 Review scope:'),
      choices: [
        { name: 'Full Review (Security + Quality + Performance)', value: 'full' },
        { name: 'Security Only (OWASP Top 10 + Vulnerabilities)', value: 'security-only' },
        { name: 'Performance Only (Bundle, Rendering, API)', value: 'performance' },
        { name: 'Accessibility Review', value: 'accessibility' },
        { name: 'All (Comprehensive - Takes Longer)', value: 'all' },
      ]
    },
    {
      type: 'checkbox',
      name: 'stack',
      message: chalk.yellow('🛠️  Framework/Stack (select all that apply):'),
      choices: [
        { name: 'PWA Kit (React)', value: 'pwa-react', checked: true },
        { name: 'SFRA (ISML/Controllers)', value: 'sfra' },
        { name: 'Node.js Backend', value: 'nodejs' },
        { name: 'Express.js', value: 'express' },
      ],
      validate: (input) => input.length > 0 ? true : 'Select at least one stack'
    },
    {
      type: 'input',
      name: 'filePatterns',
      message: chalk.yellow('📄 File patterns to focus on (comma-separated, leave empty for all):'),
      default: '',
    },
    {
      type: 'input',
      name: 'excludePaths',
      message: chalk.yellow('🚫 Paths to exclude (comma-separated):'),
      default: 'node_modules,dist,build,.git,coverage,__tests__,test',
    },
    {
      type: 'list',
      name: 'model',
      message: chalk.yellow('🤖 Claude model to use:'),
      choices: [
        { name: 'Claude Sonnet 4 (Recommended - Fast & Capable)', value: 'claude-sonnet-4-20250514' },
        { name: 'Claude Opus 4 (Most Thorough - Slower)', value: 'claude-opus-4-20250514' },
        { name: 'Claude Haiku 3.5 (Fastest - Budget)', value: 'claude-haiku-4-5-20251001' },
      ]
    },
  ];

  return inquirer.prompt(questions);
}

// ─────────────────────────────────────────────
// Branch Checkout
// ─────────────────────────────────────────────
function checkoutBranch(repoPath, branch) {
  if (!branch) return;
  const spinner = ora(`Checking out branch: ${branch}`).start();
  try {
    execSync(`cd "${repoPath}" && git checkout ${branch}`, { stdio: 'pipe' });
    spinner.succeed(`On branch: ${branch}`);
  } catch (err) {
    spinner.warn(`Could not checkout branch "${branch}". Continuing on current branch.`);
  }
}

// ─────────────────────────────────────────────
// Main Execution
// ─────────────────────────────────────────────
async function main() {
  showBanner();

  // Collect all inputs
  const inputs = await collectInputs();
  const repoPath = path.resolve(inputs.repoPath);

  console.log(chalk.gray('\n─────────────────────────────────────────────'));
  console.log(chalk.white.bold('  Review Configuration'));
  console.log(chalk.gray('─────────────────────────────────────────────'));
  console.log(chalk.white(`  Repository : ${repoPath}`));
  console.log(chalk.white(`  Branch     : ${inputs.branch || '(current)'}`));
  console.log(chalk.white(`  Scope      : ${inputs.scope}`));
  console.log(chalk.white(`  Stack      : ${inputs.stack.join(', ')}`));
  console.log(chalk.white(`  Model      : ${inputs.model}`));
  console.log(chalk.gray('─────────────────────────────────────────────\n'));

  // Checkout branch if specified
  checkoutBranch(repoPath, inputs.branch);

  // ── Step 1: Scan Repository ──
  const scanSpinner = ora('Step 1/5 — Scanning repository structure...').start();
  let fileMap;
  try {
    fileMap = await scanRepository(repoPath, {
      filePatterns: inputs.filePatterns ? inputs.filePatterns.split(',').map(p => p.trim()) : [],
      excludePaths: inputs.excludePaths.split(',').map(p => p.trim()),
      stack: inputs.stack,
    });
    scanSpinner.succeed(`Scanned ${fileMap.totalFiles} files (${fileMap.totalLines} lines) across ${fileMap.categories.length} categories`);
  } catch (err) {
    scanSpinner.fail('Failed to scan repository');
    console.error(chalk.red(err.message));
    process.exit(1);
  }

  // ── Step 2: Run Local Checks (No API needed) ──
  const localSpinner = ora('Step 2/5 — Running local security & quality checks...').start();
  let localFindings;
  try {
    localFindings = runLocalChecks(fileMap, inputs.stack);
    localSpinner.succeed(`Local checks complete — ${localFindings.length} issues found without API`);
  } catch (err) {
    localSpinner.fail('Local checks encountered errors');
    console.error(chalk.red(err.message));
    localFindings = [];
  }

  // ── Step 3: Run Coding Standards Checks (No API needed) ──
  const stdSpinner = ora('Step 3/5 — Enforcing coding standards (naming, docs, architecture)...').start();
  let standardsFindings;
  try {
    standardsFindings = runCodingStandardsChecks(fileMap, inputs.stack);
    stdSpinner.succeed(`Standards checks complete — ${standardsFindings.length} violations found`);
  } catch (err) {
    stdSpinner.fail('Standards checks encountered errors');
    console.error(chalk.red(err.message));
    standardsFindings = [];
  }

  // ── Step 4: AI-Powered Deep Analysis ──
  const aiSpinner = ora('Step 4/5 — AI-powered deep analysis (this may take a few minutes)...').start();
  let aiFindings;
  try {
    aiFindings = await analyzeWithClaude(fileMap, {
      apiKey: inputs.apiKey,
      model: inputs.model,
      scope: inputs.scope,
      stack: inputs.stack,
    }, (progress) => {
      aiSpinner.text = `Step 4/5 — AI analysis: ${progress}`;
    });
    aiSpinner.succeed(`AI analysis complete — ${aiFindings.length} additional issues identified`);
  } catch (err) {
    aiSpinner.fail('AI analysis failed');
    console.error(chalk.red(`Error: ${err.message}`));
    console.log(chalk.yellow('Generating report with local findings only...\n'));
    aiFindings = [];
  }

  // ── Step 5: Generate Report ──
  const reportSpinner = ora('Step 5/5 — Generating HTML report...').start();
  try {
    const allFindings = [...localFindings, ...standardsFindings, ...aiFindings];
    const reportPath = generateHTMLReport(allFindings, {
      repoPath,
      branch: inputs.branch,
      scope: inputs.scope,
      stack: inputs.stack,
      fileMap,
      model: inputs.model,
    });
    reportSpinner.succeed(`Report generated!`);

    console.log(chalk.gray('\n═══════════════════════════════════════════════'));
    console.log(chalk.green.bold('  ✅ Review Complete!'));
    console.log(chalk.gray('═══════════════════════════════════════════════'));
    console.log(chalk.white(`\n  📊 Total Issues: ${chalk.bold(allFindings.length)}`));

    const critical = allFindings.filter(f => f.severity === 'critical').length;
    const high = allFindings.filter(f => f.severity === 'high').length;
    const medium = allFindings.filter(f => f.severity === 'medium').length;
    const low = allFindings.filter(f => f.severity === 'low').length;
    const info = allFindings.filter(f => f.severity === 'info').length;

    if (critical > 0) console.log(chalk.red(`     🔴 Critical: ${critical}`));
    if (high > 0) console.log(chalk.redBright(`     🟠 High: ${high}`));
    if (medium > 0) console.log(chalk.yellow(`     🟡 Medium: ${medium}`));
    if (low > 0) console.log(chalk.blue(`     🔵 Low: ${low}`));
    if (info > 0) console.log(chalk.gray(`     ⚪ Info: ${info}`));

    console.log(chalk.cyan(`\n  📄 Report: ${reportPath}`));
    console.log(chalk.gray('  Open the HTML file in your browser to view the full report.\n'));

  } catch (err) {
    reportSpinner.fail('Failed to generate report');
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}

// Run
main().catch((err) => {
  console.error(chalk.red('\nFatal error:'), err.message);
  process.exit(1);
});
