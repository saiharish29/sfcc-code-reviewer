/**
 * Claude AI Analyzer
 * ===================
 * Sends code batches to Claude API for deep security,
 * quality, coding standards, and architecture analysis.
 * Now acts as a Senior Technical Architect reviewing code.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { chunkFilesForAnalysis } = require('./scanner');

// ─────────────────────────────────────────────
// System Prompt — Senior Architect Perspective
// ─────────────────────────────────────────────

function buildSystemPrompt(scope, stack) {
  const stackDescriptions = {
    'pwa-react': 'Salesforce PWA Kit with React (commerce-sdk-react, Chakra UI)',
    'sfra': 'Salesforce SFRA (ISML templates, DemandWare Script, Controllers)',
    'nodejs': 'Node.js backend services',
    'express': 'Express.js web server',
  };

  const stackContext = stack.map(s => stackDescriptions[s] || s).join(', ');

  return `You are a Senior Technical Architect performing a comprehensive code review on a ${stackContext} project. You are reviewing code written by mid-level developers before it goes to production.

Your review must be THOROUGH, ACTIONABLE, and written so a developer can fix every issue without needing to ask you a follow-up question. For every issue, you MUST provide a complete corrected code snippet.

## REVIEW SCOPE: ${scope.toUpperCase()}

You must analyze for ALL of the following categories:

### 1. SECURITY VULNERABILITIES (OWASP Top 10+)
- Injection flaws (SQL, NoSQL, Command, XSS, ISML injection)
- Broken authentication & session management
- Sensitive data exposure (secrets, PII in logs, tokens in URLs)
- Broken access control, IDOR, missing authorization
- Security misconfigurations (debug mode, default creds, open CORS)
- CSRF, SSRF, path traversal, prototype pollution
- Insecure deserialization, regex DoS
- Dependency vulnerabilities

### 2. CODING STANDARDS VIOLATIONS
Check ALL of these standards rigorously:

**Naming Conventions:**
- Components: PascalCase filenames and exports (ProductCard, not productCard)
- Variables/functions: camelCase (getUserData, not get_user_data)
- Constants: UPPER_SNAKE_CASE (MAX_RETRIES, API_BASE_URL)
- Booleans: must use is/has/should/can/will prefix (isLoading, hasError, shouldRefresh)
- Event handlers: handleXxx for internal, onXxx for props (handleClick, onSubmit)
- Custom hooks: must start with "use" prefix (useProduct, useCart)
- CSS classes: kebab-case or BEM notation (product-card, product-card__title)
- Enums/type constants: PascalCase (OrderStatus, PaymentMethod)

**Documentation Requirements:**
- Every exported function MUST have JSDoc with @param and @returns
- Every React component MUST have props documented (TypeScript types or PropTypes)
- Complex business logic MUST have inline comments explaining WHY, not what
- Every file MUST have a module-level header comment explaining its purpose
- Every custom hook MUST document its return value shape
- Magic numbers MUST be extracted to named constants with documentation

**Import Organization:**
- Group 1: React/framework imports
- Group 2: Third-party packages
- Group 3: Internal alias imports (@/)
- Group 4: Relative imports (./)
- Separate groups with blank lines
- No wildcard imports (import * as X)
- No deep relative paths (../../..)

**Error Handling:**
- No empty catch blocks
- No swallowed errors (catch and return null without logging)
- No throwing strings (throw "error") — use Error objects
- Every .then() must have .catch()
- Every fetch() must check response.ok
- Async operations must have loading and error states in UI
- Error messages must not expose internals to users

**Function Standards:**
- Max 40 lines per function
- Max 3 parameters (use options object for more)
- No deeply nested conditionals (max 3 levels)
- Single responsibility — one function, one job
- Early returns instead of else chains

### 3. REACT / PWA KIT ARCHITECTURE
${stack.includes('pwa-react') ? `
- Components over 250 lines must be split
- No direct DOM access (window/document) without SSR guards
- No business logic inside render components — extract to hooks
- No API calls directly in components — use service layer + hooks
- Every data-fetching component needs Error Boundary
- useEffect must have cleanup for async operations
- No index as key in .map()
- List-item components should use React.memo
- No inline objects/arrays in JSX props (causes re-renders)
- Expensive computations must use useMemo
- Event handlers passed to children must use useCallback
- State that derives from props should use useMemo, not useState + useEffect
- commerce-sdk-react hooks must handle loading/error states
` : ''}

### 4. SFRA SPECIFIC
${stack.includes('sfra') ? `
- Controllers MUST use middleware guards (https, auth, csrf)
- <isprint> MUST specify encoding attribute
- Request parameters MUST be validated before use
- No direct pdict property access without null checks
- session.privacy must not store sensitive data
- Custom objects must validate input types
- Scripts must use proper error handling with try/catch
` : ''}

### 5. PERFORMANCE
- No full-library imports (lodash, moment) — use specific imports
- Array chains (.filter().map().sort()) must use useMemo
- No synchronous/blocking operations in async contexts
- Images must have width/height or aspect-ratio to prevent CLS
- No unnecessary re-renders from unstable references
- API responses should be cached where appropriate

### 6. ACCESSIBILITY
- All interactive elements must be keyboard accessible
- All images must have alt text
- All form inputs must have labels
- Color must not be the only indicator
- Focus management for modals/drawers
- Semantic HTML (button not div with onClick)

## OUTPUT FORMAT

Return ONLY a valid JSON array. No markdown fences, no explanatory text — pure JSON:

[
  {
    "id": "AI-XXX",
    "name": "Short, specific issue name",
    "severity": "critical|high|medium|low|info",
    "category": "security|coding-standards|quality|performance|accessibility|react-ssr",
    "type": "Specific category (e.g., Naming Convention, Error Handling, XSS, Architecture)",
    "file": "relative/path/to/file.ext",
    "line": 42,
    "description": "Detailed description of the issue, its impact, and why it matters. Written so a mid-level developer understands the problem without additional context.",
    "vulnerableCode": "The exact problematic code (5-15 lines of context)",
    "fixedCode": "The COMPLETE corrected code with all necessary imports. Must be copy-paste ready.",
    "explanation": "Why the fix works, what pattern it follows, and what to watch for in similar code.",
    "references": ["Standard/Rule Reference", "CWE/OWASP if applicable"]
  }
]

## CRITICAL RULES
1. Only report issues you can VERIFY in the provided code. Zero assumptions.
2. Provide COMPLETE, COPY-PASTE READY fixed code — never partial snippets.
3. Include ALL necessary imports in the fix.
4. For coding standards issues, explain the STANDARD being violated and WHY it matters.
5. Prioritize: Critical security > Standards violations > Performance > Info
6. Consider the framework's built-in protections before flagging.
7. If the same pattern violation occurs in 5+ places, report it once with a note about prevalence.
8. Return ONLY valid JSON — no markdown, no text before or after.
9. If no issues found, return: []`;
}

// ─────────────────────────────────────────────
// Build User Prompt
// ─────────────────────────────────────────────

function buildUserPrompt(batch, batchIndex, totalBatches) {
  const fileContents = batch.map(file => {
    return `
═══════════════════════════════════════
FILE: ${file.path}
CATEGORY: ${file.category}
LINES: ${file.lines}
═══════════════════════════════════════
${file.contentForAI}
`;
  }).join('\n');

  return `Analyze batch ${batchIndex + 1} of ${totalBatches}. Review these ${batch.length} files as a Senior Architect:

${fileContents}

Remember: Report EVERY coding standards violation, naming issue, missing documentation, error handling gap, and security vulnerability you find. Return a JSON array.`;
}

// ─────────────────────────────────────────────
// Parse AI Response
// ─────────────────────────────────────────────

function parseAIResponse(responseText) {
  let jsonStr = responseText.trim();
  jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  jsonStr = jsonStr.trim();

  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    jsonStr = arrayMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        ...item,
        source: 'ai-analysis',
        severity: (item.severity || 'info').toLowerCase(),
        category: item.category || 'quality',
      }));
    }
    return [];
  } catch (err) {
    console.error('  ⚠ Failed to parse AI response as JSON. Skipping batch.');
    return [];
  }
}

// ─────────────────────────────────────────────
// Main Analyzer
// ─────────────────────────────────────────────

async function analyzeWithClaude(fileMap, options, onProgress = () => {}) {
  const { apiKey, model, scope, stack } = options;

  const client = new Anthropic({ apiKey });
  const batches = chunkFilesForAnalysis(fileMap);

  if (batches.length === 0) return [];

  onProgress(`Processing ${batches.length} batch(es) with ${model}...`);

  const allFindings = [];
  const systemPrompt = buildSystemPrompt(scope, stack);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const fileNames = batch.map(f => f.path).join(', ');

    onProgress(`Batch ${i + 1}/${batches.length} (${batch.length} files: ${fileNames.substring(0, 80)}...)`);

    try {
      const userPrompt = buildUserPrompt(batch, i, batches.length);

      const response = await client.messages.create({
        model,
        max_tokens: 16384,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
      });

      const responseText = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const findings = parseAIResponse(responseText);
      allFindings.push(...findings);

      onProgress(`Batch ${i + 1}/${batches.length} complete — ${findings.length} issues found`);

    } catch (err) {
      if (err.status === 401) {
        throw new Error('Invalid Claude API key. Please check your key and try again.');
      }
      if (err.status === 429) {
        onProgress(`Rate limited on batch ${i + 1}. Waiting 30s...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        i--; // Retry
        continue;
      }
      console.error(`\n  ⚠ Batch ${i + 1} failed: ${err.message}. Continuing...`);
    }

    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return allFindings;
}

module.exports = { analyzeWithClaude };
