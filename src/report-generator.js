/**
 * HTML Report Generator
 * ======================
 * Generates a self-contained, professional HTML report
 * with all CSS/JS inline. No external dependencies needed.
 */

const fs = require('fs');
const path = require('path');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateHTMLReport(findings, config) {
  const { repoPath, branch, scope, stack, fileMap, model } = config;
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Compute Statistics
  const stats = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length,
    security: findings.filter(f => f.category === 'security').length,
    quality: findings.filter(f => f.category === 'quality').length,
    performance: findings.filter(f => f.category === 'performance').length,
    accessibility: findings.filter(f => f.category === 'accessibility').length,
    reactSsr: findings.filter(f => f.category === 'react-ssr').length,
    codingStandards: findings.filter(f => f.category === 'coding-standards').length,
  };

  const riskScore = Math.min(10, Math.ceil(
    (stats.critical * 3 + stats.high * 2 + stats.medium * 1 + stats.low * 0.3) / Math.max(1, fileMap.totalFiles / 10)
  ));

  const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
  const sortedFindings = [...findings].sort((a, b) =>
    severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );
  const topFixes = sortedFindings.slice(0, 5);

  const byFile = {};
  for (const f of findings) {
    if (!byFile[f.file]) byFile[f.file] = [];
    byFile[f.file].push(f);
  }

  function severityColor(sev) {
    const map = { critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#2563eb', info: '#6b7280' };
    return map[sev] || '#6b7280';
  }
  function severityIcon(sev) {
    const map = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', info: '⚪' };
    return map[sev] || '⚪';
  }
  function severityBg(sev) {
    const map = { critical: '#2a1515', high: '#2a1f15', medium: '#2a2615', low: '#152030', info: '#1a1a1f' };
    return map[sev] || '#1a1a1f';
  }

  function renderIssue(issue, index) {
    const color = severityColor(issue.severity);
    const icon = severityIcon(issue.severity);
    const bg = severityBg(issue.severity);
    return `
      <div class="issue-card" style="border-left: 4px solid ${color}; background: ${bg};" id="issue-${index}">
        <div class="issue-header">
          <span class="severity-badge" style="background: ${color};">${icon} ${issue.severity.toUpperCase()}</span>
          <span class="issue-type-badge">${escapeHtml(issue.type || issue.category)}</span>
          <span class="issue-id">${escapeHtml(issue.id || '')}</span>
        </div>
        <h4 class="issue-title">${escapeHtml(issue.name)}</h4>
        <p class="issue-file">📄 <code>${escapeHtml(issue.file)}${issue.line ? ':' + issue.line : ''}</code></p>
        <p class="issue-desc">${escapeHtml(issue.description)}</p>
        ${(issue.codeSnippet || issue.vulnerableCode) ? `<div class="code-section"><h5>❌ Vulnerable / Problematic Code:</h5><pre><code>${escapeHtml(issue.codeSnippet || issue.vulnerableCode)}</code></pre></div>` : ''}
        ${issue.fixedCode ? `<div class="code-section fix-section"><h5>✅ Fixed Code:</h5><pre><code>${escapeHtml(issue.fixedCode)}</code></pre></div>` : ''}
        ${issue.explanation ? `<div class="explanation"><h5>💡 Why This Fix Works:</h5><p>${escapeHtml(issue.explanation)}</p></div>` : ''}
        ${(issue.fix && !issue.fixedCode) ? `<div class="explanation"><h5>🔧 Recommended Fix:</h5><p>${escapeHtml(issue.fix)}</p></div>` : ''}
        ${(issue.references && issue.references.length > 0) ? `<div class="references"><h5>📚 References:</h5><ul>${issue.references.map(r => '<li>' + escapeHtml(r) + '</li>').join('')}</ul></div>` : ''}
        <div class="issue-meta"><span>Source: ${issue.source === 'ai-analysis' ? '🤖 AI Analysis' : issue.source === 'standards-check' ? '📏 Standards Check' : '🔍 Local Scan'}</span></div>
      </div>`;
  }

  // Build HTML
  const parts = [];
  parts.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Code Review Report — ${escapeHtml(path.basename(repoPath))} — ${dateStr}</title>
<style>
:root{--bg:#0f172a;--surface:#1e293b;--surface-2:#334155;--text:#e2e8f0;--text-muted:#94a3b8;--accent:#38bdf8;--accent-2:#818cf8;--success:#4ade80;--danger:#f87171;--warning:#fbbf24;--border:#475569}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
.report-header{background:linear-gradient(135deg,#1e293b 0%,#0f172a 50%,#1e1b4b 100%);padding:40px;border-bottom:1px solid var(--border)}
.report-header h1{font-size:28px;font-weight:700;margin-bottom:8px;background:linear-gradient(90deg,var(--accent),var(--accent-2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.report-header .subtitle{color:var(--text-muted);font-size:14px}
.report-meta{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}
.meta-item{background:var(--surface-2);padding:8px 16px;border-radius:8px;font-size:13px}
.meta-item strong{color:var(--accent)}
.nav-bar{position:sticky;top:0;z-index:100;background:var(--surface);padding:12px 40px;border-bottom:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap}
.nav-btn{background:var(--surface-2);color:var(--text);border:1px solid var(--border);padding:6px 16px;border-radius:6px;cursor:pointer;font-size:13px;transition:all .2s}
.nav-btn:hover,.nav-btn.active{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.content{padding:40px;max-width:1200px;margin:0 auto}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:32px}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;text-align:center}
.stat-card .number{font-size:36px;font-weight:800;line-height:1}
.stat-card .label{color:var(--text-muted);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.risk-meter{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:32px}
.risk-bar-bg{width:100%;height:24px;background:var(--surface-2);border-radius:12px;overflow:hidden;margin-top:12px}
.risk-bar-fill{height:100%;border-radius:12px}
.section{margin-bottom:40px}
.section-title{font-size:22px;font-weight:700;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid var(--border);display:flex;align-items:center;gap:10px}
.section-count{background:var(--accent);color:var(--bg);font-size:13px;font-weight:700;padding:2px 10px;border-radius:12px}
.issue-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:16px}
.issue-header{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.severity-badge{color:white;padding:3px 12px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.issue-type-badge{background:var(--surface-2);color:var(--accent);padding:3px 10px;border-radius:6px;font-size:11px}
.issue-id{color:var(--text-muted);font-size:11px;font-family:monospace}
.issue-title{font-size:16px;font-weight:600;margin-bottom:8px}
.issue-file{font-size:13px;color:var(--accent);margin-bottom:8px}
.issue-file code{background:var(--surface-2);padding:2px 6px;border-radius:4px}
.issue-desc{color:var(--text-muted);font-size:14px;margin-bottom:16px}
.code-section{margin-bottom:16px}
.code-section h5{font-size:13px;font-weight:600;margin-bottom:8px;color:var(--danger)}
.fix-section h5{color:var(--success)!important}
pre{background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:16px;overflow-x:auto;font-size:13px;line-height:1.5}
code{font-family:'Fira Code','JetBrains Mono',Consolas,monospace;color:#e6edf3}
.explanation,.references{margin-top:12px}
.explanation h5,.references h5{font-size:13px;font-weight:600;margin-bottom:6px;color:var(--accent-2)}
.explanation p{font-size:14px;color:var(--text-muted)}
.references ul{list-style:none;padding:0}
.references li{font-size:12px;color:var(--text-muted);padding:2px 0}
.references li::before{content:'→ ';color:var(--accent)}
.issue-meta{margin-top:12px;padding-top:8px;border-top:1px solid var(--border);font-size:11px;color:var(--text-muted)}
.top-fixes{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:32px}
.top-fix-item{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)}
.top-fix-item:last-child{border-bottom:none}
.fix-number{background:var(--accent);color:var(--bg);width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}
.fix-detail h5{font-size:14px;margin-bottom:2px}
.fix-detail p{font-size:12px;color:var(--text-muted)}
.file-summary-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.file-summary-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px}
.file-summary-card h5{font-size:13px;color:var(--accent);word-break:break-all}
.file-issues-count{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.mini-badge{font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600}
.matrix-table{width:100%;border-collapse:collapse;font-size:13px}
.matrix-table th{background:var(--surface-2);padding:10px 12px;text-align:left;border-bottom:2px solid var(--border);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
.matrix-table td{padding:10px 12px;border-bottom:1px solid var(--border)}
.matrix-table tr:hover{background:var(--surface-2)}
.filter-bar{display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap}
.filter-btn{background:var(--surface-2);color:var(--text-muted);border:1px solid var(--border);padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;transition:all .2s}
.filter-btn:hover,.filter-btn.active{background:var(--accent);color:var(--bg);border-color:var(--accent)}
@media print{body{background:#fff;color:#000}.nav-bar,.filter-bar{display:none}.issue-card{break-inside:avoid;border:1px solid #ccc}pre{background:#f5f5f5}}
@media(max-width:768px){.content{padding:16px}.report-header{padding:24px}.stats-grid{grid-template-columns:repeat(3,1fr)}}
</style>
</head>
<body>`);

  // Header
  parts.push(`
<div class="report-header">
  <h1>🔍 Code Review &amp; Security Analysis Report</h1>
  <p class="subtitle">Automated analysis by SFCC/PWA Code Reviewer — ETG Digital</p>
  <div class="report-meta">
    <div class="meta-item">📁 <strong>Repository:</strong> ${escapeHtml(path.basename(repoPath))}</div>
    <div class="meta-item">🌿 <strong>Branch:</strong> ${escapeHtml(branch || 'current')}</div>
    <div class="meta-item">🎯 <strong>Scope:</strong> ${escapeHtml(scope)}</div>
    <div class="meta-item">🛠️ <strong>Stack:</strong> ${escapeHtml(stack.join(', '))}</div>
    <div class="meta-item">🤖 <strong>Model:</strong> ${escapeHtml(model)}</div>
    <div class="meta-item">📅 <strong>Date:</strong> ${escapeHtml(dateStr)}</div>
    <div class="meta-item">📊 <strong>Files:</strong> ${fileMap.totalFiles} (${fileMap.totalLines.toLocaleString()} lines)</div>
  </div>
</div>`);

  // Nav
  parts.push(`
<div class="nav-bar">
  <button class="nav-btn active" onclick="scrollToSection('summary')">Executive Summary</button>
  <button class="nav-btn" onclick="scrollToSection('security')">Security</button>
  <button class="nav-btn" onclick="scrollToSection('standards')">Coding Standards</button>
  <button class="nav-btn" onclick="scrollToSection('quality')">Code Quality</button>
  <button class="nav-btn" onclick="scrollToSection('performance')">Performance</button>
  ${stats.reactSsr > 0 ? '<button class="nav-btn" onclick="scrollToSection(\'react-ssr\')">React/SSR</button>' : ''}
  <button class="nav-btn" onclick="scrollToSection('files')">By File</button>
  <button class="nav-btn" onclick="scrollToSection('matrix')">Priority Matrix</button>
  <button class="nav-btn" onclick="window.print()">🖨️ Print</button>
</div>
<div class="content">`);

  // Executive Summary
  const riskColor = riskScore >= 7 ? '#dc2626' : riskScore >= 4 ? '#ca8a04' : '#4ade80';
  const riskGrad = riskScore >= 7 ? '#dc2626, #ef4444' : riskScore >= 4 ? '#ca8a04, #eab308' : '#22c55e, #4ade80';
  const riskMsg = riskScore >= 7 ? '⚠️ High Risk — Critical issues require immediate attention before deployment.' :
    riskScore >= 4 ? '🟡 Moderate Risk — Several issues should be addressed before deployment.' :
    '✅ Low Risk — Minor issues found. Good overall code health.';

  parts.push(`
<div class="section" id="summary">
  <h2 class="section-title">📋 Executive Summary</h2>
  <div class="stats-grid">
    <div class="stat-card"><div class="number" style="color:var(--text)">${stats.total}</div><div class="label">Total Issues</div></div>
    <div class="stat-card"><div class="number" style="color:#dc2626">${stats.critical}</div><div class="label">Critical</div></div>
    <div class="stat-card"><div class="number" style="color:#ea580c">${stats.high}</div><div class="label">High</div></div>
    <div class="stat-card"><div class="number" style="color:#ca8a04">${stats.medium}</div><div class="label">Medium</div></div>
    <div class="stat-card"><div class="number" style="color:#2563eb">${stats.low}</div><div class="label">Low</div></div>
    <div class="stat-card"><div class="number" style="color:#6b7280">${stats.info}</div><div class="label">Info</div></div>
  </div>
  <div class="risk-meter">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h4>Risk Score</h4>
      <span style="font-size:28px;font-weight:800;color:${riskColor}">${riskScore}/10</span>
    </div>
    <div class="risk-bar-bg"><div class="risk-bar-fill" style="width:${riskScore*10}%;background:linear-gradient(90deg,${riskGrad})"></div></div>
    <p style="color:var(--text-muted);font-size:13px;margin-top:8px">${riskMsg}</p>
  </div>`);

  // Top fixes
  if (topFixes.length > 0) {
    parts.push(`<div class="top-fixes"><h4 style="margin-bottom:16px">🎯 Top ${Math.min(5, topFixes.length)} Priority Fixes</h4>`);
    topFixes.forEach((fix, i) => {
      const idx = sortedFindings.indexOf(fix);
      parts.push(`<div class="top-fix-item"><div class="fix-number">${i+1}</div><div class="fix-detail"><h5><a href="#issue-${idx}" style="color:var(--text);text-decoration:none">${escapeHtml(fix.name)}</a></h5><p>${escapeHtml(fix.file)}${fix.line ? ':' + fix.line : ''} — ${escapeHtml(fix.severity.toUpperCase())} ${escapeHtml(fix.type || '')}</p></div></div>`);
    });
    parts.push('</div>');
  }

  // Category breakdown
  parts.push(`
  <div class="stats-grid" style="margin-top:20px">
    <div class="stat-card"><div class="number" style="color:var(--danger)">🔒 ${stats.security}</div><div class="label">Security</div></div>
    <div class="stat-card"><div class="number" style="color:var(--accent)">🧹 ${stats.quality}</div><div class="label">Quality</div></div>
    <div class="stat-card"><div class="number" style="color:var(--warning)">⚡ ${stats.performance}</div><div class="label">Performance</div></div>
    <div class="stat-card"><div class="number" style="color:var(--accent-2)">♿ ${stats.accessibility}</div><div class="label">Accessibility</div></div>
    <div class="stat-card"><div class="number" style="color:#a78bfa">📏 ${stats.codingStandards}</div><div class="label">Standards</div></div>
  </div>
</div>`);

  // Security Section
  const securityFindings = sortedFindings.filter(f => f.category === 'security');
  parts.push(`
<div class="section" id="security">
  <h2 class="section-title">🔒 Security Vulnerabilities <span class="section-count">${stats.security}</span></h2>
  ${stats.security === 0 ? '<p style="color:var(--text-muted)">No security issues detected. ✅</p>' : ''}
  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterIssues('security','all',this)">All</button>
    <button class="filter-btn" onclick="filterIssues('security','critical',this)">🔴 Critical</button>
    <button class="filter-btn" onclick="filterIssues('security','high',this)">🟠 High</button>
    <button class="filter-btn" onclick="filterIssues('security','medium',this)">🟡 Medium</button>
  </div>
  <div id="security-issues">${securityFindings.map((f) => renderIssue(f, sortedFindings.indexOf(f))).join('')}</div>
</div>`);

  // Coding Standards Section
  const standardsFindings = sortedFindings.filter(f => f.category === 'coding-standards');
  // Group standards by type for sub-sections
  const standardsByType = {};
  standardsFindings.forEach(f => {
    const t = f.type || 'General';
    if (!standardsByType[t]) standardsByType[t] = [];
    standardsByType[t].push(f);
  });
  const standardsTypeOrder = ['Naming Convention', 'Documentation', 'Import Standard', 'Error Handling', 'React Architecture', 'React / SSR', 'React Bug', 'React UX', 'SFRA Security', 'Architecture', 'Performance', 'Accessibility', 'CSS Standard', 'Testing', 'Maintainability'];

  parts.push(`
<div class="section" id="standards">
  <h2 class="section-title">📏 Coding Standards Violations <span class="section-count">${stats.codingStandards}</span></h2>
  ${stats.codingStandards === 0 ? '<p style="color:var(--text-muted)">All coding standards met. Excellent work! ✅</p>' : `
  <p style="color:var(--text-muted);margin-bottom:20px">These violations must be fixed before PR approval. Each issue includes the standard being violated and a corrected code example.</p>
  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterIssues('standards','all',this)">All (${stats.codingStandards})</button>
    ${Object.entries(standardsByType).map(([type, items]) =>
      '<button class="filter-btn" onclick="filterByType(\'standards\',\'' + type.replace(/'/g, "\\'") + '\',this)">' + type + ' (' + items.length + ')</button>'
    ).join('')}
  </div>`}
  <div id="standards-issues">${standardsFindings.map((f) => renderIssue(f, sortedFindings.indexOf(f))).join('')}</div>
</div>`);

  // Quality Section
  const qualityFindings = sortedFindings.filter(f => f.category === 'quality');
  parts.push(`
<div class="section" id="quality">
  <h2 class="section-title">🧹 Code Quality Issues <span class="section-count">${stats.quality}</span></h2>
  ${stats.quality === 0 ? '<p style="color:var(--text-muted)">No quality issues detected. ✅</p>' : ''}
  <div id="quality-issues">${qualityFindings.map((f) => renderIssue(f, sortedFindings.indexOf(f))).join('')}</div>
</div>`);

  // Performance Section
  const perfFindings = sortedFindings.filter(f => f.category === 'performance');
  parts.push(`
<div class="section" id="performance">
  <h2 class="section-title">⚡ Performance Issues <span class="section-count">${stats.performance}</span></h2>
  ${stats.performance === 0 ? '<p style="color:var(--text-muted)">No performance issues detected. ✅</p>' : ''}
  <div id="performance-issues">${perfFindings.map((f) => renderIssue(f, sortedFindings.indexOf(f))).join('')}</div>
</div>`);

  // React/SSR Section
  if (stats.reactSsr > 0) {
    const ssrFindings = sortedFindings.filter(f => f.category === 'react-ssr');
    parts.push(`
<div class="section" id="react-ssr">
  <h2 class="section-title">⚛️ React / SSR Hydration Issues <span class="section-count">${stats.reactSsr}</span></h2>
  <div id="reactssr-issues">${ssrFindings.map((f) => renderIssue(f, sortedFindings.indexOf(f))).join('')}</div>
</div>`);
  }

  // By File
  parts.push(`
<div class="section" id="files">
  <h2 class="section-title">📂 Issues by File <span class="section-count">${Object.keys(byFile).length} files</span></h2>
  <div class="file-summary-grid">`);

  Object.entries(byFile).forEach(([filePath, issues]) => {
    const crit = issues.filter(i => i.severity === 'critical').length;
    const hi = issues.filter(i => i.severity === 'high').length;
    const med = issues.filter(i => i.severity === 'medium').length;
    const lo = issues.filter(i => i.severity === 'low').length;
    parts.push(`
    <div class="file-summary-card">
      <h5>📄 ${escapeHtml(filePath)}</h5>
      <div class="file-issues-count">
        ${crit ? '<span class="mini-badge" style="background:#dc2626;color:#fff">🔴 ' + crit + '</span>' : ''}
        ${hi ? '<span class="mini-badge" style="background:#ea580c;color:#fff">🟠 ' + hi + '</span>' : ''}
        ${med ? '<span class="mini-badge" style="background:#ca8a04;color:#fff">🟡 ' + med + '</span>' : ''}
        ${lo ? '<span class="mini-badge" style="background:#2563eb;color:#fff">🔵 ' + lo + '</span>' : ''}
        <span class="mini-badge" style="background:var(--surface-2);color:var(--text-muted)">Total: ${issues.length}</span>
      </div>
    </div>`);
  });
  parts.push('</div></div>');

  // Priority Matrix
  parts.push(`
<div class="section" id="matrix">
  <h2 class="section-title">📊 Implementation Priority Matrix</h2>
  <table class="matrix-table">
    <thead><tr><th>#</th><th>Severity</th><th>Issue</th><th>File</th><th>Type</th><th>Complexity</th></tr></thead>
    <tbody>`);

  sortedFindings.forEach((f, i) => {
    const complexity = (f.severity === 'critical' || f.severity === 'high') ? 'Medium' :
      (f.fixedCode && f.fixedCode.split('\n').length > 10) ? 'Complex' : 'Simple';
    parts.push(`
      <tr>
        <td>${i+1}</td>
        <td><span class="severity-badge" style="background:${severityColor(f.severity)}">${f.severity.toUpperCase()}</span></td>
        <td><a href="#issue-${i}" style="color:var(--accent)">${escapeHtml(f.name)}</a></td>
        <td><code style="font-size:11px">${escapeHtml(f.file)}${f.line ? ':' + f.line : ''}</code></td>
        <td>${escapeHtml(f.type || f.category)}</td>
        <td>${complexity}</td>
      </tr>`);
  });
  parts.push('</tbody></table></div>');

  // Checklist
  parts.push(`
<div class="section" id="checklist">
  <h2 class="section-title">✅ Pre-Deployment Checklist</h2>
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px">
    <div style="column-count:2;column-gap:32px">
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> All critical issues resolved</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> All high severity issues resolved</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> Security headers verified</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> No hardcoded secrets in code</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> Input validation on all endpoints</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> Error handling verified</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> SSR hydration tested</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> Performance benchmarks met</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> CORS configuration reviewed</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> Console.log statements removed</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> Dependencies up to date</label>
      <label style="display:block;padding:6px 0;cursor:pointer"><input type="checkbox"> Cross-browser testing done</label>
    </div>
  </div>
</div>`);

  // Footer
  parts.push(`
<div style="text-align:center;padding:40px 0;border-top:1px solid var(--border);margin-top:40px">
  <p style="color:var(--text-muted);font-size:13px">
    Generated by <strong style="color:var(--accent)">SFCC/PWA Code Reviewer</strong> — ETG Digital<br>
    ${escapeHtml(timestamp)} · ${fileMap.totalFiles} files · ${stats.total} findings
  </p>
</div>
</div>

<script>
function scrollToSection(id){
  var el=document.getElementById(id);
  if(el){el.scrollIntoView({behavior:'smooth',block:'start'});
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active')});
  if(event&&event.target)event.target.classList.add('active')}
}
function filterIssues(section,severity,btn){
  var container=document.getElementById(section+'-issues');
  if(!container)return;
  var cards=container.querySelectorAll('.issue-card');
  cards.forEach(function(card){
    if(severity==='all'){card.style.display=''}
    else{var badge=card.querySelector('.severity-badge');
    if(badge&&badge.textContent.trim().toLowerCase().indexOf(severity)!==-1){card.style.display=''}
    else{card.style.display='none'}}
  });
  btn.parentElement.querySelectorAll('.filter-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
}
function filterByType(section,type,btn){
  var container=document.getElementById(section+'-issues');
  if(!container)return;
  var cards=container.querySelectorAll('.issue-card');
  cards.forEach(function(card){
    var typeBadge=card.querySelector('.issue-type-badge');
    if(typeBadge&&typeBadge.textContent.trim()===type){card.style.display=''}
    else{card.style.display='none'}
  });
  btn.parentElement.querySelectorAll('.filter-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
}
</script>
</body></html>`);

  const html = parts.join('');

  // Write to file
  const reportDir = path.join(repoPath, 'code-review-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportFileName = 'code-review-' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19) + '.html';
  const reportPath = path.join(reportDir, reportFileName);

  fs.writeFileSync(reportPath, html, 'utf-8');
  return reportPath;
}

module.exports = { generateHTMLReport };
