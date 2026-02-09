/**
 * Repository Scanner
 * ==================
 * Scans the repository, maps file structure, reads code files,
 * and categorizes them by type/framework.
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// File extension to category mapping
const FILE_CATEGORIES = {
  // React / PWA Kit
  '.jsx': 'react-component',
  '.tsx': 'react-component',
  // JavaScript / TypeScript
  '.js': 'javascript',
  '.ts': 'typescript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  // SFRA / ISML
  '.isml': 'isml-template',
  '.ds': 'sfcc-script',
  // Styles
  '.css': 'stylesheet',
  '.scss': 'stylesheet',
  '.less': 'stylesheet',
  // Config
  '.json': 'config',
  '.yaml': 'config',
  '.yml': 'config',
  '.env': 'env-file',
  '.properties': 'config',
  // Other
  '.html': 'html',
  '.xml': 'xml',
};

// Stack-specific file patterns
const STACK_PATTERNS = {
  'pwa-react': ['**/*.jsx', '**/*.tsx', '**/*.js', '**/*.ts', '**/*.css', '**/*.scss'],
  'sfra': ['**/*.isml', '**/*.ds', '**/*.js', '**/*.json', '**/controllers/**', '**/models/**', '**/scripts/**'],
  'nodejs': ['**/*.js', '**/*.ts', '**/*.mjs', '**/*.json'],
  'express': ['**/*.js', '**/*.ts', '**/routes/**', '**/middleware/**', '**/controllers/**'],
};

// Max file size to read (500KB) — skip huge files
const MAX_FILE_SIZE = 500 * 1024;

// Max lines per file to send to AI (to manage token limits)
const MAX_LINES_FOR_AI = 500;

/**
 * Scan the repository and build a structured file map.
 */
async function scanRepository(repoPath, options = {}) {
  const { filePatterns = [], excludePaths = [], stack = [] } = options;

  // Build glob patterns
  let patterns = [];
  if (filePatterns.length > 0) {
    patterns = filePatterns;
  } else {
    // Use stack-specific patterns
    const stackPatternSets = stack.map(s => STACK_PATTERNS[s] || []);
    patterns = [...new Set(stackPatternSets.flat())];
    if (patterns.length === 0) {
      patterns = ['**/*.{js,jsx,ts,tsx,isml,ds,json,css,scss}'];
    }
  }

  // Also always include env and config files for security scanning
  patterns.push('**/.env*', '**/config/**', '**/*.properties');

  // Build ignore patterns
  const ignorePatterns = excludePaths.map(p => `**/${p}/**`);
  ignorePatterns.push('**/node_modules/**', '**/.git/**', '**/package-lock.json', '**/yarn.lock');

  // Find all matching files
  const allFiles = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: repoPath,
      ignore: ignorePatterns,
      nodir: true,
      absolute: false,
      dot: true,
    });
    allFiles.push(...matches);
  }

  // Deduplicate
  const uniqueFiles = [...new Set(allFiles)].sort();

  // Read and categorize files
  const files = [];
  let totalLines = 0;
  const categorySet = new Set();

  for (const relPath of uniqueFiles) {
    const absPath = path.join(repoPath, relPath);
    const ext = path.extname(relPath).toLowerCase();
    const category = FILE_CATEGORIES[ext] || 'other';

    try {
      const stats = fs.statSync(absPath);
      if (stats.size > MAX_FILE_SIZE) continue; // Skip huge files
      if (stats.size === 0) continue; // Skip empty files

      // Check if binary
      const buffer = Buffer.alloc(512);
      const fd = fs.openSync(absPath, 'r');
      const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
      fs.closeSync(fd);
      const isBinary = buffer.slice(0, bytesRead).includes(0);
      if (isBinary) continue;

      const content = fs.readFileSync(absPath, 'utf-8');
      const lines = content.split('\n');
      totalLines += lines.length;
      categorySet.add(category);

      files.push({
        path: relPath,
        absPath,
        ext,
        category,
        content,
        lines: lines.length,
        size: stats.size,
        // Truncated version for AI (to manage token limits)
        contentForAI: lines.length > MAX_LINES_FOR_AI
          ? lines.slice(0, MAX_LINES_FOR_AI).join('\n') + `\n// ... truncated (${lines.length - MAX_LINES_FOR_AI} more lines)`
          : content,
      });
    } catch (err) {
      // Skip unreadable files
      continue;
    }
  }

  // Build summary
  const categorySummary = {};
  for (const file of files) {
    if (!categorySummary[file.category]) {
      categorySummary[file.category] = { count: 0, lines: 0, files: [] };
    }
    categorySummary[file.category].count++;
    categorySummary[file.category].lines += file.lines;
    categorySummary[file.category].files.push(file.path);
  }

  return {
    repoPath,
    totalFiles: files.length,
    totalLines,
    categories: [...categorySet],
    categorySummary,
    files,
  };
}

/**
 * Chunk files into batches for AI analysis.
 * Each batch stays under a token estimate (~100K tokens max).
 */
function chunkFilesForAnalysis(fileMap, maxCharsPerBatch = 200000) {
  const batches = [];
  let currentBatch = [];
  let currentSize = 0;

  // Prioritize: security-sensitive files first, then by category
  const priorityOrder = ['env-file', 'config', 'sfcc-script', 'isml-template', 'react-component', 'javascript', 'typescript', 'stylesheet', 'other'];

  const sortedFiles = [...fileMap.files].sort((a, b) => {
    const aPriority = priorityOrder.indexOf(a.category);
    const bPriority = priorityOrder.indexOf(b.category);
    return aPriority - bPriority;
  });

  for (const file of sortedFiles) {
    const fileSize = file.contentForAI.length;

    if (currentSize + fileSize > maxCharsPerBatch && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentSize = 0;
    }

    currentBatch.push(file);
    currentSize += fileSize;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

module.exports = { scanRepository, chunkFilesForAnalysis };
