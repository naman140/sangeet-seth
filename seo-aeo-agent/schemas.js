/**
 * SEO + AEO Agent — JSON-LD Schema Generators
 *
 * Schema.org structured data is the #1 signal both traditional search engines
 * and AI answer engines use to understand WHO you are, WHAT you do, and HOW
 * you can help users. Each generator returns a ready-to-inject JSON-LD block.
 *
 * AEO context: AI engines (ChatGPT Browse, Perplexity, Google AI Overview)
 * parse structured data to build their internal knowledge graphs. Correct
 * schema markup directly improves citation probability.
 */

'use strict';

const { site, entity, aeoFAQs } = require('./config');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function jsonLdScript(obj, id) {
  const tag = id ? ` data-schema-id="${id}"` : '';
  return `<script type="application/ld+json"${tag}>\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

// ─── WEBSITE SCHEMA ───────────────────────────────────────────────────────────
// Establishes the site as an entity with a sitelinks search box signal.

function websiteSchema() {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type':    'WebSite',
    '@id':      `${site.url}/#website`,
    name:       site.name,
    url:        site.url,
    description: site.description,
    inLanguage: site.language,
    potentialAction: {
      '@type':         'SearchAction',
      target:          `${site.url}/?s={search_term_string}`,
      'query-input':   'required name=search_term_string',
    },
    publisher: {
      '@id': `${site.url}/#person`,
    },
  }, 'schema-website');
}

// ─── PERSON SCHEMA ────────────────────────────────────────────────────────────
// Critical for AEO — this is how AI engines build a knowledge card for Sangeet.
// Without this, AI systems cannot reliably answer "Who is Sangeet Seth?"

function personSchema() {
  const sameAs = [];
  if (site.linkedIn) sameAs.push(site.linkedIn);
  if (site.twitter)  sameAs.push(`https://twitter.com/${site.twitter.replace('@', '')}`);
  sameAs.push(site.url);

  return jsonLdScript({
    '@context':    'https://schema.org',
    '@type':       'Person',
    '@id':         `${site.url}/#person`,
    name:          entity.name,
    alternateName: entity.alternateName,
    url:           site.url,
    jobTitle:      entity.jobTitle,
    description:   entity.description,
    worksFor: {
      '@type': 'Organization',
      name:    entity.affiliation,
    },
    knowsAbout: entity.knowsAbout,
    areaServed: {
      '@type': 'Country',
      name:    'United States',
    },
    contactPoint: {
      '@type':            'ContactPoint',
      email:              site.email,
      contactType:        'customer service',
      areaServed:         'US',
      availableLanguage:  'English',
    },
    sameAs,
  }, 'schema-person');
}

// ─── SERVICE SCHEMA ───────────────────────────────────────────────────────────
// Tells AI engines what service is offered, who it's for, and what it costs.
// Improves citations when users ask "who offers AI automation for coaches?"

