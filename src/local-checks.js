/**
 * Local Security & Quality Checks
 * =================================
 * Regex-based pattern matching for common vulnerabilities
 * and code quality issues. Runs WITHOUT any API call.
 * This catches low-hanging fruit before the AI analysis.
 */

// ─────────────────────────────────────────────
// Security Patterns
// ─────────────────────────────────────────────
const SECURITY_PATTERNS = [
  // ── Hardcoded Secrets ──
  {
    id: 'SEC-001',
    name: 'Hardcoded API Key / Secret',
    severity: 'critical',
    category: 'security',
    type: 'Sensitive Data Exposure',
    pattern: /(?:api[_-]?key|api[_-]?secret|auth[_-]?token|access[_-]?token|secret[_-]?key|private[_-]?key|client[_-]?secret)\s*[:=]\s*['"`](?!process\.env|<|{|\$\{)[A-Za-z0-9+/=_\-]{8,}/gi,
    description: 'Potential hardcoded API key or secret found. Secrets should be stored in environment variables or a secrets manager.',
    fix: 'Move the secret to an environment variable and access via process.env.YOUR_SECRET_NAME',
    references: ['CWE-798: Use of Hard-coded Credentials', 'OWASP: Sensitive Data Exposure'],
    fileTypes: ['all'],
  },
  {
    id: 'SEC-002',
    name: 'Hardcoded Password',
    severity: 'critical',
    category: 'security',
    type: 'Sensitive Data Exposure',
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"`](?!process\.env|<|{|\$\{).{3,}/gi,
    description: 'Hardcoded password detected. Never store passwords in source code.',
    fix: 'Use environment variables or a secrets manager for password storage.',
    references: ['CWE-259: Use of Hard-coded Password'],
    fileTypes: ['all'],
    excludeFilePatterns: [/package\.json$/, /package-lock\.json$/, /\.md$/],
  },
  // ── Injection Flaws ──
  {
    id: 'SEC-003',
    name: 'Potential SQL Injection',
    severity: 'critical',
    category: 'security',
    type: 'SQL Injection',
    pattern: /(?:query|execute|exec)\s*\(\s*(?:`[^`]*\$\{|['"][^'"]*['"]\s*\+\s*(?:req\.|params\.|query\.|body\.|input|user))/gi,
    description: 'String concatenation or template literals used in database queries with user input. This may be vulnerable to SQL injection.',
    fix: 'Use parameterized queries or prepared statements instead of string concatenation.',
    references: ['CWE-89: SQL Injection', 'OWASP: SQL Injection Prevention Cheat Sheet'],
    fileTypes: ['javascript', 'typescript'],
  },
  {
    id: 'SEC-004',
    name: 'Command Injection Risk',
    severity: 'critical',
    category: 'security',
    type: 'Command Injection',
    pattern: /(?:exec|execSync|spawn|spawnSync|execFile)\s*\([^)]*(?:\$\{|req\.|params\.|query\.|body\.|input|user)/gi,
    description: 'User input may be passed to a system command execution function. This can lead to command injection.',
    fix: 'Validate and sanitize all inputs. Use execFile() with arguments array instead of exec() with string concatenation.',
    references: ['CWE-78: OS Command Injection'],
    fileTypes: ['javascript', 'typescript'],
  },
  // ── XSS ──
  {
    id: 'SEC-005',
    name: 'dangerouslySetInnerHTML Usage',
    severity: 'high',
    category: 'security',
    type: 'Cross-Site Scripting (XSS)',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g,
    description: 'dangerouslySetInnerHTML renders raw HTML and bypasses React XSS protections. Ensure the HTML is sanitized.',
    fix: 'If you must use dangerouslySetInnerHTML, sanitize input with DOMPurify: { __html: DOMPurify.sanitize(htmlContent) }',
    references: ['CWE-79: Cross-site Scripting', 'OWASP: XSS Prevention Cheat Sheet'],
    fileTypes: ['react-component', 'javascript', 'typescript'],
  },
  {
    id: 'SEC-006',
    name: 'Unsanitized innerHTML',
    severity: 'high',
    category: 'security',
    type: 'Cross-Site Scripting (XSS)',
    pattern: /\.innerHTML\s*=\s*(?!['"`]\s*$)/g,
    description: 'Direct innerHTML assignment can lead to XSS if the content includes user-controlled data.',
    fix: 'Use textContent for plain text, or sanitize HTML with DOMPurify before assigning to innerHTML.',
    references: ['CWE-79: Cross-site Scripting'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  // ── ISML / SFRA Specific ──
  {
    id: 'SEC-007',
    name: 'ISML Unescaped Output',
    severity: 'high',
    category: 'security',
    type: 'ISML Injection / XSS',
    pattern: /\$\{[^}]+\}(?!.*\bencodeForHTML\b)/g,
    description: 'ISML template expression without explicit HTML encoding. This may lead to XSS.',
    fix: 'Use StringUtils.encodeForHTML() or <isprint> with encoding="htmlcontent" to escape output.',
    references: ['CWE-79: Cross-site Scripting', 'SFCC: ISML Security Best Practices'],
    fileTypes: ['isml-template'],
  },
  {
    id: 'SEC-008',
    name: 'ISML Script Injection Risk',
    severity: 'high',
    category: 'security',
    type: 'ISML Injection',
    pattern: /<isscript>[^<]*(?:request\.httpParameterMap|request\.getHttpParameters)/g,
    description: 'Direct use of request parameters in ISML <isscript> blocks without sanitization.',
    fix: 'Always validate and sanitize request parameters before use in ISML scripts.',
    references: ['CWE-94: Code Injection'],
    fileTypes: ['isml-template'],
  },
  // ── Authentication / Session ──
  {
    id: 'SEC-009',
    name: 'JWT Secret Hardcoded',
    severity: 'critical',
    category: 'security',
    type: 'Broken Authentication',
    pattern: /jwt\.sign\([^)]*,\s*['"`][^'"` ]{5,}['"`]/g,
    description: 'JWT signing with a hardcoded secret. The secret should be stored in environment variables.',
    fix: 'Use process.env.JWT_SECRET instead of hardcoding the secret.',
    references: ['CWE-798: Use of Hard-coded Credentials'],
    fileTypes: ['javascript', 'typescript'],
  },
  {
    id: 'SEC-010',
    name: 'Missing CSRF Protection',
    severity: 'medium',
    category: 'security',
    type: 'CSRF',
    pattern: /app\.(?:post|put|delete|patch)\s*\(\s*['"`][^'"`,]*['"`]\s*,\s*(?!.*csrf)/gi,
    description: 'POST/PUT/DELETE route handler without apparent CSRF protection.',
    fix: 'Use a CSRF middleware like csurf or implement token-based CSRF protection.',
    references: ['CWE-352: Cross-Site Request Forgery', 'OWASP: CSRF Prevention Cheat Sheet'],
    fileTypes: ['javascript', 'typescript'],
  },
  // ── Path Traversal ──
  {
    id: 'SEC-011',
    name: 'Path Traversal Risk',
    severity: 'high',
    category: 'security',
    type: 'Path Traversal',
    pattern: /(?:readFile|readFileSync|createReadStream|writeFile|writeFileSync)\s*\([^)]*(?:req\.|params\.|query\.|body\.|input)/gi,
    description: 'File system operation using user-controlled input. May be vulnerable to path traversal attacks.',
    fix: 'Validate and sanitize file paths. Use path.resolve() and verify the resolved path is within allowed directories.',
    references: ['CWE-22: Path Traversal'],
    fileTypes: ['javascript', 'typescript'],
  },
  // ── Prototype Pollution ──
  {
    id: 'SEC-012',
    name: 'Potential Prototype Pollution',
    severity: 'medium',
    category: 'security',
    type: 'Prototype Pollution',
    pattern: /(?:Object\.assign|_.merge|_.extend|_.defaultsDeep|deepmerge)\s*\([^)]*(?:req\.|params\.|query\.|body\.|input|user)/gi,
    description: 'Deep merge or Object.assign with user-controlled input may lead to prototype pollution.',
    fix: 'Validate object keys before merging. Use a safe merge library or Object.create(null) for clean objects.',
    references: ['CWE-1321: Prototype Pollution'],
    fileTypes: ['javascript', 'typescript'],
  },
  // ── Insecure Randomness ──
  {
    id: 'SEC-013',
    name: 'Insecure Randomness',
    severity: 'medium',
    category: 'security',
    type: 'Insecure Randomness',
    pattern: /Math\.random\s*\(\s*\)/g,
    description: 'Math.random() is not cryptographically secure. Do not use for tokens, passwords, or security-sensitive operations.',
    fix: 'Use crypto.randomBytes() or crypto.randomUUID() for security-sensitive random values.',
    references: ['CWE-338: Use of Cryptographically Weak PRNG'],
    fileTypes: ['javascript', 'typescript'],
    contextCheck: (line) => /(?:token|secret|password|session|auth|csrf|nonce|salt|key|hash)/i.test(line),
  },
  // ── eval() usage ──
  {
    id: 'SEC-014',
    name: 'Use of eval()',
    severity: 'high',
    category: 'security',
    type: 'Code Injection',
    pattern: /\beval\s*\(/g,
    description: 'eval() executes arbitrary code and is a major security risk, especially with user-controlled input.',
    fix: 'Replace eval() with JSON.parse() for JSON data, or use safer alternatives like Function constructors with validation.',
    references: ['CWE-95: Eval Injection'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  // ── Debug / Console in Production ──
  {
    id: 'SEC-015',
    name: 'Console Logging in Production Code',
    severity: 'low',
    category: 'security',
    type: 'Information Disclosure',
    pattern: /console\.(log|debug|info|warn|error)\s*\(/g,
    description: 'Console logging statements found. These may leak sensitive information in production.',
    fix: 'Use a proper logging library with log levels. Remove or conditionally disable console.log in production.',
    references: ['CWE-532: Information Exposure Through Log Files'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
    excludeFilePatterns: [/\.config\./, /webpack/, /babel/, /jest/, /test/],
  },
  // ── Disabled Security ──
  {
    id: 'SEC-016',
    name: 'TLS Certificate Validation Disabled',
    severity: 'critical',
    category: 'security',
    type: 'Security Misconfiguration',
    pattern: /(?:rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"`]0['"`])/g,
    description: 'TLS certificate validation is disabled. This makes the application vulnerable to man-in-the-middle attacks.',
    fix: 'Remove rejectUnauthorized: false. Use proper CA certificates instead.',
    references: ['CWE-295: Improper Certificate Validation'],
    fileTypes: ['all'],
  },
  // ── CORS Misconfiguration ──
  {
    id: 'SEC-017',
    name: 'CORS Wildcard Origin',
    severity: 'medium',
    category: 'security',
    type: 'Security Misconfiguration',
    pattern: /(?:Access-Control-Allow-Origin|origin)\s*[:=]\s*['"`]\s*\*\s*['"`]/g,
    description: 'CORS is configured to allow all origins (*). This may expose the API to unauthorized cross-origin requests.',
    fix: 'Restrict CORS to specific trusted origins instead of using wildcard.',
    references: ['CWE-942: Overly Permissive CORS Policy'],
    fileTypes: ['javascript', 'typescript'],
  },
];

// ─────────────────────────────────────────────
// Code Quality Patterns
// ─────────────────────────────────────────────
const QUALITY_PATTERNS = [
  {
    id: 'QA-001',
    name: 'TODO/FIXME/HACK Comment',
    severity: 'info',
    category: 'quality',
    type: 'Code Smell',
    pattern: /\/\/\s*(?:TODO|FIXME|HACK|XXX|TEMP|WORKAROUND)\b[^\n]*/gi,
    description: 'Found a TODO/FIXME comment that indicates incomplete or temporary code.',
    fix: 'Address the TODO item or create a ticket to track it.',
    fileTypes: ['all'],
  },
  {
    id: 'QA-002',
    name: 'Empty Catch Block',
    severity: 'medium',
    category: 'quality',
    type: 'Error Handling',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    description: 'Empty catch block silently swallows errors. This makes debugging very difficult.',
    fix: 'At minimum, log the error. Better: handle the error appropriately or re-throw.',
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'QA-003',
    name: 'var Instead of let/const',
    severity: 'low',
    category: 'quality',
    type: 'Code Smell',
    pattern: /\bvar\s+\w+/g,
    description: 'Using var instead of let/const. var has function scoping which can lead to bugs.',
    fix: 'Replace var with const (preferred) or let. Use const by default, let only when reassignment is needed.',
    fileTypes: ['javascript', 'react-component'],
  },
  {
    id: 'QA-004',
    name: 'Deeply Nested Code (4+ levels)',
    severity: 'medium',
    category: 'quality',
    type: 'Maintainability',
    pattern: /^(?:\s{16,}|\t{4,})(?:if|for|while|switch|try)\b/gm,
    description: 'Code is deeply nested (4+ levels). This indicates high complexity and poor readability.',
    fix: 'Refactor using early returns, guard clauses, or extract nested logic into separate functions.',
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'QA-005',
    name: 'Magic Numbers',
    severity: 'low',
    category: 'quality',
    type: 'Maintainability',
    pattern: /(?:===?\s*|!==?\s*|>\s*|<\s*|>=\s*|<=\s*|return\s+)(?:(?!0\b|1\b|-1\b|2\b|100\b|200\b|201\b|204\b|301\b|302\b|400\b|401\b|403\b|404\b|500\b)\d{3,})/g,
    description: 'Magic number found in code. Use named constants for better readability.',
    fix: 'Extract the number into a named constant (e.g., const MAX_RETRY_ATTEMPTS = 3).',
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'QA-006',
    name: 'Async Function Without Await',
    severity: 'medium',
    category: 'quality',
    type: 'Code Smell',
    pattern: /async\s+(?:function\s+\w+|\w+\s*=\s*async)\s*\([^)]*\)\s*\{[^}]*(?!await)[^}]*\}/gs,
    description: 'Async function that may not use await. This creates unnecessary promise wrapping.',
    fix: 'Remove async keyword if no await is needed, or add proper await for async operations.',
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  // ── React Specific ──
  {
    id: 'QA-007',
    name: 'React useEffect Missing Dependencies',
    severity: 'medium',
    category: 'quality',
    type: 'React Bug',
    pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*,\s*\[\s*\]\s*\)/gs,
    description: 'useEffect with empty dependency array but the callback may reference variables from outer scope. Verify dependencies are correct.',
    fix: 'Add all referenced variables to the dependency array, or use ESLint react-hooks/exhaustive-deps rule.',
    fileTypes: ['react-component'],
  },
  {
    id: 'QA-008',
    name: 'Inline Object/Array in JSX Props',
    severity: 'low',
    category: 'quality',
    type: 'Performance',
    pattern: /(?:style|className|data)\s*=\s*\{\s*(?:\{[^}]+\}|\[[^\]]+\])\s*\}/g,
    description: 'Inline objects/arrays in JSX props create new references on every render, causing unnecessary re-renders.',
    fix: 'Move object/array declarations outside the component or use useMemo/useCallback.',
    fileTypes: ['react-component'],
  },
];

// ─────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────

function shouldCheckFile(file, rule) {
  // Check file type match
  if (!rule.fileTypes.includes('all') && !rule.fileTypes.includes(file.category)) {
    return false;
  }
  // Check exclude patterns
  if (rule.excludeFilePatterns) {
    for (const excludePattern of rule.excludeFilePatterns) {
      if (excludePattern.test(file.path)) return false;
    }
  }
  return true;
}

function runLocalChecks(fileMap, stack = []) {
  const findings = [];
  const allPatterns = [...SECURITY_PATTERNS, ...QUALITY_PATTERNS];

  for (const file of fileMap.files) {
    for (const rule of allPatterns) {
      if (!shouldCheckFile(file, rule)) continue;

      // Reset regex lastIndex
      rule.pattern.lastIndex = 0;

      const lines = file.content.split('\n');
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        rule.pattern.lastIndex = 0;
        const match = rule.pattern.exec(line);

        if (match) {
          // Optional context check (e.g., only flag Math.random near security keywords)
          if (rule.contextCheck && !rule.contextCheck(line)) continue;

          // Get surrounding context (3 lines before and after)
          const startLine = Math.max(0, lineNum - 3);
          const endLine = Math.min(lines.length - 1, lineNum + 3);
          const contextLines = lines.slice(startLine, endLine + 1);
          const codeSnippet = contextLines.map((l, i) => {
            const num = startLine + i + 1;
            const marker = (startLine + i === lineNum) ? ' >' : '  ';
            return `${marker} ${num} | ${l}`;
          }).join('\n');

          findings.push({
            id: rule.id,
            name: rule.name,
            severity: rule.severity,
            category: rule.category,
            type: rule.type,
            file: file.path,
            line: lineNum + 1,
            column: match.index + 1,
            match: match[0].substring(0, 100), // Truncate long matches
            codeSnippet,
            description: rule.description,
            fix: rule.fix,
            references: rule.references || [],
            source: 'local-scan',
          });
        }
      }
    }
  }

  // Deduplicate findings at the same location
  const seen = new Set();
  const deduped = findings.filter(f => {
    const key = `${f.id}:${f.file}:${f.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped;
}

module.exports = { runLocalChecks, SECURITY_PATTERNS, QUALITY_PATTERNS };
