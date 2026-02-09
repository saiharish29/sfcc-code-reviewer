# 🔍 SFCC/PWA Code Review & Security Analyzer

AI-powered code review CLI tool for **Salesforce Commerce Cloud**, **PWA Kit (React)**, **SFRA**, and **Node.js** projects.

Built by **ETG Digital**.

---

## Features

| Feature | Description |
|---------|-------------|
| 🔒 **Security Scanning** | OWASP Top 10, hardcoded secrets, injection flaws, XSS, CSRF |
| 🧹 **Code Quality** | Code smells, error handling, async issues, naming conventions |
| ⚡ **Performance** | Re-render issues, bundle concerns, API optimizations |
| ⚛️ **React/SSR** | Hydration mismatches, useEffect issues, state management |
| 📄 **ISML/SFRA** | Template injection, controller security, encoding issues |
| 📊 **HTML Report** | Self-contained, printable, filterable report |

## How It Works

1. **Local Scan** — Regex-based pattern matching catches common vulnerabilities (no API needed)
2. **AI Analysis** — Claude API performs deep contextual analysis of your code
3. **HTML Report** — Beautiful, self-contained report generated in your repo

---

## Quick Start

### Prerequisites

- **Node.js** 18+ installed
- A **Claude API key** from [console.anthropic.com](https://console.anthropic.com)

### Setup (One Time)

```bash
# Clone or copy this tool to your machine
git clone <this-repo-url> sfcc-code-reviewer
cd sfcc-code-reviewer

# Install dependencies
npm install
```

### Run a Review

```bash
node index.js
```

The tool will prompt you for:

| Prompt | Description |
|--------|-------------|
| 🔑 **Claude API Key** | Your key (never stored, used only at runtime) |
| 📁 **Repository Path** | Path to the code you want to review |
| 🌿 **Branch** | Git branch to analyze (optional) |
| 🎯 **Scope** | Full, Security-only, Performance, or All |
| 🛠️ **Stack** | PWA Kit, SFRA, Node.js, Express |
| 📄 **File Patterns** | Optional filter (e.g., `**/*.jsx`) |
| 🚫 **Exclude Paths** | Directories to skip |
| 🤖 **Model** | Claude Sonnet 4 (recommended) or Opus 4 |

### View Report

After the review completes, open the generated HTML file:

```bash
# The report is saved in your repo:
open <your-repo>/code-review-reports/code-review-2025-02-09T08-30-00.html
```

---

## Security: API Key Handling

**Your API key is NEVER stored anywhere.**

- Prompted fresh every time you run the tool
- Used only in memory during the review
- Not written to any file, log, or config
- Not included in the generated report

Each developer on the team needs their own Claude API key from [console.anthropic.com](https://console.anthropic.com).

---

## What Gets Scanned

### Security Checks (Local — No API)
- Hardcoded API keys, passwords, secrets
- SQL/Command injection patterns
- XSS via `dangerouslySetInnerHTML` and `innerHTML`
- ISML unescaped output
- JWT secret exposure
- Missing CSRF protection
- Path traversal risks
- Prototype pollution
- `eval()` usage
- Disabled TLS validation
- CORS wildcard origins

### AI-Powered Deep Analysis
- Context-aware vulnerability detection
- Business logic flaws
- Authentication/authorization gaps
- Framework-specific anti-patterns
- Cross-file security patterns
- Detailed fix suggestions with complete code

---

## Report Sections

The HTML report includes:

1. **Executive Summary** — Total issues, risk score, top 5 priority fixes
2. **Security Vulnerabilities** — With severity badges, code snippets, and fixes
3. **Code Quality Issues** — Refactoring suggestions with before/after code
4. **Performance Recommendations** — Render optimization, API calls, caching
5. **React/SSR Hydration Issues** — Server vs client mismatches
6. **Issues by File** — Visual breakdown of which files need attention
7. **Priority Matrix** — Ordered table of all fixes by impact
8. **Pre-Deployment Checklist** — Interactive checklist

---

## Recommended Workflow

```
1. Developer creates a feature branch
2. Developer runs: node index.js
3. Reviews the HTML report
4. Fixes critical and high issues
5. Runs the tool again to verify
6. Creates PR with clean report attached
```

---

## Customization

### Focus on Specific Files

When prompted for file patterns, enter comma-separated globs:
```
**/*.jsx, src/components/**/*.js
```

### Skip Directories

Default excludes: `node_modules, dist, build, .git, coverage, __tests__, test`

Add more when prompted (comma-separated).

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Invalid Claude API key` | Check your key at console.anthropic.com |
| `Rate limited` | The tool auto-retries after 30s. Or use Haiku model for lower limits |
| `Scan found 0 files` | Check your repo path and file patterns |
| `AI analysis failed` | Report still generates with local findings only |

---

## Cost Estimate

Using Claude Sonnet 4 (recommended):
- Small project (50 files): ~$0.10-0.30
- Medium project (200 files): ~$0.50-1.50
- Large project (500+ files): ~$2.00-5.00

Use Claude Haiku 3.5 for budget-conscious reviews (~10x cheaper).

---

## License

MIT — ETG Digital