function serviceSchema() {
  return jsonLdScript({
    '@context':   'https://schema.org',
    '@type':      'Service',
    '@id':        `${site.url}/#service`,
    name:         'Custom AI Automation Systems for Coaches',
    serviceType:  'Business Process Automation',
    description:  'Custom AI automation systems that automate lead follow-up, client onboarding, scheduling, invoicing, and reporting for high-ticket coaches and consultants in the United States. Starting from $497 after a free 30-minute audit.',
    url:          `${site.url}/services`,
    provider: {
      '@id': `${site.url}/#person`,
    },
    areaServed: {
      '@type': 'Country',
      name:    'United States',
    },
    audience: {
      '@type':    'Audience',
      name:       'High-Ticket Coaches and Consultants',
      description: 'US-based coaches and consultants generating $10,000 or more per month who spend 10+ hours weekly on repetitive admin tasks.',
    },
    offers: {
      '@type':       'Offer',
      priceCurrency: 'USD',
      price:         '497',
      priceSpecification: {
        '@type':          'PriceSpecification',
        price:            '497',
        priceCurrency:    'USD',
        description:      'Starting price. Exact investment determined after free audit.',
        eligibleQuantity: { '@type': 'QuantitativeValue', minValue: 1 },
      },
      availability:  'https://schema.org/InStock',
      url:           `${site.url}/book`,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name:    'Automation Services',
      itemListElement: [
        {
          '@type':      'Offer',
          itemOffered: {
            '@type':       'Service',
            name:          'Lead Follow-Up Automation',
            description:   'Automated lead nurturing sequences that respond instantly and follow up consistently without manual effort.',
          },
        },
        {
          '@type':      'Offer',
          itemOffered: {
            '@type':       'Service',
            name:          'Client Onboarding Automation',
            description:   'Reduces 3-hour manual onboarding processes to under 5 minutes with automated contracts, scheduling, and intake forms.',
          },
        },
        {
          '@type':      'Offer',
          itemOffered: {
            '@type':       'Service',
            name:          'Scheduling & Calendar Automation',
            description:   'Eliminates scheduling back-and-forth with automated booking systems and reminder sequences.',
          },
        },
        {
          '@type':      'Offer',
          itemOffered: {
            '@type':       'Service',
            name:          'Invoice & Reporting Automation',
            description:   'Automated invoice generation and weekly business reporting to eliminate repetitive admin tasks.',
          },
        },
      ],
    },
    review: [
      {
        '@type':       'Review',
        reviewRating:  { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
        author:        { '@type': 'Person', name: 'Jessica M.' },
        reviewBody:    'I was spending 11 hours a week on follow-ups and onboarding alone. Sangeet built me a system in 5 days. That\'s now under an hour. I used the time to take on 4 new clients. Best $1,500 I\'ve spent on my business.',
        datePublished: '2025-11-01',
      },
      {
        '@type':       'Review',
        reviewRating:  { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
        author:        { '@type': 'Person', name: 'Marcus T.' },
        reviewBody:    'My lead follow-up now runs automatically and my show-up rate for discovery calls went from 60% to 85%.',
        datePublished: '2025-12-01',
      },
      {
        '@type':       'Review',
        reviewRating:  { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
        author:        { '@type': 'Person', name: 'Rachel K.' },
        reviewBody:    'The audit call alone was worth it. Within two weeks everything was automated. I finally feel like I have a real business.',
        datePublished: '2026-01-01',
      },
    ],
    aggregateRating: {
      '@type':       'AggregateRating',
      ratingValue:   '5',
      reviewCount:   '3',
      bestRating:    '5',
      worstRating:   '1',
    },
  }, 'schema-service');
}

// ─── HOWTO SCHEMA ─────────────────────────────────────────────────────────────
// Powers "How do I get AI automation for my coaching business?" answer snippets.

function howToSchema() {
  return jsonLdScript({
    '@context':    'https://schema.org',
    '@type':       'HowTo',
    name:          'How to Get AI Automation for Your Coaching Business',
    description:   'A 4-step process to get a custom AI automation system built for your coaching or consulting business.',
    totalTime:     'P14D',
    estimatedCost: {
      '@type':    'MonetaryAmount',
      currency:   'USD',
      value:      '497',
    },
    step: [
      {
        '@type':       'HowToStep',
        position:      1,
        name:          'Book the Free Automation Audit',
        text:          'Book a free 30-minute Automation Audit call. Sangeet will examine your current workflows, tools, and identify exactly where time is being wasted — with no sales pitch.',
        url:           `${site.url}/book`,
      },
      {
        '@type':       'HowToStep',
        position:      2,
        name:          'Receive Your Custom Blueprint',
        text:          'If there is a clear ROI, you receive a detailed blueprint outlining exactly what systems will be built, the timeline, and the precise investment. Pricing starts from $497.',
      },
      {
        '@type':       'HowToStep',
        position:      3,
        name:          'System Build & Integration',
        text:          'Sangeet builds the custom automation system in the background while you continue working. Typical delivery is under 14 days. All API integrations, platform setup, and logic mapping are handled.',
      },
      {
        '@type':       'HowToStep',
        position:      4,
        name:          'Handover, Training & Support',
        text:          'A final walkthrough hands over the keys to your new system. Training materials are included, along with a minimum of 4 weeks of post-launch technical support.',
      },
    ],
  }, 'schema-howto');
}

// ─── FAQ SCHEMA ───────────────────────────────────────────────────────────────
// FAQ schema is the highest-impact AEO implementation. It directly provides
// question-answer pairs that AI engines pull for "People Also Ask" and direct
// answer generation. Every page should have contextually relevant FAQs.

function faqSchema(pageName) {
  const faqs = aeoFAQs[pageName];
  if (!faqs || faqs.length === 0) return '';

  return jsonLdScript({
    '@context':  'https://schema.org',
    '@type':     'FAQPage',
    mainEntity:  faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name:    question,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    answer,
      },
    })),
  }, 'schema-faq');
}

