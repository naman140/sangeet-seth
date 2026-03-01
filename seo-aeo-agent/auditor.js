/**
 * SEO + AEO Agent — Auditor
 *
 * Full audit across three domains:
 *   1. Technical Foundation  — crawlability, infrastructure, rendering, performance hints
 *   2. Schema Markup         — structured data completeness & accuracy
 *   3. Content Quality       — word count, readability, AEO content signals
 *
 * SEVERITY LEVELS:
 *   critical  — Guaranteed to hurt rankings or AI citations. Fix immediately.
 *   high      — Significant impact. Fix before launch.
 *   medium    — Notable improvement available. Fix when possible.
 *   low       — Minor polish. Fix when convenient.
 *   info      — Informational only.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── REGEX DICTIONARY ─────────────────────────────────────────────────────────

const rx = {
  // Meta & head
  title:         /<title[^>]*>([\s\S]*?)<\/title>/i,
  description:   /<meta\s[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
  descAlt:       /<meta\s[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i,
  canonical:     /<link\s[^>]*rel=["']canonical["'][^>]*>/i,
  ogTitle:       /<meta\s[^>]*property=["']og:title["'][^>]*>/i,
  ogDescription: /<meta\s[^>]*property=["']og:description["'][^>]*>/i,
  ogImage:       /<meta\s[^>]*property=["']og:image["'][^>]*>/i,
  ogUrl:         /<meta\s[^>]*property=["']og:url["'][^>]*>/i,
  ogType:        /<meta\s[^>]*property=["']og:type["'][^>]*>/i,
  twitterCard:   /<meta\s[^>]*name=["']twitter:card["'][^>]*>/i,
  twitterTitle:  /<meta\s[^>]*name=["']twitter:title["'][^>]*>/i,
  twitterDesc:   /<meta\s[^>]*name=["']twitter:description["'][^>]*>/i,
  twitterImage:  /<meta\s[^>]*name=["']twitter:image["'][^>]*>/i,
  viewport:      /<meta\s[^>]*name=["']viewport["'][^>]*>/i,
  charset:       /<meta\s[^>]*charset[^>]*>/i,
  // Structure
  jsonLd:        /<script\s[^>]*type=["']application\/ld\+json["'][^>]*>/gi,
  h1:            /<h1[^>]*>([\s\S]*?)<\/h1>/gi,
  h2:            /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
  h3:            /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
  h2open:        /<h2[^>]*>/gi,
  h3open:        /<h3[^>]*>/gi,
  paragraphs:    /<p[^>]*>([\s\S]*?)<\/p>/gi,
  tables:        /<table[^>]*>/gi,
  blockquotes:   /<blockquote[^>]*>/gi,
  images:        /<img\s[^>]*>/gi,
  imgAlt:        /\balt=["'][^"']*["']/i,
  imgLazy:       /\bloading=["']lazy["']/i,
  htmlLang:      /<html\s[^>]*lang=["']([^"']*)["'][^>]*>/i,
  noIndex:       /<meta\s[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*["'][^>]*>/i,
  internalLinks: /href=["'](\/[^"'#?]*)[^"']*["']/gi,
  schemaId:      /data-schema-id=["']([^"']*)["']/g,
  // Semantic HTML5
  mainTag:       /<main[\s>]/i,
  headerTag:     /<header[\s>]/i,
  footerTag:     /<footer[\s>]/i,
  navTag:        /<nav[\s>]/i,
  articleTag:    /<article[\s>]/i,
  sectionTag:    /<section[\s>]/i,
  // Scripts
  scriptNoDefer: /<script(?![^>]*(?:defer|async|type=["']module["']))[^>]*src=["'][^"']*["'][^>]*>/gi,
  // Dates
  datePattern:   /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\b(january|february|march|april|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi,
  yearCurrent:   /\b(2025|2026)\b/,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function matchAll(html, regex) {
  const r = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  return [...html.matchAll(r)];
}

function extractContent(html, regex) {
  const m = html.match(regex);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : null;
}

/** Strip all HTML tags and script/style blocks to get plain text */
function plainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Count syllables in a word (approximate) */
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

/** Approximate Flesch Reading Ease score */
function fleschScore(text) {
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const words     = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 100;
  const syllables = words.reduce((s, w) => s + countSyllables(w), 0);
  const score = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length);
  return Math.round(Math.min(100, Math.max(0, score)));
}

// ─── ① TECHNICAL FOUNDATION CHECKS ───────────────────────────────────────────

