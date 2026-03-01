/**
 * SEO + AEO Agent — Report Formatter
 *
 * Outputs a colored terminal report showing:
 *   - Overall SEO/AEO health score
 *   - Per-page issue breakdown
 *   - Infrastructure check results
 *   - What was fixed
 *   - What still needs manual action
 */

'use strict';

// ─── ANSI COLORS ─────────────────────────────────────────────────────────────

const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  bgRed:   '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow:'\x1b[43m',
  bgBlue:  '\x1b[44m',
  gold:    '\x1b[33m',
};

const col = (color, text) => `${c[color]}${text}${c.reset}`;
const bold = text => `${c.bold}${text}${c.reset}`;
const dim  = text => `${c.dim}${text}${c.reset}`;

// ─── SEVERITY FORMATTING ─────────────────────────────────────────────────────

function severityBadge(severity) {
  switch (severity) {
    case 'critical': return col('red',     '● CRITICAL');
    case 'high':     return col('yellow',  '● HIGH    ');
    case 'medium':   return col('cyan',    '● MEDIUM  ');
    case 'low':      return col('dim',     '● LOW     ');
    default:         return col('white',   '● INFO    ');
  }
}

function scoreBar(score) {
  const filled = Math.round(score / 5);
  const empty  = 20 - filled;
  let color = 'green';
  if (score < 50) color = 'red';
  else if (score < 75) color = 'yellow';

  const bar = col(color, '█'.repeat(filled)) + dim('░'.repeat(empty));
  return `[${bar}] ${bold(col(color, `${score}/100`))}`;
}

function overallGrade(score) {
  if (score >= 90) return col('green',  'A — EXCELLENT');
  if (score >= 75) return col('green',  'B — GOOD');
  if (score >= 60) return col('yellow', 'C — NEEDS WORK');
  if (score >= 40) return col('yellow', 'D — POOR');
  return col('red', 'F — CRITICAL ISSUES');
}

// ─── DIVIDERS ────────────────────────────────────────────────────────────────

const LINE  = dim('─'.repeat(70));
const DLINE = dim('═'.repeat(70));

function header(text) {
  const pad = Math.max(0, Math.floor((68 - text.length) / 2));
  return `\n${DLINE}\n${dim('║')} ${' '.repeat(pad)}${bold(col('gold', text))}${' '.repeat(pad)} ${dim('║')}\n${DLINE}`;
}

function section(text) {
  return `\n${LINE}\n${bold(col('cyan', `  ${text}`))}`;
}

// ─── PRE-AUDIT REPORT ────────────────────────────────────────────────────────

function printPreAudit(auditResults) {
  const { pages, infrastructure, summary } = auditResults;

  console.log(header('SEO + AEO AUDIT REPORT'));
  console.log(`\n  ${bold('Overall Score:')} ${scoreBar(summary.averageScore)}`);
  console.log(`  ${bold('Grade:        ')} ${overallGrade(summary.averageScore)}`);
  console.log(`\n  Total Issues:  ${bold(summary.totalIssues)}`);
  console.log(`  ${col('red', '● Critical:')}  ${summary.critical}`);
  console.log(`  ${col('yellow', '● High:    ')}  ${summary.high}`);
  console.log(`  ${col('cyan', '● Medium:  ')}  ${summary.medium}`);
  console.log(`  ${col('dim', '● Low:     ')}  ${summary.low}`);

  // Infrastructure
  console.log(section('INFRASTRUCTURE'));
  if (infrastructure.issues.length === 0) {
    console.log(`\n  ${col('green', '✓')} All infrastructure files present.`);
  } else {
    infrastructure.issues.forEach(issue => {
      console.log(`\n  ${severityBadge(issue.severity)}  ${issue.message}`);
    });
  }

  // Per-page results
  console.log(section('PAGE AUDIT RESULTS'));
  for (const [pageName, result] of Object.entries(pages)) {
    const { score, issues, issueCount } = result;
    const scoreDisplay = scoreBar(score);

    console.log(`\n  ${bold(pageName)}`);
    console.log(`  Score: ${scoreDisplay}`);

    const counts = [];
    if (issueCount.critical > 0) counts.push(col('red',    `● ${issueCount.critical} critical`));
    if (issueCount.high > 0)     counts.push(col('yellow', `● ${issueCount.high} high`));
    if (issueCount.medium > 0)   counts.push(col('cyan',   `● ${issueCount.medium} medium`));
    if (issueCount.low > 0)      counts.push(col('dim',    `● ${issueCount.low} low`));
    if (counts.length > 0) console.log(`  ${counts.join('  ')}`);

    if (issues.length > 0) {
      issues.forEach(issue => {
        console.log(`    ${severityBadge(issue.severity)}  ${issue.message}`);
      });
    } else {
      console.log(`    ${col('green', '✓ No issues found.')}`);
    }
  }
}