// ─── BREADCRUMB SCHEMA ────────────────────────────────────────────────────────

function breadcrumbSchema(pageName, pageTitle) {
  const items = [
    { position: 1, name: 'Home', item: site.url },
    { position: 2, name: pageTitle, item: `${site.url}/${pageName.replace('.html', '')}` },
  ];

  return jsonLdScript({
    '@context':      'https://schema.org',
    '@type':         'BreadcrumbList',
    itemListElement: items.map(({ position, name, item }) => ({
      '@type':  'ListItem',
      position,
      name,
      item,
    })),
  }, 'schema-breadcrumb');
}

// ─── BLOG SCHEMA ─────────────────────────────────────────────────────────────

function blogSchema() {
  return jsonLdScript({
    '@context':   'https://schema.org',
    '@type':      'Blog',
    '@id':        `${site.url}/blog/#blog`,
    name:         'AI Automation Tactics for Coaches',
    description:  'Technical breakdowns of AI tools, automation systems, and business strategies for high-ticket coaches and consultants.',
    url:          `${site.url}/blog`,
    author: {
      '@id': `${site.url}/#person`,
    },
    inLanguage:   site.language,
    about: [
      { '@type': 'Thing', name: 'AI Automation' },
      { '@type': 'Thing', name: 'Business Process Automation' },
      { '@type': 'Thing', name: 'Coaching Business Systems' },
    ],
  }, 'schema-blog');
}

// ─── ORGANIZATION SCHEMA ─────────────────────────────────────────────────────
// Publisher schema with logo — required by Google Rich Results for Articles.
// Signals brand entity to AI knowledge graphs (Organization distinct from Person).

function organizationSchema() {
  return jsonLdScript({
    '@context':   'https://schema.org',
    '@type':      'Organization',
    '@id':        `${site.url}/#organization`,
    name:         site.name,
    url:          site.url,
    logo: {
      '@type':    'ImageObject',
      url:        `${site.url}/images/logo.png`,     // CREATE: 512×512 PNG logo
      width:      512,
      height:     512,
    },
    description:  site.description,
    founder: {
      '@id': `${site.url}/#person`,
    },
    foundingDate: site.foundingYear,
    areaServed: {
      '@type': 'Country',
      name:    'United States',
    },
    contactPoint: {
      '@type':           'ContactPoint',
      email:             site.email,
      contactType:       'customer service',
      areaServed:        'US',
      availableLanguage: 'English',
    },
    sameAs: [
      site.linkedIn,
      site.url,
    ].filter(Boolean),
  }, 'schema-organization');
}

// ─── ABOUT PAGE SCHEMA ────────────────────────────────────────────────────────

function aboutPageSchema() {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type':    'AboutPage',
    '@id':      `${site.url}/about/#aboutpage`,
    name:       `About ${entity.name}`,
    url:        `${site.url}/about`,
    description: entity.description,
    mainEntity: {
      '@id': `${site.url}/#person`,
    },
  }, 'schema-aboutpage');
}

// ─── SCHEMA BUILDER ───────────────────────────────────────────────────────────
// Returns all the schema blocks for a given page as a combined string.

function buildSchemasForPage(pageName) {
  const config  = require('./config');
  const pageCfg = config.pages[pageName];
  if (!pageCfg) return '';

  const blocks = [];
  const { schemas } = pageCfg;

  if (schemas.includes('WebSite'))        blocks.push(websiteSchema());
  if (schemas.includes('Organization'))   blocks.push(organizationSchema());
  if (schemas.includes('Person'))         blocks.push(personSchema());
  if (schemas.includes('Service'))        blocks.push(serviceSchema());
  if (schemas.includes('HowTo'))          blocks.push(howToSchema());
  if (schemas.includes('FAQPage'))        blocks.push(faqSchema(pageName));
  if (schemas.includes('BreadcrumbList')) blocks.push(breadcrumbSchema(pageName, pageCfg.title));
  if (schemas.includes('Blog'))           blocks.push(blogSchema());
  if (schemas.includes('AboutPage'))      blocks.push(aboutPageSchema());

  return blocks.filter(Boolean).join('\n');
}

module.exports = {
  buildSchemasForPage,
  websiteSchema,
  organizationSchema,
  personSchema,
  serviceSchema,
  howToSchema,
  faqSchema,
  breadcrumbSchema,
  blogSchema,
  aboutPageSchema,
};