function checkTitle(html, pageCfg, rules) {
  const issues = [];
  const title  = extractContent(html, rx.title);

  if (!title) {
    issues.push({ severity: 'critical', check: 'title-missing', message: 'No <title> tag found.' });
    return { issues, value: null };
  }
  const len = title.length;
  if (len < rules.title.minLength) {
    issues.push({ severity: 'high', check: 'title-too-short', message: `Title is ${len} chars (min ${rules.title.minLength}): "${title}"` });
  } else if (len > rules.title.maxLength) {
    issues.push({ severity: 'medium', check: 'title-too-long', message: `Title is ${len} chars (max ${rules.title.maxLength}): "${title}"` });
  }
  if (!title.includes('Sangeet')) {
    issues.push({ severity: 'medium', check: 'title-no-brand', message: 'Title does not include brand name "Sangeet".' });
  }
  return { issues, value: title };
}

function checkDescription(html, pageCfg, rules) {
  const issues = [];
  const desc   = extractContent(html, rx.description) || extractContent(html, rx.descAlt);

  if (!desc) {
    issues.push({ severity: 'critical', check: 'description-missing', message: 'No meta description found.' });
    return { issues, value: null };
  }
  const len = desc.length;
  if (len < rules.description.minLength) {
    issues.push({ severity: 'high', check: 'description-too-short', message: `Meta description is ${len} chars (min ${rules.description.minLength}).` });
  } else if (len > rules.description.maxLength) {
    issues.push({ severity: 'medium', check: 'description-too-long', message: `Meta description is ${len} chars (max ${rules.description.maxLength}).` });
  }
  return { issues, value: desc };
}

function checkCanonical(html) {
  const issues = [];
  if (!rx.canonical.test(html)) {
    issues.push({ severity: 'high', check: 'canonical-missing', message: 'No canonical link tag. Can cause duplicate content penalties.' });
  }
  return { issues, present: rx.canonical.test(html) };
}