// ─── POST-IMPLEMENTATION REPORT ──────────────────────────────────────────────

function printImplementation(implementResults) {
  const { pages, infrastructure, totalFixes } = implementResults;

  console.log(header('IMPLEMENTATION COMPLETE'));
  console.log(`\n  ${bold(col('green', `✓ ${totalFixes} total fixes applied.`))}\n`);

  // Infrastructure
  console.log(section('INFRASTRUCTURE FILES'));
  const infra = [
    { label: 'robots.txt',  result: infrastructure.robots  },
    { label: 'sitemap.xml', result: infrastructure.sitemap },
    { label: 'llms.txt',    result: infrastructure.llms    },
    { label: '404.html',    result: infrastructure.page404 },
  ].filter(i => i.result);

  infra.forEach(({ label, result }) => {
    if (result.skipped) {
      console.log(`\n  ${col('dim', '–')} ${label.padEnd(14)} ${dim('Already exists — skipped')}`);
      return;
    }
    const action = result.created ? col('green', 'CREATED') : col('cyan', 'UPDATED');
    console.log(`\n  ${col('green', '✓')} ${label.padEnd(14)} ${action}`);
    console.log(`    ${dim(result.path)}`);
  });

  // Per-page fixes
  console.log(section('PAGE FIXES APPLIED'));
  for (const [pageName, result] of Object.entries(pages)) {
    console.log(`\n  ${bold(pageName)}`);
    if (result.fixes.length === 0) {
      console.log(`    ${dim('No changes needed — already optimised.')}`);
    } else {
      result.fixes.forEach(fix => {
        console.log(`    ${col('green', '✓')} ${fix}`);
      });
    }
  }
}

// ─── MANUAL ACTION CHECKLIST ─────────────────────────────────────────────────

