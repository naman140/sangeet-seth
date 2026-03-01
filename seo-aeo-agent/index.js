#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║          SEO + AEO AUDIT & IMPLEMENTATION AGENT                     ║
 * ║          For: Sangeet — AI Automation for Coaches & Consultants     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * USAGE:
 *   node seo-aeo-agent/index.js           — Full audit + auto-implement
 *   node seo-aeo-agent/index.js --audit   — Audit only, no changes
 *   node seo-aeo-agent/index.js --dry-run — Same as --audit
 *
 * WHAT THIS AGENT DOES:
 *
 * SEO (Search Engine Optimization):
 *   ✓ Audits title tags, meta descriptions, heading structure
 *   ✓ Checks and injects canonical URLs
 *   ✓ Adds Open Graph meta tags (og:image, og:url, og:type)
 *   ✓ Adds Twitter/X Card meta tags
 *   ✓ Verifies viewport and charset meta
 *   ✓ Checks for noindex directives
 *   ✓ Generates robots.txt
 *   ✓ Generates sitemap.xml
 *
 * AEO (Answer Engine Optimization — for ChatGPT, Perplexity, Google AI, etc.):
 *   ✓ Injects FAQPage schema (Q&A pairs AI engines use directly)
 *   ✓ Injects Person schema (knowledge graph entry for Sangeet)
 *   ✓ Injects Service schema (surfaces site for service queries)
 *   ✓ Injects HowTo schema (step-by-step process for AI answers)
 *   ✓ Injects WebSite schema with SearchAction
 *   ✓ Injects BreadcrumbList schema for inner pages
 *   ✓ Injects Review/AggregateRating schema
 *   ✓ Updates llms.txt (AI-native site summary for crawlers)
 *   ✓ Configures robots.txt to explicitly allow AI crawlers
 *
 * All changes are idempotent — run this agent as many times as needed.
 * Re-run after any major content update.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const config      = require('./config');
const { audit }   = require('./auditor');
const { implement } = require('./implementer');
const { printReport } = require('./report');

// ─── PATHS ───────────────────────────────────────────────────────────────────

const ROOT_DIR   = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// ─── ARGS ────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--audit') || args.includes('--dry-run');

// ─── COLORS ──────────────────────────────────────────────────────────────────

const bold  = s => `\x1b[1m${s}\x1b[0m`;
const cyan  = s => `\x1b[36m${s}\x1b[0m`;
const green = s => `\x1b[32m${s}\x1b[0m`;
const gold  = s => `\x1b[33m${s}\x1b[0m`;
const dim   = s => `\x1b[2m${s}\x1b[0m`;

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`
${bold(gold('╔══════════════════════════════════════════════════════════════════════╗'))}
${bold(gold('║'))}  ${bold('SEO + AEO AGENT')} ${dim('— Sangeet AI Automation Website')}                      ${bold(gold('║'))}
${bold(gold('╚══════════════════════════════════════════════════════════════════════╝'))}

  ${cyan('Mode:')}    ${DRY_RUN ? bold('AUDIT ONLY (no changes will be made)') : bold('FULL RUN (audit + implement)')}
  ${cyan('Target:')}  ${dim(PUBLIC_DIR)}
  ${cyan('Time:')}    ${dim(new Date().toLocaleString())}
`);

  // ── 1. Discover HTML files ───────────────────────────────────────────────
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error(`\x1b[31m✗ public/ directory not found at: ${PUBLIC_DIR}\x1b[0m`);
    process.exit(1);
  }

  const htmlFiles = fs.readdirSync(PUBLIC_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => ({ name: f, path: path.join(PUBLIC_DIR, f) }));

  if (htmlFiles.length === 0) {
    console.error('\x1b[31m✗ No HTML files found in public/\x1b[0m');
    process.exit(1);
  }

  console.log(`  ${green('✓')} Found ${bold(htmlFiles.length)} HTML page(s): ${htmlFiles.map(f => f.name).join(', ')}\n`);

  // ── 2. Audit ─────────────────────────────────────────────────────────────
  console.log(`  ${cyan('→')} Running SEO + AEO audit...\n`);
  const auditResults = audit(htmlFiles, config, PUBLIC_DIR);

  // ── 3. Print pre-implementation report ───────────────────────────────────
  printReport(auditResults, 'PRE');

  // ── 4. Implement (unless --audit / --dry-run flag) ───────────────────────
  if (DRY_RUN) {
    console.log(`\n  ${gold('ℹ')}  Dry-run mode — no files were modified.\n`);
    console.log(`  Run ${bold('node seo-aeo-agent/index.js')} without flags to apply all fixes.\n`);
    return;
  }

  console.log(`\n  ${cyan('→')} Implementing fixes...\n`);
  const implementResults = implement(htmlFiles, auditResults, config, PUBLIC_DIR);

  // ── 5. Print post-implementation report ──────────────────────────────────
  printReport(auditResults, 'POST', implementResults);

  // ── 6. Done ──────────────────────────────────────────────────────────────
  console.log(`  ${green(bold('✓ Agent complete.'))} All automated SEO + AEO fixes have been applied.\n`);
  console.log(`  ${dim('Next steps: review the MANUAL ACTION REQUIRED section above.')}\n`);
}

run().catch(err => {
  console.error('\x1b[31m✗ Agent failed:\x1b[0m', err.message);
  console.error(err.stack);
  process.exit(1);
});
