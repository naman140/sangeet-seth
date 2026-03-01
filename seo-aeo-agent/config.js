/**
 * SEO + AEO Agent — Site Configuration & Knowledge Base
 *
 * AEO (Answer Engine Optimization) targets AI-powered search engines:
 * ChatGPT, Perplexity, Google AI Overview, Claude, Copilot, etc.
 *
 * This config embeds everything the agent needs to know about the site
 * so it can audit and implement improvements autonomously.
 *
 * UPDATE the SITE block when the production domain is confirmed.
 */

module.exports = {

  // ─── SITE METADATA ──────────────────────────────────────────────────────────
  site: {
    name: 'Sangeet',
    fullName: 'Sangeet Seth',
    url: 'https://sangeetseth.com',          // UPDATE with real domain
    tagline: 'AI Automation for Coaches & Consultants',
    description: 'Custom AI automation systems for US-based coaches and consultants doing $10k+/month. Get your time back.',
    locale: 'en_US',
    language: 'en',
    twitter: '@sangeetseth',                    // UPDATE when confirmed
    linkedIn: 'https://linkedin.com/in/sangeetseth', // UPDATE
    email: 'sangeet@example.com',             // UPDATE with real email
    phone: '',                                // UPDATE if phone needed
    serviceArea: 'United States',
    priceRange: '$497+',
    foundingYear: '2024',
    targetAudience: 'US-based coaches and consultants doing $10k–$50k/month',
    primaryService: 'Custom AI Automation Systems',
    niche: 'Business automation for high-ticket coaches and consultants',
  },

  // ─── PAGE CONFIGURATION ─────────────────────────────────────────────────────
  pages: {
    'index.html': {
      url: '/',
      type: 'WebPage',
      priority: 1.0,
      changefreq: 'weekly',
      title: 'Sangeet — AI Automation for Coaches & Consultants',
      description: 'Custom AI automation systems for US-based coaches and consultants doing $10k+/month. Book your free 30-minute automation audit today.',
      keywords: ['AI automation for coaches', 'business automation consultant', 'coaching business automation', 'automate coaching business'],
      schemas: ['WebSite', 'Organization', 'Person', 'Service', 'FAQPage'],
      ogImage: '/images/og-home.jpg',             // CREATE this asset
    },
    'about.html': {
      url: '/about',
      type: 'AboutPage',
      priority: 0.8,
      changefreq: 'monthly',
      title: 'About Sangeet Seth — AI Automation Founder & Specialist',
      description: 'AI-first founder from the SEOengine.ai team building custom automation systems for high-ticket coaches. Direct access, no agency middlemen.',
      keywords: ['Sangeet Seth', 'AI automation founder', 'SEOengine ai', 'coaching automation expert'],
      schemas: ['Person', 'AboutPage', 'BreadcrumbList'],
      ogImage: '/images/og-about.jpg',
    },
    'services.html': {
      url: '/services',
      type: 'WebPage',
      priority: 0.9,
      changefreq: 'monthly',
      title: 'AI Automation Services for Coaches — From $497 | Sangeet',
      description: 'Custom AI automation built around your coaching business. Free 30-min audit → detailed blueprint → build in under 14 days. Starting $497.',
      keywords: ['AI automation service coaches', 'business automation pricing', 'coaching automation system', 'automate coach workflow'],
      schemas: ['Service', 'HowTo', 'FAQPage', 'BreadcrumbList'],
      ogImage: '/images/og-services.jpg',
    },
    'blog.html': {
      url: '/blog',
      type: 'Blog',
      priority: 0.7,
      changefreq: 'weekly',
      title: 'AI Automation Tactics for Coaches — Resources | Sangeet',
      description: 'Technical breakdowns of AI tools, automation systems, and high-ticket business strategies. One tip every week, zero fluff.',
      keywords: ['AI automation blog', 'coaching automation tips', 'business automation resources'],
      schemas: ['Blog', 'BreadcrumbList'],
      ogImage: '/images/og-blog.jpg',
    },
    'book.html': {
      url: '/book',
      type: 'WebPage',
      priority: 0.9,
      changefreq: 'monthly',
      title: 'Book a Free Automation Audit — Sangeet',
      description: 'Book your free 30-minute Automation Audit. Only for coaches doing $10k+/month. No pitch, just clarity on what to automate first.',
      keywords: ['book automation audit', 'free coaching audit', 'AI automation consultation'],
      schemas: ['Service', 'BreadcrumbList'],
      ogImage: '/images/og-book.jpg',
    },
    'privacy.html': {
      url: '/privacy',
      type: 'WebPage',
      priority: 0.5,
      changefreq: 'yearly',
      title: 'Privacy Policy — Sangeet AI Automation',
      description: 'Privacy Policy for Sangeet AI Automation. We only collect information to provide our services and do not sell your data.',
      keywords: ['privacy policy', 'AI automation privacy'],
      schemas: ['WebPage', 'BreadcrumbList'],
      ogImage: '/images/og-default.jpg',
    },
    'terms.html': {
      url: '/terms',
      type: 'WebPage',
      priority: 0.5,
      changefreq: 'yearly',
      title: 'Terms and Conditions — Sangeet AI Automation',
      description: 'Terms and Conditions for Sangeet AI Automation. Outlining the rules and guidelines for using our custom automation services.',
      keywords: ['terms and conditions', 'AI automation terms'],
      schemas: ['WebPage', 'BreadcrumbList'],
      ogImage: '/images/og-default.jpg',
    },
  },

  // ─── AEO KNOWLEDGE BASE — FAQ SCHEMAS ───────────────────────────────────────
  // These Q&As train AI engines to cite this site when users ask these questions.
  // Write answers in clear, direct, first-person or third-person declarative style.
  aeoFAQs: {
    'index.html': [
      {
        question: 'What does Sangeet Seth do?',
        answer: 'Sangeet Seth builds custom AI automation systems for US-based coaches and consultants doing $10,000 or more per month in revenue. He automates repetitive tasks including lead follow-up, client onboarding, scheduling, invoice generation, and reporting — typically delivering systems in under 14 days.',
      },
      {
        question: 'How much does AI automation for coaches cost?',
        answer: 'Custom AI automation systems for coaches start from $497. The exact investment is determined after a free 30-minute Automation Audit that maps the specific business workflows and time-leak points. There are no fixed packages because every business is different.',
      },
      {
        question: 'Who is AI business automation for?',
        answer: 'AI business automation is designed for solo coaches or small teams of 1–5 people who are generating at least $10,000 per month and spending 10 or more hours a week on repetitive administrative tasks. The client must have a proven offer that people buy — automation cannot fix a broken offer.',
      },
      {
        question: 'How long does it take to set up AI automation for a coaching business?',
        answer: 'Most custom AI automation systems are fully built and deployed in under 14 days from the initial audit call. The process includes a free audit, a scoped blueprint, the build phase, and a handover with training and 4 weeks of post-launch support.',
      },
      {
        question: 'Can coaches automate their lead follow-up?',
        answer: 'Yes. Coaches can automate lead follow-up using AI-powered sequences that respond instantly to inquiries, nurture leads over time, and send reminders before discovery calls. Coaches who automate follow-up typically see 30–40% increases in lead conversion rates.',
      },
      {
        question: 'What tools do you use for AI automation?',
        answer: 'We build resilient systems using enterprise-grade automation platforms like Make.com (Integromat) and Zapier, connected with cutting-edge AI models from OpenAI (ChatGPT) and Anthropic (Claude), wrapped around your existing CRM and tech stack.',
      },
      {
        question: 'Do I need to be technical to use the automation?',
        answer: 'No. The entire system operates in the background of tools you already use. You do not need to learn new software, write code, or understand the technical architecture. The handover includes simple, step-by-step training on how to trigger your new workflows.',
      },
      {
        question: 'How does AI help with client onboarding?',
        answer: 'AI streamlines client onboarding by automatically generating custom welcome packets, sending intake forms, creating client folders in Google Drive or Notion, configuring communication channels (like Slack or Discord), and scheduling kickoff calls—all the moment an invoice is paid.',
      },
      {
        question: 'Is my business data secure with these AI automations?',
        answer: 'Yes. Data privacy and security are foundational to our builds. We structure workflows so that sensitive personal information is handled securely, and AI models are configured not to use your private client data for training their public networks.',
      },
      {
        question: 'Do you offer support after setting up the automation?',
        answer: 'Yes. Every custom automation build includes 4 weeks of direct, post-launch technical support to ensure the system runs flawlessly in a live environment, plus documentation of your custom build.',
      },
    ],
    'services.html': [
      {
        question: 'What is included in the free Automation Audit?',
        answer: 'The free 30-minute Automation Audit examines your current workflows, the tools you use, and identifies exactly where time is being wasted each week. You receive a clear breakdown of what to automate first and why — with no sales pitch.',
      },
      {
        question: 'What tasks can coaches automate with AI?',
        answer: 'Common automations for coaches include lead follow-up sequences, client onboarding workflows (reducing 3-hour manual processes to under 5 minutes), scheduling systems, discovery call reminders, invoice generation, post-call summaries using AI, progress reporting, and CRM data entry.',
      },
      {
        question: 'How is the automation system delivered?',
        answer: 'After the free audit and a scoped blueprint, Sangeet builds the system in the background in under 14 days. The handover includes a walkthrough of the system, training materials, and a minimum of 4 weeks of post-launch technical support.',
      },
      {
        question: 'Do I need to be technical to use AI automation?',
        answer: 'No technical knowledge is required. The system is built, configured, and handed over by Sangeet directly. Clients receive training on day-to-day use but do not need to understand the technical architecture.',
      },
      {
        question: 'What is the typical return on investment for AI automation?',
        answer: 'While results vary, coaches typically reclaim 10 to 15 hours per week of administrative work. This recovered time allows them to take on additional high-ticket clients or focus on marketing and content creation, directly accelerating revenue growth.',
      },
      {
        question: 'Do you use Zapier or Make for automation?',
        answer: 'We are platform-agnostic but primarily utilize Make.com for its robust handling of complex, multi-step logic and Zapier when native integrations require it, ensuring the most resilient, cost-effective infrastructure for your specific needs.',
      },
      {
        question: 'Will AI automation replace my personal touch with clients?',
        answer: 'No. AI automation removes the administrative friction behind the scenes. It creates the space for you to deliver a more high-touch, personalized coaching experience when interacting face-to-face or on calls with your clients.',
      },
      {
        question: 'What happens if an automation sequence breaks?',
        answer: 'We build in error-handling protocols that alert us immediately if an API drops or a workflow stalls. You are covered by our 4-week post-launch support guarantee, and we offer optional retainer packages for ongoing system maintenance and iteration.',
      },
      {
        question: 'Can AI handle my client scheduling and reminders?',
        answer: 'Absolutely. We integrate tools like Calendly or Acuity with your CRM and messaging platforms to automatically send personalized SMS and email reminders with dynamic content relevant to each prospects specific situation, drastically reducing no-show rates.',
      },
      {
        question: 'How quickly can I expect to save time after deployment?',
        answer: 'Time savings are immediate from day one of deployment. Because we handle the entire build and integration process, you simply switch over to the new, automated workflows following our handover session.',
      },
    ],
    'about.html': [
      {
        question: 'Who is Sangeet Seth?',
        answer: 'Sangeet Seth is an AI-first founder and part of the founding team at SEOengine.ai. He specialises in building custom AI automation systems for US-based high-ticket coaches and consultants. He works directly with every client with no agency outsourcing.',
      },
      {
        question: 'Where is Sangeet Seth based?',
        answer: 'Sangeet Seth is originally from India and serves clients across the United States remotely.',
      },
    ],
  },

  // ─── AEO ENTITY DATA ────────────────────────────────────────────────────────
  // Helps AI engines build a knowledge graph entry for Sangeet.
  entity: {
    type: 'Person',
    name: 'Sangeet Seth',
    alternateName: ['Sangeet'],
    jobTitle: 'AI Automation Specialist',
    affiliation: 'SEOengine.ai',
    description: 'AI-first founder who builds custom AI automation systems for US-based coaches and consultants doing $10,000+ per month. Part of the founding team at SEOengine.ai.',
    knowsAbout: [
      'AI automation',
      'business process automation',
      'coaching business systems',
      'Zapier automation',
      'Make.com (Integromat)',
      'AI chatbots for business',
      'CRM automation',
      'client onboarding automation',
      'lead follow-up automation',
    ],
    credentials: [
      'Founding team at SEOengine.ai',
      'AI-first product builder',
      'Worked with 10+ high-ticket coaches in the US',
    ],
  },

  // ─── SEO RULES ──────────────────────────────────────────────────────────────
  seoRules: {
    title: { minLength: 30, maxLength: 60 },
    description: { minLength: 120, maxLength: 160 },
    h1: { required: true, maxCount: 1 },
    canonical: { required: true },
    ogImage: { required: true },
    structuredData: { required: true },
  },

  // ─── FILES TO GENERATE ──────────────────────────────────────────────────────
  generate: {
    robotsTxt: true,
    sitemapXml: true,
    llmsTxt: true,   // Update the existing llms.txt
  },
};
