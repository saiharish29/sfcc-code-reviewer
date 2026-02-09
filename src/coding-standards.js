/**
 * Coding Standards Enforcement
 * ==============================
 * Comprehensive checks that enforce team coding standards
 * from an architect's perspective. These are the rules
 * every developer must follow before a PR is approved.
 *
 * Categories:
 *   STD-NM   = Naming Conventions
 *   STD-FS   = File Structure & Organization
 *   STD-IM   = Import/Export Standards
 *   STD-DOC  = Documentation & JSDoc
 *   STD-ERR  = Error Handling Standards
 *   STD-RCT  = React Component Standards
 *   STD-SFRA = SFRA / ISML Standards
 *   STD-API  = API & Data Layer Standards
 *   STD-TST  = Testing Standards
 *   STD-CSS  = CSS/SCSS Standards
 *   STD-ARCH = Architectural Standards
 *   STD-PERF = Performance Standards
 *   STD-A11Y = Accessibility Standards
 */

// ─────────────────────────────────────────────────────────
// NAMING CONVENTION RULES
// ─────────────────────────────────────────────────────────
const NAMING_STANDARDS = [
  {
    id: 'STD-NM-001',
    name: 'Component File Must Use PascalCase',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Naming Convention',
    description: 'React component files must use PascalCase naming (e.g., ProductCard.jsx, not productCard.jsx or product-card.jsx). This is the industry standard and makes components instantly recognizable.',
    fix: 'Rename the file to PascalCase. Example: product-card.jsx → ProductCard.jsx',
    references: ['React Style Guide: File Naming', 'Airbnb React/JSX Style Guide'],
    fileTypes: ['react-component'],
    fileNameCheck: (filePath) => {
      const basename = filePath.split('/').pop().replace(/\.(jsx|tsx)$/, '');
      // Skip index files and test files
      if (basename === 'index' || basename.includes('.test') || basename.includes('.spec')) return null;
      // Check PascalCase: starts with uppercase, no hyphens or underscores
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(basename)) {
        return `File "${basename}" should be PascalCase (e.g., "${toPascalCase(basename)}")`;
      }
      return null;
    }
  },
  {
    id: 'STD-NM-002',
    name: 'Non-Component JS File Must Use camelCase or kebab-case',
    severity: 'low',
    category: 'coding-standards',
    type: 'Naming Convention',
    description: 'Utility files, helpers, and non-component JavaScript files should use camelCase (utils.js) or kebab-case (api-helpers.js). PascalCase is reserved for React components.',
    fix: 'Rename to camelCase or kebab-case. Example: MyHelper.js → myHelper.js or my-helper.js',
    references: ['Project File Naming Convention'],
    fileTypes: ['javascript', 'typescript'],
    fileNameCheck: (filePath) => {
      const basename = filePath.split('/').pop().replace(/\.(js|ts|mjs|cjs)$/, '');
      if (basename === 'index' || basename.includes('.test') || basename.includes('.spec')) return null;
      // Skip if it's in a components directory (might be a component)
      if (/components?/i.test(filePath)) return null;
      // Flag if PascalCase (likely should be component or renamed)
      if (/^[A-Z][a-zA-Z0-9]+$/.test(basename) && !/(Controller|Model|Service|Factory|Router|Middleware)$/.test(basename)) {
        return `Non-component file "${basename}" uses PascalCase. Use camelCase or kebab-case for utilities/helpers.`;
      }
      return null;
    }
  },
  {
    id: 'STD-NM-003',
    name: 'Constants Must Use UPPER_SNAKE_CASE',
    severity: 'low',
    category: 'coding-standards',
    type: 'Naming Convention',
    pattern: /^(?:export\s+)?const\s+([a-z][a-zA-Z0-9_]*)\s*=\s*(?:['"`][^'"]*['"`]|[0-9]+|true|false|null)\s*;?\s*$/gm,
    description: 'Module-level constants (strings, numbers, booleans) should use UPPER_SNAKE_CASE to distinguish them from variables. Example: const MAX_RETRIES = 3, not const maxRetries = 3.',
    fix: 'Rename the constant to UPPER_SNAKE_CASE. Example: const apiUrl = "..." → const API_URL = "..."',
    references: ['Airbnb Style Guide: 23.10'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
    contextCheck: (line, lineNum, allLines) => {
      // Only flag top-level constants (not inside functions)
      // Simple heuristic: check if we're at indentation level 0
      return /^(?:export\s+)?const\s/.test(line) && !line.startsWith('  ') && !line.startsWith('\t');
    }
  },
  {
    id: 'STD-NM-004',
    name: 'Boolean Variables Should Use is/has/should Prefix',
    severity: 'low',
    category: 'coding-standards',
    type: 'Naming Convention',
    pattern: /(?:const|let|var)\s+(active|visible|disabled|loading|open|closed|enabled|valid|selected|checked|expanded|collapsed|authenticated|authorized|hidden|ready|complete|done|empty|dirty|pristine|touched|submitting|editing)\s*=/g,
    description: 'Boolean variables should be prefixed with is, has, should, can, or will to clearly indicate they hold boolean values. Example: loading → isLoading, visible → isVisible.',
    fix: 'Add an appropriate prefix: const loading → const isLoading, const active → const isActive, const authenticated → const isAuthenticated',
    references: ['Clean Code: Meaningful Names'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'STD-NM-005',
    name: 'Event Handler Should Use handle/on Prefix',
    severity: 'low',
    category: 'coding-standards',
    type: 'Naming Convention',
    pattern: /(?:const|function)\s+(click|submit|change|focus|blur|keypress|keydown|scroll|hover|toggle|delete|remove|add|save|update|close|cancel)[A-Z]\w*\s*(?:=\s*(?:\([^)]*\)\s*=>|\function)|[\s(])/g,
    description: 'Event handler functions should be prefixed with "handle" (internal) or "on" (props). Example: clickButton → handleButtonClick, submitForm → handleFormSubmit.',
    fix: 'Rename with handle prefix: const clickItem = () => {} → const handleItemClick = () => {}',
    references: ['React Naming Conventions'],
    fileTypes: ['react-component', 'javascript', 'typescript'],
  },
];

// ─────────────────────────────────────────────────────────
// DOCUMENTATION STANDARDS
// ─────────────────────────────────────────────────────────
const DOCUMENTATION_STANDARDS = [
  {
    id: 'STD-DOC-001',
    name: 'Exported Function Missing JSDoc',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Documentation',
    pattern: /(?<!\*\/\s*\n\s*)(?:export\s+(?:default\s+)?(?:async\s+)?function\s+\w+|module\.exports\s*=\s*(?:async\s+)?function\s+\w+)/g,
    description: 'Exported/public functions must have JSDoc comments documenting purpose, parameters (@param), and return value (@returns). This is required for maintainability and IDE support.',
    fix: `Add JSDoc above the function:\n\n/**\n * Brief description of what this function does.\n * @param {string} paramName - Description of parameter\n * @returns {Promise<Object>} Description of return value\n */\nexport function myFunction(paramName) { ... }`,
    references: ['JSDoc Documentation Standard', 'Team Coding Guidelines: Documentation'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
    contextCheck: (line, lineNum, allLines) => {
      // Check if previous lines contain JSDoc
      if (lineNum < 1) return true;
      for (let i = lineNum - 1; i >= Math.max(0, lineNum - 5); i--) {
        if (allLines[i].trim().includes('*/')) return false; // Has JSDoc
        if (allLines[i].trim().length === 0) continue;
        if (allLines[i].trim().startsWith('//')) continue;
        break;
      }
      return true;
    }
  },
  {
    id: 'STD-DOC-002',
    name: 'React Component Missing PropTypes or TypeScript Props',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Documentation',
    pattern: /(?:export\s+(?:default\s+)?(?:function|const)\s+\w+|const\s+\w+\s*=\s*(?:React\.)?(?:memo|forwardRef)\s*\()\s*\(/g,
    description: 'React components must document their props either via TypeScript interfaces/types or PropTypes. This is essential for team collaboration and catching bugs early.',
    fix: `// TypeScript approach (preferred):\ninterface ProductCardProps {\n  product: Product;\n  onAddToCart: (id: string) => void;\n  isLoading?: boolean;\n}\n\nconst ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, isLoading = false }) => { ... }\n\n// PropTypes approach:\nimport PropTypes from 'prop-types';\nProductCard.propTypes = {\n  product: PropTypes.object.isRequired,\n  onAddToCart: PropTypes.func.isRequired,\n  isLoading: PropTypes.bool,\n};`,
    references: ['React: Typechecking With PropTypes', 'TypeScript + React Guide'],
    fileTypes: ['react-component'],
    contextCheck: (line, lineNum, allLines) => {
      const content = allLines.join('\n');
      const funcName = line.match(/(?:function|const)\s+(\w+)/);
      if (!funcName) return false;
      const name = funcName[1];
      // Check if PropTypes or TypeScript types are defined
      if (content.includes(`${name}.propTypes`) || content.includes(`${name}Props`) ||
          content.includes(`: React.FC<`) || content.includes(`: FC<`)) {
        return false;
      }
      return true;
    }
  },
  {
    id: 'STD-DOC-003',
    name: 'Complex Logic Missing Inline Comments',
    severity: 'low',
    category: 'coding-standards',
    type: 'Documentation',
    pattern: /(?:(?:\?\?|&&|\|\||[?:])\s*(?:\?\?|&&|\|\||[?:])){2,}/g,
    description: 'Complex expressions with multiple chained operators (&&, ||, ??, ternary) need inline comments explaining the logic. If the code needs a comment to explain it, it probably also needs refactoring.',
    fix: 'Add an inline comment explaining the business logic, or refactor into a named helper function:\n\n// Fallback order: user preference → account default → system default\nconst currency = userPref ?? accountDefault ?? SYSTEM_DEFAULT;',
    references: ['Clean Code: Comments'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'STD-DOC-004',
    name: 'File Missing Module Header Comment',
    severity: 'low',
    category: 'coding-standards',
    type: 'Documentation',
    fileTypes: ['javascript', 'typescript', 'react-component', 'sfcc-script'],
    fileCheck: (content, filePath) => {
      const firstLines = content.split('\n').slice(0, 5).join('\n');
      // Skip test files and config files
      if (/\.(test|spec|config)\./i.test(filePath)) return null;
      if (filePath.includes('__tests__') || filePath.includes('__mocks__')) return null;
      // Check for any block comment or docstring at the top
      if (/^\/\*\*|^\/\*|^\/\//.test(firstLines.trim())) return null;
      if (/^['"]use strict['"]/.test(firstLines.trim())) {
        const afterStrict = content.split('\n').slice(1, 6).join('\n');
        if (/^\/\*\*|^\/\*|^\/\//.test(afterStrict.trim())) return null;
      }
      return `File "${filePath.split('/').pop()}" is missing a module header comment. Add a brief /** ... */ block describing what this module does.`;
    },
    description: 'Every source file should have a brief header comment (/** ... */) describing the module purpose, key exports, and any important notes. This helps new developers quickly understand file responsibility.',
    fix: `Add a header comment at the top of the file:\n\n/**\n * ProductCard Component\n * Renders a product tile with image, title, price, and add-to-cart action.\n * Used in PLP, search results, and recommendation carousels.\n */`,
    references: ['Team Coding Guidelines: File Headers'],
  },
];

// ─────────────────────────────────────────────────────────
// IMPORT / EXPORT STANDARDS
// ─────────────────────────────────────────────────────────
const IMPORT_STANDARDS = [
  {
    id: 'STD-IM-001',
    name: 'Wildcard Import (import *)',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Import Standard',
    pattern: /import\s+\*\s+as\s+\w+\s+from\s+/g,
    description: 'Wildcard imports (import * as X) import everything from a module, increasing bundle size and making it unclear which exports are actually used. Use named imports instead.',
    fix: 'Replace with named imports:\n\n// Bad:\nimport * as utils from "./utils";\nutils.formatPrice(price);\n\n// Good:\nimport { formatPrice, formatDate } from "./utils";',
    references: ['ES6 Import Best Practices', 'Tree-shaking Optimization'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'STD-IM-002',
    name: 'Relative Import Reaching Too Deep (../../..)',
    severity: 'low',
    category: 'coding-standards',
    type: 'Import Standard',
    pattern: /(?:import|require)\s*\(?['"`](?:\.\.\/){3,}/g,
    description: 'Import paths traversing 3+ parent directories (../../..) indicate poor module organization and are fragile. Use path aliases or reorganize modules.',
    fix: 'Configure path aliases in jsconfig.json/tsconfig.json:\n\n// Bad:\nimport { helper } from "../../../utils/helpers";\n\n// Good (with alias):\nimport { helper } from "@utils/helpers";\n\n// jsconfig.json:\n{ "compilerOptions": { "paths": { "@utils/*": ["src/utils/*"] } } }',
    references: ['Module Organization Best Practices'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'STD-IM-003',
    name: 'Unsorted or Ungrouped Imports',
    severity: 'info',
    category: 'coding-standards',
    type: 'Import Standard',
    fileTypes: ['react-component', 'javascript', 'typescript'],
    fileCheck: (content) => {
      const lines = content.split('\n');
      const importLines = [];
      let lastImportLine = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/^import\s/.test(lines[i].trim())) {
          importLines.push({ line: i, text: lines[i] });
          lastImportLine = i;
        }
      }
      if (importLines.length < 4) return null; // Not enough imports to matter

      // Check for grouping: react/framework → external → internal → relative
      let hasReact = false, hasExternal = false, hasInternal = false, hasRelative = false;
      let reactAfterOther = false;

      for (const imp of importLines) {
        const text = imp.text;
        if (/from\s+['"]react['"]/.test(text)) {
          hasReact = true;
          if (hasExternal || hasInternal || hasRelative) reactAfterOther = true;
        } else if (/from\s+['"]\./.test(text)) {
          hasRelative = true;
        } else if (/from\s+['"]@\//.test(text) || /from\s+['"]~\//.test(text)) {
          hasInternal = true;
        } else {
          hasExternal = true;
        }
      }

      if (reactAfterOther) {
        return 'Imports should be grouped in this order: 1) React/framework, 2) External packages, 3) Internal aliases (@/), 4) Relative imports (./). Add a blank line between groups.';
      }
      return null;
    },
    description: 'Imports should be organized in groups: 1) React/framework imports, 2) Third-party packages, 3) Internal alias imports (@/), 4) Relative imports (./). Separate groups with a blank line.',
    fix: `// 1. React & framework\nimport React, { useState, useEffect } from 'react';\nimport { useQuery } from '@tanstack/react-query';\n\n// 2. Third-party\nimport PropTypes from 'prop-types';\nimport classNames from 'classnames';\n\n// 3. Internal (alias)\nimport { useProduct } from '@/hooks/useProduct';\nimport { API_ENDPOINTS } from '@/constants';\n\n// 4. Relative\nimport { ProductImage } from './ProductImage';\nimport styles from './ProductCard.module.css';`,
    references: ['Import Ordering Convention'],
  },
];

// ─────────────────────────────────────────────────────────
// ERROR HANDLING STANDARDS
// ─────────────────────────────────────────────────────────
const ERROR_HANDLING_STANDARDS = [
  {
    id: 'STD-ERR-001',
    name: 'Generic Error Catch Without Logging',
    severity: 'high',
    category: 'coding-standards',
    type: 'Error Handling',
    pattern: /catch\s*\(\s*(?:e|err|error|ex)\s*\)\s*\{[^}]*(?:return\s+(?:null|undefined|false|\[\]|\{\})|res\.status)/gs,
    description: 'Catching errors and returning null/empty without logging loses critical debugging information. Every catch block must log the error with enough context for debugging.',
    fix: `// Bad:\ncatch (error) {\n  return null;\n}\n\n// Good:\ncatch (error) {\n  logger.error('Failed to fetch product', { productId, error: error.message, stack: error.stack });\n  return null;\n}`,
    references: ['Error Handling Best Practices', 'Observability Standards'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'STD-ERR-002',
    name: 'Throwing String Instead of Error Object',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Error Handling',
    pattern: /throw\s+['"`][^'"]*['"`]/g,
    description: 'Throwing strings instead of Error objects loses the stack trace. Always throw Error instances (or custom error classes extending Error).',
    fix: `// Bad:\nthrow "Something went wrong";\nthrow 'Product not found';\n\n// Good:\nthrow new Error("Something went wrong");\nthrow new NotFoundError("Product not found", { productId });`,
    references: ['CWE-755: Error Handling', 'JavaScript Error Best Practices'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'STD-ERR-003',
    name: 'Promise Without .catch() or try/catch',
    severity: 'high',
    category: 'coding-standards',
    type: 'Error Handling',
    pattern: /\.then\s*\([^)]*\)\s*(?:;|\n)(?!\s*\.catch)/g,
    description: 'Unhandled promise rejection. Every .then() chain must have a .catch() handler. Unhandled promise rejections crash Node.js processes and create silent failures in browsers.',
    fix: `// Bad:\nfetchProduct(id).then(data => setProduct(data));\n\n// Good (promise):\nfetchProduct(id)\n  .then(data => setProduct(data))\n  .catch(error => {\n    logger.error('Product fetch failed', { id, error });\n    setError(error.message);\n  });\n\n// Better (async/await):\ntry {\n  const data = await fetchProduct(id);\n  setProduct(data);\n} catch (error) {\n  logger.error('Product fetch failed', { id, error });\n  setError(error.message);\n}`,
    references: ['Node.js: Unhandled Promise Rejections'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'STD-ERR-004',
    name: 'API Response Error Not Checked',
    severity: 'high',
    category: 'coding-standards',
    type: 'Error Handling',
    pattern: /(?:await\s+)?fetch\s*\([^)]+\)\s*(?:\.\s*then\s*\(\s*(?:res|response)\s*=>\s*(?:res|response)\.json\(\)|;)/g,
    description: 'Fetch response is not checking response.ok or status code before parsing. Non-2xx responses will still resolve the promise but may contain error bodies.',
    fix: `// Bad:\nconst data = await fetch(url).then(res => res.json());\n\n// Good:\nconst response = await fetch(url);\nif (!response.ok) {\n  throw new Error(\`API error: \${response.status} \${response.statusText}\`);\n}\nconst data = await response.json();`,
    references: ['Fetch API Error Handling'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
];

// ─────────────────────────────────────────────────────────
// REACT COMPONENT STANDARDS
// ─────────────────────────────────────────────────────────
const REACT_STANDARDS = [
  {
    id: 'STD-RCT-001',
    name: 'Component Over 250 Lines — Needs Splitting',
    severity: 'medium',
    category: 'coding-standards',
    type: 'React Architecture',
    fileTypes: ['react-component'],
    fileCheck: (content, filePath) => {
      if (content.split('\n').length > 250) {
        return `Component file has ${content.split('\n').length} lines. Components over 250 lines are hard to maintain. Extract sub-components, custom hooks, or utility functions.`;
      }
      return null;
    },
    description: 'React components should not exceed 250 lines. Large components are hard to test, review, and maintain. Extract logic into custom hooks, sub-components, and utility functions.',
    fix: 'Split into:\n1. Main component (renders layout)\n2. Sub-components (ProductImage, ProductPrice, etc.)\n3. Custom hook (useProductData) for data fetching\n4. Utility functions (formatPrice, etc.) in a separate file',
    references: ['React Component Architecture', 'Single Responsibility Principle'],
  },
  {
    id: 'STD-RCT-002',
    name: 'Direct DOM Access (document/window) Without SSR Guard',
    severity: 'high',
    category: 'coding-standards',
    type: 'React / SSR',
    pattern: /(?<!\/\/.*)\b(?:document\.|window\.|navigator\.|localStorage\.|sessionStorage\.)(?!.*(?:typeof\s+(?:window|document)\s*[!=]==?\s*['"]undefined['"]))/g,
    description: 'Direct access to browser APIs (document, window, localStorage) breaks SSR in PWA Kit. These APIs do not exist on the server and will cause hydration mismatches or crashes.',
    fix: `// Bad:\nconst width = window.innerWidth;\n\n// Good — Guard with typeof check:\nconst width = typeof window !== 'undefined' ? window.innerWidth : 0;\n\n// Better — Use in useEffect (runs only on client):\nuseEffect(() => {\n  const width = window.innerWidth;\n  setWidth(width);\n}, []);`,
    references: ['PWA Kit SSR Guide', 'React Hydration Documentation'],
    fileTypes: ['react-component'],
    contextCheck: (line) => {
      // Don't flag if line contains typeof check
      if (/typeof\s+(?:window|document)/.test(line)) return false;
      // Don't flag comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return false;
      return true;
    }
  },
  {
    id: 'STD-RCT-003',
    name: 'Missing Error Boundary for Data-Fetching Component',
    severity: 'medium',
    category: 'coding-standards',
    type: 'React Architecture',
    pattern: /(?:useQuery|useFetch|useAsync|commerce-sdk-react|useProduct|useCategor|useSearch|useShop)/g,
    description: 'Components that fetch data should be wrapped in Error Boundaries. Without them, a failed API call crashes the entire page instead of showing a graceful fallback.',
    fix: `// Create an ErrorBoundary:\nimport { ErrorBoundary } from 'react-error-boundary';\n\nfunction ErrorFallback({ error, resetErrorBoundary }) {\n  return (\n    <div role="alert">\n      <p>Something went wrong loading this section.</p>\n      <button onClick={resetErrorBoundary}>Try again</button>\n    </div>\n  );\n}\n\n// Wrap data-fetching components:\n<ErrorBoundary FallbackComponent={ErrorFallback}>\n  <ProductGrid />\n</ErrorBoundary>`,
    references: ['React Error Boundaries', 'Resilient Components'],
    fileTypes: ['react-component'],
  },
  {
    id: 'STD-RCT-004',
    name: 'State Update in useEffect Without Cleanup',
    severity: 'medium',
    category: 'coding-standards',
    type: 'React Bug',
    pattern: /useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]*(?:setState|set[A-Z]\w*)\s*\([^}]*(?!\breturn\b)[^}]*\}\s*,/gs,
    description: 'useEffect that updates state but has no cleanup function may cause memory leaks if the component unmounts before the async operation completes (e.g., navigating away during a fetch).',
    fix: `useEffect(() => {\n  let isMounted = true;\n\n  async function fetchData() {\n    const result = await api.getProduct(id);\n    if (isMounted) {\n      setProduct(result);\n    }\n  }\n  fetchData();\n\n  return () => { isMounted = false; }; // Cleanup\n}, [id]);`,
    references: ['React useEffect Cleanup', 'Avoiding Memory Leaks'],
    fileTypes: ['react-component'],
  },
  {
    id: 'STD-RCT-005',
    name: 'Index Used as Key in List Rendering',
    severity: 'medium',
    category: 'coding-standards',
    type: 'React Bug',
    pattern: /\.map\s*\(\s*\([^)]*,\s*(?:index|i|idx|key)\s*\)\s*=>[^]*?key\s*=\s*\{?\s*(?:index|i|idx)\s*\}?/gs,
    description: 'Using array index as key in .map() causes rendering bugs when items are reordered, deleted, or inserted. React loses track of component identity and may render stale data.',
    fix: `// Bad:\n{products.map((product, index) => (\n  <ProductCard key={index} product={product} />\n))}\n\n// Good — Use a unique identifier:\n{products.map((product) => (\n  <ProductCard key={product.id} product={product} />\n))}`,
    references: ['React: Lists and Keys', 'Why Not to Use Index as Key'],
    fileTypes: ['react-component'],
  },
  {
    id: 'STD-RCT-006',
    name: 'Missing Loading State for Async Operations',
    severity: 'medium',
    category: 'coding-standards',
    type: 'React UX',
    pattern: /(?:useEffect|useQuery|useMutation)\s*\([^]*?(?:fetch|api\.|get|post|put|delete|axios)/gis,
    description: 'Async operations (API calls, data fetching) must have corresponding loading and error states. Users should always see feedback while waiting.',
    fix: `const [data, setData] = useState(null);\nconst [isLoading, setIsLoading] = useState(true);\nconst [error, setError] = useState(null);\n\nuseEffect(() => {\n  setIsLoading(true);\n  fetchData()\n    .then(setData)\n    .catch(setError)\n    .finally(() => setIsLoading(false));\n}, []);\n\nif (isLoading) return <Skeleton />;\nif (error) return <ErrorMessage error={error} />;\nreturn <DataDisplay data={data} />;`,
    references: ['React Loading State Pattern', 'UX: Perceived Performance'],
    fileTypes: ['react-component'],
    contextCheck: (line, lineNum, allLines) => {
      const content = allLines.join('\n');
      // Check if loading state exists
      if (/(?:isLoading|loading|isFetching|isPending)\s*[,=]/.test(content)) return false;
      if (/Skeleton|Spinner|Loading|Loader/.test(content)) return false;
      return true;
    }
  },
];

// ─────────────────────────────────────────────────────────
// SFRA SPECIFIC STANDARDS
// ─────────────────────────────────────────────────────────
const SFRA_STANDARDS = [
  {
    id: 'STD-SFRA-001',
    name: 'Controller Missing server.use Guard',
    severity: 'high',
    category: 'coding-standards',
    type: 'SFRA Security',
    pattern: /server\.(?:get|post|put|delete|append|prepend|replace)\s*\(\s*['"][^'"]+['"]\s*,\s*(?!.*(?:server\.middleware\.https|userLoggedIn|csrfProtection))/g,
    description: 'SFRA controller route is missing middleware guards. All routes must have appropriate security middleware (server.middleware.https for SSL, userLoggedIn for auth, csrfProtection for forms).',
    fix: `// Bad:\nserver.get('Show', function(req, res, next) { ... });\n\n// Good:\nserver.get('Show',\n  server.middleware.https,\n  userLoggedIn.validateLoggedIn,\n  csrfProtection.validateAjaxRequest,\n  function(req, res, next) { ... }\n);`,
    references: ['SFRA Controller Middleware Guide', 'SFCC Security Best Practices'],
    fileTypes: ['javascript', 'sfcc-script'],
    contextCheck: (line, lineNum, allLines) => {
      // Only check files that look like controllers
      const content = allLines.join('\n');
      if (!content.includes('server.get') && !content.includes('server.post')) return false;
      return true;
    }
  },
  {
    id: 'STD-SFRA-002',
    name: 'ISML Missing Encoding on <isprint>',
    severity: 'high',
    category: 'coding-standards',
    type: 'SFRA Security',
    pattern: /<isprint\s+value\s*=\s*["'][^"']*["']\s*(?!\s*encoding\s*=)/gi,
    description: 'The <isprint> tag must always specify an encoding attribute to prevent XSS. Use encoding="htmlcontent" for HTML context or encoding="htmlsinglequote"/"htmldoublequote" for attribute contexts.',
    fix: `<!-- Bad -->\n<isprint value="\${pdict.product.name}" />\n\n<!-- Good -->\n<isprint value="\${pdict.product.name}" encoding="htmlcontent" />\n\n<!-- In an attribute -->\n<a href="<isprint value="\${pdict.url}" encoding="htmldoublequote" />">`,
    references: ['SFCC ISML Security', 'CWE-79: XSS Prevention'],
    fileTypes: ['isml-template'],
  },
  {
    id: 'STD-SFRA-003',
    name: 'Direct Request Parameter Usage Without Validation',
    severity: 'high',
    category: 'coding-standards',
    type: 'SFRA Security',
    pattern: /req\.(?:querystring|form|httpParameterMap)\.\w+(?!\s*&&|\s*\?\.|\.(?:stringValue|intValue|doubleValue|value)\s*(?:\|\||&&|\?|;|,|\)|$))/g,
    description: 'Request parameters must be validated and typed before use. Direct access to req.querystring without validation is a common source of injection and type-related bugs in SFCC.',
    fix: `// Bad:\nvar productId = req.querystring.pid;\n\n// Good — Validate and type:\nvar productId = req.querystring.pid;\nif (!productId || typeof productId !== 'string' || productId.length > 50) {\n  res.setStatusCode(400);\n  return next();\n}`,
    references: ['SFCC Input Validation', 'OWASP: Input Validation Cheat Sheet'],
    fileTypes: ['javascript', 'sfcc-script'],
  },
];

// ─────────────────────────────────────────────────────────
// API / DATA LAYER STANDARDS
// ─────────────────────────────────────────────────────────
const API_STANDARDS = [
  {
    id: 'STD-API-001',
    name: 'API Call Directly in Component (No Service Layer)',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Architecture',
    pattern: /(?:const|let|var)\s+\w+\s*=\s*(?:await\s+)?(?:fetch|axios\.|http\.)\s*\(/g,
    description: 'API calls should not be made directly inside React components. Use a service layer or custom hooks to separate data fetching from presentation. This makes the code testable, reusable, and easier to mock.',
    fix: `// Bad — API call in component:\nconst ProductPage = () => {\n  const data = await fetch('/api/products/123');\n  ...\n};\n\n// Good — Service layer:\n// services/productService.js\nexport async function getProduct(id) {\n  const response = await fetch(\`/api/products/\${id}\`);\n  if (!response.ok) throw new APIError(response);\n  return response.json();\n}\n\n// hooks/useProduct.js\nexport function useProduct(id) {\n  return useQuery(['product', id], () => getProduct(id));\n}\n\n// components/ProductPage.jsx\nconst ProductPage = () => {\n  const { data, isLoading, error } = useProduct(id);\n};`,
    references: ['Service Layer Pattern', 'Separation of Concerns'],
    fileTypes: ['react-component'],
  },
  {
    id: 'STD-API-002',
    name: 'Hardcoded API URL / Endpoint',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Architecture',
    pattern: /(?:fetch|axios\.\w+|http\.\w+)\s*\(\s*['"`](?:https?:\/\/|\/api\/)/g,
    description: 'API URLs should not be hardcoded in component or service files. Use a centralized constants/config file for all endpoints. This makes URL changes and environment switching painless.',
    fix: `// Bad:\nfetch("https://api.example.com/products/123");\nfetch("/api/v2/products");\n\n// Good — Centralize in constants:\n// constants/api.js\nexport const API_BASE = process.env.REACT_APP_API_BASE || '/api/v2';\nexport const ENDPOINTS = {\n  products: \`\${API_BASE}/products\`,\n  cart: \`\${API_BASE}/cart\`,\n};\n\n// Usage:\nimport { ENDPOINTS } from '@/constants/api';\nfetch(\`\${ENDPOINTS.products}/\${id}\`);`,
    references: ['Configuration Management', '12-Factor App: Config'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
  {
    id: 'STD-API-003',
    name: 'Sensitive Data in URL Parameters',
    severity: 'high',
    category: 'coding-standards',
    type: 'Security',
    pattern: /(?:fetch|axios|http|url|href|redirect)\s*\([^)]*(?:password|token|secret|apikey|api_key|ssn|credit.?card|cvv)\s*[:=]\s*/gi,
    description: 'Sensitive data (passwords, tokens, SSN, credit card) must never be sent in URL query parameters. URLs are logged in server logs, browser history, and proxy caches.',
    fix: 'Send sensitive data in the request body (POST) or Authorization headers, never in URL parameters.',
    references: ['OWASP: Sensitive Data Exposure', 'CWE-598: Information Exposure Through Query Strings'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
];

// ─────────────────────────────────────────────────────────
// ARCHITECTURAL STANDARDS
// ─────────────────────────────────────────────────────────
const ARCHITECTURE_STANDARDS = [
  {
    id: 'STD-ARCH-001',
    name: 'Business Logic Inside Presentation Component',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Architecture',
    fileTypes: ['react-component'],
    fileCheck: (content, filePath) => {
      // Skip hooks, services, utils
      if (/(?:hook|service|util|helper|lib|api|store|context)/i.test(filePath)) return null;
      // Count complex logic indicators
      const logicIndicators = [
        (content.match(/if\s*\(/g) || []).length,
        (content.match(/switch\s*\(/g) || []).length,
        (content.match(/\.filter\(/g) || []).length,
        (content.match(/\.reduce\(/g) || []).length,
        (content.match(/\.sort\(/g) || []).length,
        (content.match(/new\s+Date\(/g) || []).length,
        (content.match(/Math\./g) || []).length,
      ].reduce((a, b) => a + b, 0);

      if (logicIndicators > 8) {
        return `Component contains ${logicIndicators} business logic operations. Extract complex logic into custom hooks or utility functions. Components should primarily render UI.`;
      }
      return null;
    },
    description: 'React components should focus on rendering UI. Complex business logic (data transformations, calculations, conditional logic) should be extracted into custom hooks, service functions, or utility modules.',
    fix: 'Refactor using the custom hook pattern:\n\n// hooks/useProductPrice.js\nexport function useProductPrice(product) {\n  const discount = calculateDiscount(product);\n  const tax = calculateTax(product, userRegion);\n  return { finalPrice, discount, tax };\n}\n\n// ProductCard.jsx\nconst { finalPrice, discount } = useProductPrice(product);\nreturn <div>{formatPrice(finalPrice)}</div>;',
    references: ['React: Extracting State Logic', 'Separation of Concerns'],
  },
  {
    id: 'STD-ARCH-002',
    name: 'Function Over 40 Lines',
    severity: 'low',
    category: 'coding-standards',
    type: 'Maintainability',
    fileTypes: ['javascript', 'typescript', 'react-component', 'sfcc-script'],
    fileCheck: (content) => {
      const lines = content.split('\n');
      const findings = [];
      let funcStart = -1;
      let funcName = '';
      let braceCount = 0;
      let inFunc = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const funcMatch = line.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>)/);
        if (funcMatch && !inFunc) {
          funcName = funcMatch[1] || funcMatch[2] || 'anonymous';
          funcStart = i;
          braceCount = 0;
          inFunc = true;
        }
        if (inFunc) {
          braceCount += (line.match(/\{/g) || []).length;
          braceCount -= (line.match(/\}/g) || []).length;
          if (braceCount <= 0 && funcStart >= 0) {
            const funcLength = i - funcStart + 1;
            if (funcLength > 40) {
              findings.push(`Function "${funcName}" (line ${funcStart + 1}) is ${funcLength} lines long. Keep functions under 40 lines for readability.`);
            }
            inFunc = false;
            funcStart = -1;
          }
        }
      }
      return findings.length > 0 ? findings[0] : null; // Report first offender
    },
    description: 'Functions exceeding 40 lines are difficult to test and understand. Extract sub-operations into well-named helper functions. Each function should do one thing well.',
    fix: 'Break into smaller functions:\n\n// Bad — 60-line function:\nfunction processOrder(order) { /* 60 lines of mixed logic */ }\n\n// Good:\nfunction processOrder(order) {\n  const validatedOrder = validateOrder(order);\n  const pricedOrder = calculatePricing(validatedOrder);\n  const result = submitOrder(pricedOrder);\n  return formatOrderConfirmation(result);\n}',
    references: ['Clean Code: Functions', 'Single Responsibility Principle'],
  },
  {
    id: 'STD-ARCH-003',
    name: 'Direct State Mutation',
    severity: 'high',
    category: 'coding-standards',
    type: 'React Bug',
    pattern: /(?:state\.\w+\s*=\s|state\.\w+\.push\(|state\.\w+\.splice\(|state\.\w+\.pop\(|state\.\w+\.shift\(|state\.\w+\.unshift\(|state\.\w+\.sort\(|state\.\w+\.reverse\()/g,
    description: 'Direct mutation of state objects bypasses React change detection. The component will not re-render, leading to stale UI. Always create new objects/arrays.',
    fix: `// Bad:\nstate.items.push(newItem);\nstate.user.name = 'New Name';\n\n// Good:\nsetItems([...items, newItem]);\nsetUser({ ...user, name: 'New Name' });`,
    references: ['React: Updating Objects in State', 'React: Updating Arrays in State'],
    fileTypes: ['react-component', 'javascript'],
  },
];

// ─────────────────────────────────────────────────────────
// PERFORMANCE STANDARDS
// ─────────────────────────────────────────────────────────
const PERFORMANCE_STANDARDS = [
  {
    id: 'STD-PERF-001',
    name: 'Missing React.memo on Frequently Re-rendered Component',
    severity: 'low',
    category: 'coding-standards',
    type: 'Performance',
    pattern: /export\s+(?:default\s+)?function\s+\w+(?:Card|Item|Row|Cell|Badge|Tag|Chip|Avatar|Icon|Thumbnail)\s*\(/g,
    description: 'List item components (Card, Item, Row, etc.) that are rendered inside .map() should be wrapped in React.memo() to prevent unnecessary re-renders when parent state changes.',
    fix: `// Wrap list-item components with React.memo:\nconst ProductCard = React.memo(function ProductCard({ product, onAddToCart }) {\n  return ( ... );\n});\n\nexport default ProductCard;`,
    references: ['React.memo Documentation', 'React Performance Optimization'],
    fileTypes: ['react-component'],
  },
  {
    id: 'STD-PERF-002',
    name: 'Expensive Computation Without useMemo',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Performance',
    pattern: /(?:\.filter\([^)]+\)\s*\.map\(|\.sort\([^)]+\)\s*\.map\(|\.reduce\([^)]+\)\s*\.filter\(|\.map\([^)]+\)\s*\.filter\()/g,
    description: 'Chained array operations (.filter().map(), .sort().map()) inside render are recomputed every render. Wrap in useMemo() when operating on large datasets.',
    fix: `// Bad — runs every render:\nconst filtered = products.filter(p => p.active).map(p => <Card key={p.id} />);\n\n// Good:\nconst filtered = useMemo(() =>\n  products.filter(p => p.active).map(p => <Card key={p.id} />)\n, [products]);`,
    references: ['React useMemo', 'Expensive Calculations'],
    fileTypes: ['react-component'],
  },
  {
    id: 'STD-PERF-003',
    name: 'Large Bundle Import (Entire Library)',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Performance',
    pattern: /import\s+(?:_|lodash|moment|dayjs)\s+from\s+['"](?:lodash|moment|dayjs)['"]/g,
    description: 'Importing the entire library bloats the bundle. Use targeted imports to only include what you need. Example: lodash full = 71KB vs lodash/get = 1KB.',
    fix: `// Bad — imports entire library:\nimport _ from 'lodash'; // 71KB\nimport moment from 'moment'; // 300KB\n\n// Good — import only what you need:\nimport get from 'lodash/get'; // 1KB\nimport debounce from 'lodash/debounce';\nimport { format } from 'date-fns'; // Tree-shakeable`,
    references: ['Bundle Size Optimization', 'Tree Shaking'],
    fileTypes: ['javascript', 'typescript', 'react-component'],
  },
];

// ─────────────────────────────────────────────────────────
// ACCESSIBILITY STANDARDS
// ─────────────────────────────────────────────────────────
const ACCESSIBILITY_STANDARDS = [
  {
    id: 'STD-A11Y-001',
    name: 'Clickable Element Without Keyboard Support',
    severity: 'high',
    category: 'coding-standards',
    type: 'Accessibility',
    pattern: /(?:<div|<span|<img)\s[^>]*onClick\s*=\s*\{[^}]*\}[^>]*(?!.*(?:role\s*=|onKeyDown|onKeyPress|onKeyUp|tabIndex))/g,
    description: 'Non-interactive elements (div, span, img) with onClick must also have keyboard event handlers and ARIA role. Users who rely on keyboards or screen readers cannot interact with click-only elements.',
    fix: `// Bad:\n<div onClick={handleClick}>Click me</div>\n\n// Good:\n<button onClick={handleClick}>Click me</button>\n\n// If button isn't an option:\n<div\n  role="button"\n  tabIndex={0}\n  onClick={handleClick}\n  onKeyDown={(e) => e.key === 'Enter' && handleClick()}\n>\n  Click me\n</div>`,
    references: ['WCAG 2.1: 2.1.1 Keyboard', 'WAI-ARIA: Button Role'],
    fileTypes: ['react-component'],
  },
  {
    id: 'STD-A11Y-002',
    name: 'Image Missing Alt Text',
    severity: 'high',
    category: 'coding-standards',
    type: 'Accessibility',
    pattern: /<img\s[^>]*(?!.*\balt\s*=)[^>]*\/?>/gi,
    description: 'All images must have alt text. Screen readers cannot describe images without alt attributes. Use descriptive alt for informative images, or alt="" for decorative images.',
    fix: `<!-- Informative image -->\n<img src="product.jpg" alt="Red Nike Air Max 90 running shoe, side view" />\n\n<!-- Decorative image -->\n<img src="divider.svg" alt="" role="presentation" />`,
    references: ['WCAG 2.1: 1.1.1 Non-text Content'],
    fileTypes: ['react-component', 'isml-template', 'html'],
  },
  {
    id: 'STD-A11Y-003',
    name: 'Form Input Missing Label',
    severity: 'high',
    category: 'coding-standards',
    type: 'Accessibility',
    pattern: /<input\s[^>]*(?!.*(?:aria-label|aria-labelledby|id\s*=\s*['"][^'"]+['"]))[^>]*\/?>/gi,
    description: 'Form inputs must have associated labels for screen reader users. Use <label htmlFor="id">, aria-label, or aria-labelledby.',
    fix: `// Best — visible label:\n<label htmlFor="email">Email Address</label>\n<input id="email" type="email" />\n\n// Acceptable — hidden label:\n<input type="search" aria-label="Search products" />`,
    references: ['WCAG 2.1: 1.3.1 Info and Relationships', 'WCAG 2.1: 3.3.2 Labels'],
    fileTypes: ['react-component', 'isml-template', 'html'],
  },
];

// ─────────────────────────────────────────────────────────
// CSS / SCSS STANDARDS
// ─────────────────────────────────────────────────────────
const CSS_STANDARDS = [
  {
    id: 'STD-CSS-001',
    name: '!important Override',
    severity: 'low',
    category: 'coding-standards',
    type: 'CSS Standard',
    pattern: /!important/g,
    description: '!important creates specificity wars and makes CSS nearly impossible to maintain. Fix the specificity issue at its source instead of using !important as a bandaid.',
    fix: 'Increase specificity naturally or restructure CSS hierarchy instead of using !important.',
    references: ['CSS Specificity', 'BEM Methodology'],
    fileTypes: ['stylesheet'],
  },
  {
    id: 'STD-CSS-002',
    name: 'Hardcoded Color Value (Not Using Design Tokens)',
    severity: 'low',
    category: 'coding-standards',
    type: 'CSS Standard',
    pattern: /(?:color|background(?:-color)?|border(?:-color)?|outline-color)\s*:\s*#[0-9a-fA-F]{3,8}/g,
    description: 'Hardcoded hex colors should be replaced with CSS custom properties (design tokens) for consistency and easy theme changes.',
    fix: `/* Bad */\ncolor: #333333;\nbackground: #f5f5f5;\n\n/* Good */\ncolor: var(--color-text-primary);\nbackground: var(--color-bg-secondary);`,
    references: ['Design Tokens', 'CSS Custom Properties'],
    fileTypes: ['stylesheet'],
  },
  {
    id: 'STD-CSS-003',
    name: 'Hardcoded px Values for Spacing (Not Using Scale)',
    severity: 'info',
    category: 'coding-standards',
    type: 'CSS Standard',
    pattern: /(?:margin|padding|gap)\s*:\s*\d+px/g,
    description: 'Use spacing scale variables (4px increments) instead of arbitrary pixel values. This ensures visual consistency across the application.',
    fix: `/* Bad */\nmargin: 13px;\npadding: 27px;\n\n/* Good — use spacing scale */\nmargin: var(--space-3); /* 12px */\npadding: var(--space-7); /* 28px */`,
    references: ['Design System Spacing Scale'],
    fileTypes: ['stylesheet'],
    contextCheck: (line) => {
      // Only flag non-standard values (not multiples of 4)
      const match = line.match(/(\d+)px/);
      if (!match) return false;
      const val = parseInt(match[1]);
      return val > 4 && val % 4 !== 0;
    }
  },
];

// ─────────────────────────────────────────────────────────
// TESTING STANDARDS
// ─────────────────────────────────────────────────────────
const TESTING_STANDARDS = [
  {
    id: 'STD-TST-001',
    name: 'Component Missing Test File',
    severity: 'medium',
    category: 'coding-standards',
    type: 'Testing',
    fileTypes: ['react-component'],
    // This is checked at the file-map level, not per-line
    crossFileCheck: (file, allFiles) => {
      const basename = file.path.split('/').pop().replace(/\.(jsx|tsx)$/, '');
      if (basename === 'index') return null;
      // Look for corresponding test file
      const testPatterns = [
        `${basename}.test.`, `${basename}.spec.`,
        `__tests__/${basename}`, `tests/${basename}`,
      ];
      const hasTest = allFiles.some(f =>
        testPatterns.some(pattern => f.path.includes(pattern))
      );
      if (!hasTest) {
        return `Component "${basename}" has no test file. Create ${basename}.test.jsx with at minimum: render test, key prop tests, and snapshot test.`;
      }
      return null;
    },
    description: 'Every React component must have a corresponding test file. At minimum, test that it renders without crashing, handles key props correctly, and matches its snapshot.',
    fix: `// Create ProductCard.test.jsx:\nimport { render, screen } from '@testing-library/react';\nimport ProductCard from './ProductCard';\n\nconst mockProduct = { id: '1', name: 'Test', price: 29.99 };\n\ndescribe('ProductCard', () => {\n  it('renders without crashing', () => {\n    render(<ProductCard product={mockProduct} />);\n  });\n\n  it('displays product name', () => {\n    render(<ProductCard product={mockProduct} />);\n    expect(screen.getByText('Test')).toBeInTheDocument();\n  });\n\n  it('handles missing product gracefully', () => {\n    render(<ProductCard product={null} />);\n    // Should not crash\n  });\n});`,
    references: ['React Testing Library', 'Testing Best Practices'],
  },
];

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function toPascalCase(str) {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

// ─────────────────────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────────────────────

const ALL_STANDARDS = [
  ...NAMING_STANDARDS,
  ...DOCUMENTATION_STANDARDS,
  ...IMPORT_STANDARDS,
  ...ERROR_HANDLING_STANDARDS,
  ...REACT_STANDARDS,
  ...SFRA_STANDARDS,
  ...API_STANDARDS,
  ...ARCHITECTURE_STANDARDS,
  ...PERFORMANCE_STANDARDS,
  ...ACCESSIBILITY_STANDARDS,
  ...CSS_STANDARDS,
  ...TESTING_STANDARDS,
];

function shouldCheckFile(file, rule) {
  if (!rule.fileTypes.includes('all') && !rule.fileTypes.includes(file.category)) {
    return false;
  }
  if (rule.excludeFilePatterns) {
    for (const p of rule.excludeFilePatterns) {
      if (p.test(file.path)) return false;
    }
  }
  return true;
}

function runCodingStandardsChecks(fileMap, stack = []) {
  const findings = [];

  for (const file of fileMap.files) {
    const allLines = file.content.split('\n');

    for (const rule of ALL_STANDARDS) {
      if (!shouldCheckFile(file, rule)) continue;

      // ── File-Level Checks (fileName, fileCheck, crossFileCheck) ──
      if (rule.fileNameCheck) {
        const result = rule.fileNameCheck(file.path);
        if (result) {
          findings.push({
            id: rule.id,
            name: rule.name,
            severity: rule.severity,
            category: rule.category,
            type: rule.type,
            file: file.path,
            line: 1,
            description: result,
            fix: rule.fix,
            references: rule.references || [],
            source: 'standards-check',
          });
        }
      }

      if (rule.fileCheck) {
        const result = rule.fileCheck(file.content, file.path);
        if (result) {
          findings.push({
            id: rule.id,
            name: rule.name,
            severity: rule.severity,
            category: rule.category,
            type: rule.type,
            file: file.path,
            line: 1,
            description: typeof result === 'string' ? result : rule.description,
            fix: rule.fix,
            references: rule.references || [],
            source: 'standards-check',
          });
        }
      }

      if (rule.crossFileCheck) {
        const result = rule.crossFileCheck(file, fileMap.files);
        if (result) {
          findings.push({
            id: rule.id,
            name: rule.name,
            severity: rule.severity,
            category: rule.category,
            type: rule.type,
            file: file.path,
            line: 1,
            description: typeof result === 'string' ? result : rule.description,
            fix: rule.fix,
            references: rule.references || [],
            source: 'standards-check',
          });
        }
      }

      // ── Line-Level Pattern Checks ──
      if (rule.pattern) {
        for (let lineNum = 0; lineNum < allLines.length; lineNum++) {
          const line = allLines[lineNum];
          rule.pattern.lastIndex = 0;
          const match = rule.pattern.exec(line);

          if (match) {
            // Context check
            if (rule.contextCheck && !rule.contextCheck(line, lineNum, allLines)) continue;

            // Build code snippet context
            const startLine = Math.max(0, lineNum - 3);
            const endLine = Math.min(allLines.length - 1, lineNum + 3);
            const codeSnippet = allLines.slice(startLine, endLine + 1).map((l, i) => {
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
              match: match[0].substring(0, 100),
              codeSnippet,
              description: rule.description,
              fix: rule.fix,
              references: rule.references || [],
              source: 'standards-check',
            });
          }
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  return findings.filter(f => {
    const key = `${f.id}:${f.file}:${f.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { runCodingStandardsChecks, ALL_STANDARDS };