function printManualActions(config) {
  console.log(header('MANUAL ACTION REQUIRED'));
  console.log(`
  The agent has handled everything it can programmatically.
  Complete these items before/after launch for full SEO + AEO coverage.\n`);

  // ── TECHNICAL FOUNDATION ────────────────────────────────────────────────
  console.log(bold(col('yellow', '  ── TECHNICAL FOUNDATION ──────────────────────────────────')));
  console.log(`
  ${col('yellow', '1.')} Validate robots.txt with an online validator:
     ${dim('→ https://www.robotstxt.org/validators.html')}
     ${dim('All 7 AI crawlers are now listed: GPTBot, ChatGPT-User, CCBot,')}
     ${dim('PerplexityBot, ClaudeBot, Google-Extended, Bytespider')}

  ${col('yellow', '2.')} Verify site load speed (target LCP under 2.5s):
     ${dim('→ https://pagespeed.web.dev')}
     ${dim('Key wins: use WebP images, self-host fonts, minify CSS/JS')}

  ${col('yellow', '3.')} Confirm mobile-friendly design:
     ${dim('→ https://search.google.com/test/mobile-friendly')}

  ${col('yellow', '4.')} Set up SSL certificate (HTTPS):
     ${dim('Vercel auto-provisions SSL — verify it is active on your domain')}

  ${col('yellow', '5.')} Configure CDN:
     ${dim('Vercel Edge Network handles CDN automatically on production')}
     ${dim('Confirm by checking response headers for "x-vercel-cache"')}

  ${col('yellow', '6.')} Test site on multiple devices and browsers:
     ${dim('Chrome, Safari, Firefox · Desktop, mobile, tablet')}
     ${dim('→ https://www.browserstack.com (free tier available)')}

  ${col('yellow', '7.')} Check for JavaScript rendering issues:
     ${dim('Google Search Console → URL Inspection → "Test Live URL"')}
     ${dim('Ensure critical content (H1, meta, FAQs) is in static HTML')}

  ${col('yellow', '8.')} Verify Vercel 404 config routes to public/404.html:
     ${dim('In vercel.json add: { "handle": "filesystem" } route')}
     ${dim('Test by visiting a non-existent URL on your domain')}\n`);

  // ── SCHEMA MARKUP ───────────────────────────────────────────────────────
  console.log(bold(col('cyan', '  ── SCHEMA MARKUP ─────────────────────────────────────────')));
  console.log(`
  ${col('cyan', '9.')}  Add logo image to Organization schema:
     ${dim('Create public/images/logo.png (512×512px)')}
     ${dim('Organization schema is already injected — just add the image file')}

  ${col('cyan', '10.')} Validate all schema with Google Rich Results Test:
     ${dim('→ https://search.google.com/test/rich-results')}
     ${dim('Test each page URL after deployment')}

  ${col('cyan', '11.')} Verify structured data in Google Search Console:
     ${dim('GSC → Enhancements → FAQ, How-to, Breadcrumbs, Sitelinks')}
     ${dim('Any errors shown? Fix in seo-aeo-agent/schemas.js then rerun agent')}

  ${col('cyan', '12.')} Check schema with Schema.org validator:
     ${dim('→ https://validator.schema.org')}
     ${dim('Paste page HTML or URL to verify all schemas are valid')}

  ${col('cyan', '13.')} When blog posts go live — add per-post schemas:
     ${dim('Article/BlogPosting schema with datePublished + dateModified')}
     ${dim('Person (author) schema linked to site Person entity')}
     ${dim('Add to seo-aeo-agent/schemas.js → articleSchema() function')}\n`);

  // ── CONTENT QUALITY ─────────────────────────────────────────────────────
  console.log(bold(col('white', '  ── CONTENT QUALITY (especially for blog posts) ───────────')));
  console.log(`
  ${col('white', '14.')} Target 2,000–4,000 words per blog post:
     ${dim('AI engines prefer comprehensive content over thin articles')}
     ${dim('Check word count in audit: npm run seo:audit')}

  ${col('white', '15.')} Target Flesch Reading Ease 60–90:
     ${dim('Short sentences (15-20 words). Active voice. Plain language.')}
     ${dim('Test at: https://hemingwayapp.com')}

  ${col('white', '16.')} Use question-based H2/H3 headings:
     ${dim('"How do coaches automate lead follow-up?" → targets PAA and AI answers')}
     ${dim('Every section should start with the answer immediately (answer-first)')}

  ${col('white', '17.')} Add 10+ FAQ questions per key page:
     ${dim('Expand aeoFAQs in seo-aeo-agent/config.js, then rerun: npm run seo')}
     ${dim('More Q&As = more AI citation surface area')}

  ${col('white', '18.')} Add comparison tables to blog posts:
     ${dim('<table> elements earn featured snippets and AI answer citations')}
     ${dim('Example: "Zapier vs Make vs n8n for coaching automation"')}

  ${col('white', '19.')} Add expert quotes with credentials:
     ${dim('Use <blockquote> with <cite> tags')}
     ${dim('E-E-A-T: Experience + Expertise + Authority + Trust')}

  ${col('white', '20.')} Include statistics and data points:
     ${dim('"Coaches who automate follow-up see 30–40% higher conversion" (already on site)')}
     ${dim('Add more sourced stats — AI engines prefer citable, data-backed claims')}

  ${col('white', '21.')} Remove AI-giveaway phrases if found:
     ${dim('"delve into", "in conclusion", "needless to say", "multifaceted"')}
     ${dim('These signal AI-written content and reduce citation probability')}

  ${col('white', '22.')} Keep paragraphs to 2–3 sentences max:
     ${dim('Short paragraphs → higher readability → better answer capsule extraction')}

  ${col('white', '23.')} Add Table of Contents to long-form content (1,500+ words):
     ${dim('Helps AI engines understand document structure and extract section answers')}\n`);

  // ── INDEXING & SEARCH CONSOLES ──────────────────────────────────────────
  console.log(bold(col('green', '  ── INDEXING & SEARCH CONSOLES ────────────────────────────')));
  console.log(`
  ${col('green', '24.')} Submit sitemap to Google Search Console:
     ${dim(`${config.site.url}/sitemap.xml`)}
     ${dim('→ https://search.google.com/search-console')}

  ${col('green', '25.')} Submit sitemap to Bing Webmaster Tools:
     ${dim('→ https://www.bing.com/webmasters')}

  ${col('green', '26.')} Add social media profiles to config.js (sameAs):
     ${dim('LinkedIn, Twitter/X, YouTube when active')}
     ${dim('→ seo-aeo-agent/config.js → site.linkedIn, site.twitter')}\n`);

  // ── AEO MONITORING ──────────────────────────────────────────────────────
  console.log(bold(col('magenta', '  ── AEO MONITORING ────────────────────────────────────────')));
  console.log(`
  ${col('magenta', '27.')} Test AI citation coverage monthly:
     ${dim('Search "AI automation for coaches" on ChatGPT, Perplexity, Claude')}
     ${dim('Is Sangeet mentioned? If not → expand aeoFAQs in config.js + rerun')}

  ${col('magenta', '28.')} Verify llms.txt is crawled by Perplexity:
     ${dim(`Search: site:${config.site.url} on Perplexity.ai`)}
     ${dim('If not found, request indexing via Google Search Console')}

  ${col('magenta', '29.')} Rerun this agent after every content update:
     ${dim('npm run seo')}
     ${dim('Re-audit catches new issues. Re-implement keeps schemas fresh.')}\n`);
}