function checkHeadings(html) {
  const issues    = [];
  const h1Matches = matchAll(html, rx.h1);
  const h1Count   = h1Matches.length;

  if (h1Count === 0) {
    issues.push({ severity: 'critical', check: 'h1-missing', message: 'No <h1> found. Every page needs exactly one H1.' });
  } else if (h1Count > 1) {
    issues.push({ severity: 'high', check: 'h1-multiple', message: `Found ${h1Count} <h1> tags — only one allowed per page.` });
  }
  const h1Text = h1Count > 0 ? h1Matches[0][1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : null;
  return { issues, h1Count, h1Text };
}

function checkOpenGraph(html) {
  const issues = [];
  const checks = [
    ['og:title',       rx.ogTitle,       'high'],
    ['og:description', rx.ogDescription, 'high'],
    ['og:image',       rx.ogImage,       'high'],
    ['og:url',         rx.ogUrl,         'medium'],
    ['og:type',        rx.ogType,        'medium'],
  ];
  const present = {};
  for (const [tag, regex, severity] of checks) {
    present[tag] = regex.test(html);
    if (!present[tag]) {
      issues.push({ severity, check: `og-${tag.replace(':', '-')}-missing`, message: `Missing <meta property="${tag}"> tag.` });
    }
  }
  return { issues, present };
}

function checkTwitterCard(html) {
  const issues  = [];
  const hasCard = rx.twitterCard.test(html);
  if (!hasCard) {
    issues.push({ severity: 'medium', check: 'twitter-card-missing', message: 'No Twitter Card meta tags. Required for rich previews on X/Twitter.' });
  } else {
    if (!rx.twitterTitle.test(html))  issues.push({ severity: 'low', check: 'twitter-title-missing',  message: 'Missing twitter:title meta tag.' });
    if (!rx.twitterImage.test(html))  issues.push({ severity: 'low', check: 'twitter-image-missing',  message: 'Missing twitter:image meta tag.' });
  }
  return { issues, present: hasCard };
}

function checkHtmlLang(html) {
  const issues = [];
  const match  = html.match(rx.htmlLang);
  if (!match) {
    issues.push({ severity: 'medium', check: 'html-lang-missing', message: 'Missing lang attribute on <html> tag.' });
  } else if (match[1] !== 'en') {
    issues.push({ severity: 'low', check: 'html-lang-unexpected', message: `lang="${match[1]}" — expected "en" for English content.` });
  }
  return { issues, lang: match ? match[1] : null };
}

function checkViewport(html) {
  const issues = [];
  if (!rx.viewport.test(html)) {
    issues.push({ severity: 'critical', check: 'viewport-missing', message: 'Missing viewport meta. Required for mobile and Core Web Vitals.' });
  }
  return { issues, present: rx.viewport.test(html) };
}

function checkNoIndex(html) {
  const issues = [];
  if (rx.noIndex.test(html)) {
    issues.push({ severity: 'critical', check: 'page-noindex', message: 'robots noindex found — page will NOT be indexed by search engines.' });
  }
  return { issues, noIndex: rx.noIndex.test(html) };
}

function checkSemanticHTML(html) {
  const issues = [];
  if (!rx.mainTag.test(html))   issues.push({ severity: 'medium', check: 'semantic-no-main',   message: 'No <main> tag. Use semantic HTML5 landmarks for accessibility and SEO.' });
  if (!rx.headerTag.test(html)) issues.push({ severity: 'low',    check: 'semantic-no-header', message: 'No <header> tag found.' });
  if (!rx.footerTag.test(html)) issues.push({ severity: 'low',    check: 'semantic-no-footer', message: 'No <footer> tag found.' });
  if (!rx.navTag.test(html))    issues.push({ severity: 'low',    check: 'semantic-no-nav',    message: 'No <nav> tag found.' });
  return { issues };
}

function checkImageLazyLoading(html) {
  const issues   = [];
  const imgTags  = matchAll(html, rx.images);
  let missingAlt  = 0;
  let missingLazy = 0;

  for (const [tag] of imgTags) {
    if (!rx.imgAlt.test(tag))  missingAlt++;
    if (!rx.imgLazy.test(tag)) missingLazy++;
  }
  if (missingAlt > 0) {
    issues.push({ severity: 'medium', check: 'images-missing-alt',  message: `${missingAlt} image(s) missing alt attributes.` });
  }
  if (missingLazy > 0 && imgTags.length > 0) {
    issues.push({ severity: 'medium', check: 'images-missing-lazy', message: `${missingLazy} image(s) missing loading="lazy". Add for faster LCP.` });
  }
  return { issues, total: imgTags.length, missingAlt, missingLazy };
}

function checkRenderBlockingScripts(html) {
  const issues  = [];
  const scripts = matchAll(html, rx.scriptNoDefer);
  const renderBlocking = scripts.filter(([tag]) => !tag.includes('defer') && !tag.includes('async'));
  if (renderBlocking.length > 0) {
    issues.push({ severity: 'medium', check: 'render-blocking-scripts', message: `${renderBlocking.length} render-blocking <script src> tag(s) without defer/async. Add defer to improve LCP.` });
  }
  return { issues, count: renderBlocking.length };
}

function checkBrokenInternalLinks(html, publicDir) {
  const issues  = [];
  const matches = matchAll(html, rx.internalLinks);
  const broken  = [];

  for (const [, href] of matches) {
    // Skip anchors, external URLs, and known routes
    if (!href || href.startsWith('http') || href.startsWith('#')) continue;

    // Resolve .html or folder/index.html
    const clean = href.replace(/\/$/, '');
    const candidates = [
      path.join(publicDir, clean),
      path.join(publicDir, clean + '.html'),
      path.join(publicDir, clean, 'index.html'),
    ];
    const exists = candidates.some(c => fs.existsSync(c));
    if (!exists) broken.push(href);
  }

  if (broken.length > 0) {
    issues.push({ severity: 'high', check: 'broken-internal-links', message: `${broken.length} broken internal link(s): ${broken.slice(0, 3).join(', ')}${broken.length > 3 ? '...' : ''}` });
  }
  return { issues, broken };
}

function checkRobotsAICrawlers(publicDir) {
  const issues       = [];
  const robotsPath   = path.join(publicDir, 'robots.txt');
  const requiredBots = ['GPTBot', 'ChatGPT-User', 'CCBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Bytespider'];

  if (!fs.existsSync(robotsPath)) {
    issues.push({ severity: 'critical', check: 'robots-missing', message: 'robots.txt not found.' });
    return { issues };
  }

  const content  = fs.readFileSync(robotsPath, 'utf8');
  const missing  = requiredBots.filter(bot => !content.includes(bot));
  if (missing.length > 0) {
    issues.push({ severity: 'high', check: 'robots-missing-ai-crawlers', message: `robots.txt missing explicit Allow for: ${missing.join(', ')}. AI crawlers need explicit permission.` });
  }

  if (!content.includes('Sitemap:')) {
    issues.push({ severity: 'medium', check: 'robots-no-sitemap', message: 'robots.txt does not reference Sitemap URL.' });
  }
  return { issues, missing };
}

function check404Page(publicDir) {
  const issues   = [];
  const path404  = path.join(publicDir, '404.html');
  if (!fs.existsSync(path404)) {
    issues.push({ severity: 'medium', check: '404-page-missing', message: 'No 404.html found. Custom 404 page improves UX and prevents indexing of dead URLs.' });
  }
  return { issues, exists: fs.existsSync(path404) };
}

function checkSSLAndCDN(config) {
  const issues = [];
  if (!config.site.url.startsWith('https://')) {
    issues.push({ severity: 'critical', check: 'ssl-not-configured', message: 'Site URL in config.js does not start with https://. Ensure SSL certificate is active.' });
  }
  // CDN is a manual check — just flag as info if URL is placeholder
  if (config.site.url.includes('placeholder') || config.site.url === 'https://sangeetseth.com') {
    issues.push({ severity: 'info', check: 'cdn-verify', message: 'Verify CDN is active (Vercel Edge Network handles this automatically on production).' });
  }
  return { issues };
}

// ─── ② SCHEMA MARKUP CHECKS ───────────────────────────────────────────────────

function checkStructuredData(html, pageName) {
  const issues  = [];
  const matches = matchAll(html, rx.jsonLd);
  const count   = matches.length;

  if (count === 0) {
    issues.push({ severity: 'critical', check: 'structured-data-missing', message: 'No JSON-LD structured data. Critical for AEO — AI engines need schema to understand this page.' });
  }
  const hasAgentSchemas = /data-schema-id=/.test(html);
  return { issues, count, hasAgentSchemas };
}

function checkSchemaOrganization(html) {
  const issues = [];
  if (!/"@type"\s*:\s*"Organization"/.test(html)) {
    issues.push({ severity: 'medium', check: 'schema-organization-missing', message: 'No Organization schema. Add publisher/Organization schema with logo for richer AI and search representation.' });
  }
  return { issues, present: /"@type"\s*:\s*"Organization"/.test(html) };
}

function checkSchemaDates(html, pageName) {
  const issues  = [];
  const isArticle = pageName.includes('blog') || pageName.includes('post') || pageName.includes('article');

  if (isArticle) {
    if (!/"datePublished"\s*:/.test(html)) {
      issues.push({ severity: 'high', check: 'schema-date-published-missing', message: 'Article page missing datePublished in schema. Required for Google News and AI citation accuracy.' });
    }
    if (!/"dateModified"\s*:/.test(html)) {
      issues.push({ severity: 'medium', check: 'schema-date-modified-missing', message: 'Article page missing dateModified in schema. Signals freshness to AI engines.' });
    }
  }
  return { issues };
}

function checkSchemaLogo(html) {
  const issues   = [];
  const hasOrg   = /"@type"\s*:\s*"Organization"/.test(html);
  const hasLogo  = /"logo"\s*:/.test(html);
  if (hasOrg && !hasLogo) {
    issues.push({ severity: 'medium', check: 'schema-logo-missing', message: 'Organization schema found but no logo property. Google uses this for Knowledge Panels.' });
  }
  return { issues };
}

function checkSchemaFAQCount(html, pageName, config) {
  const issues    = [];
  const hasFAQ    = /"@type"\s*:\s*"FAQPage"/.test(html);
  const pageHasFAQs = config.aeoFAQs && config.aeoFAQs[pageName];

  if (!hasFAQ && pageHasFAQs && pageHasFAQs.length > 0) {
    issues.push({ severity: 'critical', check: 'aeo-faq-schema-missing', message: 'FAQ schema not implemented. #1 AEO signal — AI engines directly pull Q&As from FAQPage schema.' });
    return { issues, count: 0 };
  }

  if (hasFAQ) {
    const faqQuestions = (html.match(/"@type"\s*:\s*"Question"/g) || []).length;
    if (faqQuestions < 5) {
      issues.push({ severity: 'high', check: 'faq-too-few-questions', message: `Only ${faqQuestions} FAQ question(s). Target minimum 5–10 for strong AEO coverage. Add more Q&As in config.js aeoFAQs.` });
    } else if (faqQuestions < 10) {
      issues.push({ severity: 'medium', check: 'faq-below-target', message: `${faqQuestions} FAQ question(s). Target 10+ for maximum AEO coverage.` });
    }
    return { issues, count: faqQuestions };
  }
  return { issues, count: 0 };
}

function checkSchemaArticle(html, pageName) {
  const issues = [];
  const isBlogPost = pageName !== 'blog.html' && pageName.includes('blog');
  if (isBlogPost) {
    const hasArticle = /"@type"\s*:\s*"(Article|BlogPosting|NewsArticle)"/.test(html);
    if (!hasArticle) {
      issues.push({ severity: 'high', check: 'schema-article-missing', message: 'Blog post page missing Article/BlogPosting schema. Required for Google News and AI content attribution.' });
    }
    const hasAuthorInSchema = /"author"\s*:/.test(html);
    if (!hasAuthorInSchema) {
      issues.push({ severity: 'high', check: 'schema-article-author-missing', message: 'Blog post schema missing author. Author schema is an E-E-A-T signal for AI engines.' });
    }
  }
  return { issues };
}

function checkBreadcrumbSchema(html, pageName) {
  const issues  = [];
  const isInner = pageName !== 'index.html';
  if (isInner && !/"@type"\s*:\s*"BreadcrumbList"/.test(html)) {
    issues.push({ severity: 'medium', check: 'schema-breadcrumb-missing', message: 'Inner page missing BreadcrumbList schema. Helps AI engines understand site structure.' });
  }
  return { issues };
}

// ─── ③ CONTENT QUALITY CHECKS ─────────────────────────────────────────────────

function checkWordCount(html, pageName) {
  const issues  = [];
  const text    = plainText(html);
  const words   = text.split(/\s+/).filter(w => w.length > 2);
  const count   = words.length;

  // Blog posts need 2000-4000 words; other pages just need enough content
  const isBlogPost = pageName !== 'blog.html' && pageName.includes('blog');
  if (isBlogPost) {
    if (count < 2000) {
      issues.push({ severity: 'high', check: 'word-count-low', message: `Word count is ~${count}. Blog posts should target 2,000–4,000 words for strong AEO coverage.` });
    } else if (count > 4000) {
      issues.push({ severity: 'low', check: 'word-count-high', message: `Word count is ~${count}. Over 4,000 — consider splitting into multiple focused articles.` });
    }
  } else {
    if (count < 300) {
      issues.push({ severity: 'high', check: 'word-count-thin', message: `Page has only ~${count} words. Thin content signals low value to AI engines and search.` });
    }
  }
  return { issues, wordCount: count };
}

function checkReadingEase(html) {
  const issues  = [];
  const text    = plainText(html);
  const score   = fleschScore(text);

  if (score < 60) {
    issues.push({ severity: 'medium', check: 'reading-ease-low', message: `Flesch Reading Ease score ~${score}/100 (target 60+). Content may be too complex for quick scanning. Shorten sentences.` });
  } else if (score < 70) {
    issues.push({ severity: 'low', check: 'reading-ease-medium', message: `Flesch Reading Ease ~${score}/100 (target 70–90 for marketing copy). Consider simplifying sentences.` });
  }
  return { issues, score };
}

function checkQuestionHeadings(html) {
  const issues      = [];
  const questionWords = /^(what|how|why|when|who|where|which|can|does|do|is|are|will|should|could)/i;

  const h2Matches = matchAll(html, rx.h2);
  const h3Matches = matchAll(html, rx.h3);
  const allHeadings = [...h2Matches, ...h3Matches];

  const questionHeadings = allHeadings.filter(([, text]) => {
    const clean = text.replace(/<[^>]+>/g, '').trim();
    return clean.endsWith('?') || questionWords.test(clean);
  });

  if (allHeadings.length > 2 && questionHeadings.length === 0) {
    issues.push({ severity: 'medium', check: 'no-question-headings', message: 'No question-based H2/H3 headings found. Question headings (Who/What/How/Why) directly match conversational AI queries and earn "People Also Ask" spots.' });
  }
  return { issues, total: allHeadings.length, questionCount: questionHeadings.length };
}

function checkAnswerFirstStructure(html) {
  const issues = [];
  // Check if content starts with a clear answer paragraph (not just headings or nav)
  const bodyContent = html.replace(/<(nav|header)[^>]*>[\s\S]*?<\/(nav|header)>/gi, '');
  const firstPara   = bodyContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

  if (firstPara) {
    const text = firstPara[1].replace(/<[^>]+>/g, '').trim();
    if (text.length < 50) {
      issues.push({ severity: 'low', check: 'answer-first-weak', message: 'First paragraph is too short to serve as an answer capsule. Lead with a clear, concise answer (1-3 sentences) to the main question this page addresses.' });
    }
  }
  return { issues };
}

function checkCurrentYear(html) {
  const issues = [];
  const title  = extractContent(html, rx.title) || '';
  // Check if content references the current year where freshness matters
  if (!rx.yearCurrent.test(html)) {
    issues.push({ severity: 'low', check: 'no-current-year', message: 'Current year (2025/2026) not found in page content. Adding year to titles and key sections signals freshness to AI engines.' });
  }
  return { issues };
}

function checkLastUpdatedDate(html) {
  const issues   = [];
  const hasDate  = rx.datePattern.test(html);
  if (!hasDate) {
    issues.push({ severity: 'low', check: 'no-last-updated', message: 'No visible date found on page. Adding a "Last updated" date signals freshness to AI engines and builds trust.' });
  }
  return { issues, hasDate };
}

function checkKeywordDensity(html, pageName, config) {
  const issues   = [];
  const pageCfg  = config.pages[pageName];
  if (!pageCfg || !pageCfg.keywords || pageCfg.keywords.length === 0) return { issues };

  const text      = plainText(html).toLowerCase();
  const words     = text.split(/\s+/).filter(Boolean);
  if (words.length < 50) return { issues };

  const primaryKw = pageCfg.keywords[0].toLowerCase();
  const count     = (text.match(new RegExp(primaryKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
  const density   = (count / words.length * 100).toFixed(2);

  if (count === 0) {
    issues.push({ severity: 'high', check: 'keyword-not-found', message: `Primary keyword "${primaryKw}" not found in page content.` });
  } else if (parseFloat(density) < 0.5) {
    issues.push({ severity: 'medium', check: 'keyword-density-low', message: `Primary keyword "${primaryKw}" density is ${density}% (target 1.5%+). ${count} occurrences in ${words.length} words.` });
  }
  return { issues, density, count };
}

function checkFAQSectionCount(html, pageName, config) {
  const issues     = [];
  const faqCount   = (html.match(/"@type"\s*:\s*"Question"/g) || []).length;

  if (faqCount > 0 && faqCount < 10) {
    issues.push({ severity: 'medium', check: 'faq-count-below-ten', message: `${faqCount} FAQ question(s) in schema. Add more Q&As in seo-aeo-agent/config.js → aeoFAQs["${pageName}"] to reach the target of 10.` });
  }
  return { issues, faqCount };
}

function checkTables(html, pageName) {
  const issues     = [];
  const tableCount = matchAll(html, rx.tables).length;
  const isBlogPost = pageName !== 'blog.html' && pageName.includes('blog');
  if (isBlogPost && tableCount === 0) {
    issues.push({ severity: 'low', check: 'no-tables', message: 'No <table> elements found. Comparison tables earn featured snippet placements and improve AEO answer quality.' });
  }
  return { issues, tableCount };
}

function checkExpertQuotes(html, pageName) {
  const issues      = [];
  const bqCount     = matchAll(html, rx.blockquotes).length;
  const isBlogPost  = pageName !== 'blog.html' && pageName.includes('blog');
  if (isBlogPost && bqCount === 0) {
    issues.push({ severity: 'low', check: 'no-expert-quotes', message: 'No <blockquote> elements found. Expert quotes with credentials boost E-E-A-T signals.' });
  }
  return { issues, bqCount };
}

function checkStatisticsData(html) {
  const issues = [];
  const text   = plainText(html);
  // Look for statistics: percentages, dollar amounts, specific numbers
  const statsPattern = /\d+[\.,]?\d*\s*(%|percent|x|times|\$|dollars?|k\/mo|\/month|hours?)/gi;
  const statsFound   = (text.match(statsPattern) || []).length;
  if (statsFound < 2) {
    issues.push({ severity: 'low', check: 'few-statistics', message: `Only ${statsFound} statistic(s) found. Add specific data points (%, $, timeframes) — AI engines prefer citable, data-backed claims.` });
  }
  return { issues, statsFound };
}

function checkAIGiveawayPhrases(html) {
  const issues = [];
  const text   = plainText(html).toLowerCase();

  const giveaways = [
    'delve into', 'delve deep', 'in conclusion', 'in summary', 'to summarize',
    'it\'s important to note', 'it is important to note', 'it is worth noting',
    'needless to say', 'as an ai', 'i cannot', 'i don\'t have personal',
    'certainly!', 'absolutely!', 'of course!', 'of course,',
    'multifaceted', 'in the realm of', 'dive deep', 'leverage (to use)',
    'utilize', 'comprehensive guide', 'the world of', 'based on the information provided',
    'i\'d like to', 'i would like to clarify', 'as a language model',
  ];

  const found = giveaways.filter(phrase => text.includes(phrase));
  if (found.length > 0) {
    issues.push({ severity: 'medium', check: 'ai-giveaway-phrases', message: `${found.length} AI-giveaway phrase(s) detected: "${found.slice(0, 3).join('", "')}". Replace with natural, direct language. AI-written content is penalised by AI engines for citation.` });
  }
  return { issues, found };
}

function checkParagraphLength(html) {
  const issues      = [];
  const paragraphs  = matchAll(html, rx.paragraphs);
  let longParagraphs = 0;

  for (const [, content] of paragraphs) {
    const text      = content.replace(/<[^>]+>/g, '').trim();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 4) longParagraphs++;
  }

  if (longParagraphs > 2) {
    issues.push({ severity: 'low', check: 'paragraphs-too-long', message: `${longParagraphs} paragraph(s) with 4+ sentences. Target 2–3 sentences per paragraph for better scannability and AEO answer extraction.` });
  }
  return { issues, longParagraphs };
}

function checkTableOfContents(html, pageName) {
  const issues    = [];
  const text      = plainText(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasTOC    = /table of contents|jump to section|in this article|contents:/i.test(html);

  if (wordCount > 1500 && !hasTOC) {
    issues.push({ severity: 'low', check: 'no-table-of-contents', message: `Page has ~${wordCount} words but no Table of Contents. Add a TOC for long-form content to help both users and AI engines navigate the structure.` });
  }
  return { issues, hasTOC };
}

function checkInternalLinks(html) {
  const issues   = [];
  const links    = matchAll(html, rx.internalLinks);
  const count    = links.length;
  if (count < 2) {
    issues.push({ severity: 'medium', check: 'few-internal-links', message: `Only ${count} internal link(s) found. Internal linking spreads authority and helps AI engines map related content.` });
  }
  return { issues, count };
}

// ─── AEO SIGNALS (combined) ────────────────────────────────────────────────────

function checkAEOSignals(html, pageName, config) {
  const issues = [];

  // llms.txt
  const llmsPath   = path.join(path.dirname(__dirname), 'public', 'llms.txt');
  const hasLlmsTxt = fs.existsSync(llmsPath);
  if (!hasLlmsTxt) {
    issues.push({ severity: 'high', check: 'aeo-llms-txt-missing', message: 'llms.txt not found. AI crawlers use this file as a structured site summary.' });
  }

  // Person schema on homepage
  const hasPersonSchema = /"@type"\s*:\s*"Person"/.test(html);
  if (pageName === 'index.html' && !hasPersonSchema) {
    issues.push({ severity: 'high', check: 'aeo-person-schema-missing', message: 'Person schema missing on homepage. AI engines cannot answer "Who is Sangeet?" reliably without it.' });
  }

  // Service schema on key pages
  const hasServiceSchema = /"@type"\s*:\s*"Service"/.test(html);
  if (['index.html', 'services.html'].includes(pageName) && !hasServiceSchema) {
    issues.push({ severity: 'high', check: 'aeo-service-schema-missing', message: 'Service schema missing. Needed for AI engines to surface site for service queries.' });
  }

  // E-E-A-T: author mention
  if (!/sangeet/i.test(html)) {
    issues.push({ severity: 'medium', check: 'aeo-eeat-author-missing', message: 'No author mention found. E-E-A-T (Experience, Expertise, Authority, Trust) signals are critical for AI citation.' });
  }

  return { issues };
}

// ─── SCORE CALCULATOR ─────────────────────────────────────────────────────────

function calculateScore(issues) {
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical': score -= 15; break;
      case 'high':     score -= 7;  break;
      case 'medium':   score -= 3;  break;
      case 'low':      score -= 1;  break;
      case 'info':     break;
    }
  }
  return Math.max(0, score);
}

// ─── PAGE AUDITOR ─────────────────────────────────────────────────────────────

function auditPage(pagePath, pageName, config, publicDir) {
  const html    = fs.readFileSync(pagePath, 'utf8');
  const pageCfg = config.pages[pageName] || {};
  const rules   = config.seoRules;
  const checks  = {};

  // ① Technical Foundation
  checks.title                = checkTitle(html, pageCfg, rules);
  checks.description          = checkDescription(html, pageCfg, rules);
  checks.canonical            = checkCanonical(html);
  checks.headings             = checkHeadings(html);
  checks.openGraph            = checkOpenGraph(html);
  checks.twitterCard          = checkTwitterCard(html);
  checks.htmlLang             = checkHtmlLang(html);
  checks.viewport             = checkViewport(html);
  checks.noIndex              = checkNoIndex(html);
  checks.semanticHTML         = checkSemanticHTML(html);
  checks.images               = checkImageLazyLoading(html);
  checks.renderBlocking       = checkRenderBlockingScripts(html);
  checks.internalLinks        = checkInternalLinks(html);
  checks.brokenLinks          = checkBrokenInternalLinks(html, publicDir);

  // ② Schema Markup
  checks.structuredData       = checkStructuredData(html, pageName);
  checks.schemaOrganization   = checkSchemaOrganization(html);
  checks.schemaDates          = checkSchemaDates(html, pageName);
  checks.schemaLogo           = checkSchemaLogo(html);
  checks.schemaFAQCount       = checkSchemaFAQCount(html, pageName, config);
  checks.schemaArticle        = checkSchemaArticle(html, pageName);
  checks.breadcrumbSchema     = checkBreadcrumbSchema(html, pageName);

  // ③ Content Quality
  checks.wordCount            = checkWordCount(html, pageName);
  checks.readingEase          = checkReadingEase(html);
  checks.questionHeadings     = checkQuestionHeadings(html);
  checks.answerFirst          = checkAnswerFirstStructure(html);
  checks.currentYear          = checkCurrentYear(html);
  checks.lastUpdated          = checkLastUpdatedDate(html);
  checks.keywordDensity       = checkKeywordDensity(html, pageName, config);
  checks.faqSectionCount      = checkFAQSectionCount(html, pageName, config);
  checks.tables               = checkTables(html, pageName);
  checks.expertQuotes         = checkExpertQuotes(html, pageName);
  checks.statistics           = checkStatisticsData(html);
  checks.aiGiveaways          = checkAIGiveawayPhrases(html);
  checks.paragraphLength      = checkParagraphLength(html);
  checks.tableOfContents      = checkTableOfContents(html, pageName);

  // AEO Signals
  checks.aeo                  = checkAEOSignals(html, pageName, config);

  // Aggregate issues
  const issues = [];
  Object.values(checks).forEach(c => { if (c && c.issues) issues.push(...c.issues); });

  const score = calculateScore(issues);

  return {
    pageName,
    pagePath,
    issues,
    checks,
    score,
    wordCount: checks.wordCount.wordCount,
    issueCount: {
      critical: issues.filter(i => i.severity === 'critical').length,
      high:     issues.filter(i => i.severity === 'high').length,
      medium:   issues.filter(i => i.severity === 'medium').length,
      low:      issues.filter(i => i.severity === 'low').length,
    },
  };
}

// ─── INFRASTRUCTURE AUDIT ─────────────────────────────────────────────────────

function auditInfrastructure(publicDir, config) {
  const issues     = [];
  const robotsPath  = path.join(publicDir, 'robots.txt');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  const llmsPath    = path.join(publicDir, 'llms.txt');

  if (!fs.existsSync(robotsPath)) {
    issues.push({ severity: 'critical', check: 'robots-txt-missing', message: 'robots.txt not found.' });
  } else {
    const robotsResult = checkRobotsAICrawlers(publicDir);
    issues.push(...robotsResult.issues);
  }

  if (!fs.existsSync(sitemapPath)) {
    issues.push({ severity: 'high', check: 'sitemap-xml-missing', message: 'sitemap.xml not found.' });
  }

  if (!fs.existsSync(llmsPath)) {
    issues.push({ severity: 'high', check: 'llms-txt-missing', message: 'llms.txt not found.' });
  } else {
    const content = fs.readFileSync(llmsPath, 'utf8');
    if (content.length < 300) {
      issues.push({ severity: 'medium', check: 'llms-txt-thin', message: 'llms.txt is too short. Expand with services, audience, FAQs, and social proof.' });
    }
  }

  const page404Result = check404Page(publicDir);
  issues.push(...page404Result.issues);

  const sslResult = checkSSLAndCDN(config);
  issues.push(...sslResult.issues);

  return { issues };
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

function audit(htmlFiles, config, publicDir) {
  const results = {
    pages:          {},
    infrastructure: auditInfrastructure(publicDir, config),
    summary:        { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0, averageScore: 0 },
  };

  for (const { name, path: filePath } of htmlFiles) {
    const pageResult = auditPage(filePath, name, config, publicDir);
    results.pages[name] = pageResult;
    results.summary.totalIssues += pageResult.issues.length;
    results.summary.critical    += pageResult.issueCount.critical;
    results.summary.high        += pageResult.issueCount.high;
    results.summary.medium      += pageResult.issueCount.medium;
    results.summary.low         += pageResult.issueCount.low;
  }

  results.infrastructure.issues.forEach(i => {
    results.summary.totalIssues++;
    if (results.summary[i.severity] !== undefined) results.summary[i.severity]++;
  });

  const pageScores = Object.values(results.pages).map(p => p.score);
  results.summary.averageScore = Math.round(pageScores.reduce((a, b) => a + b, 0) / pageScores.length);

  return results;
}

module.exports = { audit, auditPage, auditInfrastructure };