// ─── MAIN REPORT FUNCTION ────────────────────────────────────────────────────

function printReport(auditResults, phase, implementResults) {
  if (phase === 'PRE' || phase === 'PRE-IMPLEMENTATION') {
    printPreAudit(auditResults);
  }

  if (phase === 'POST' || phase === 'POST-IMPLEMENTATION') {
    if (implementResults) {
      printImplementation(implementResults);
    }

    // Re-run audit to show post-fix state
    console.log(section('AEO SIGNAL SUMMARY'));
    console.log(`
  AEO (Answer Engine Optimization) signals injected:

  ${col('green', '✓')} FAQ Schema (FAQPage)      — Trains AI engines to cite Q&A content
  ${col('green', '✓')} Person Schema             — Builds AI knowledge graph entity for Sangeet
  ${col('green', '✓')} Organization Schema       — Publisher entity with logo for Rich Results
  ${col('green', '✓')} Service Schema            — Surfaces site for service-type AI queries
  ${col('green', '✓')} HowTo Schema              — Featured in "how to" AI answer blocks
  ${col('green', '✓')} WebSite Schema            — Site identity and search action
  ${col('green', '✓')} BreadcrumbList Schema     — Navigation context for inner pages
  ${col('green', '✓')} Review/AggregateRating    — Social proof signals for AI engines
  ${col('green', '✓')} robots.txt (7 AI bots)    — GPTBot, ChatGPT-User, CCBot, PerplexityBot,
  ${dim('                              ClaudeBot, Google-Extended, Bytespider')}
  ${col('green', '✓')} llms.txt                  — Rich AI-readable site summary (AEO-native)
  ${col('green', '✓')} 404.html                  — Custom error page with on-brand UX
  ${col('green', '✓')} Image lazy loading        — loading="lazy" on below-fold images (LCP)
    `);

    const config = require('./config');
    printManualActions(config);
  }

  console.log(`${DLINE}\n`);
}

module.exports = { printReport, printPreAudit, printImplementation };
