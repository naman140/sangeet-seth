---
description: Run the complete AEO Blog Generation Pipeline
---

This workflow executes the End-to-End Answer Engine Optimization (AEO) blog pipeline natively within Antigravity, bypassing the need for external API keys (like Anthropic). Antigravity will handle the DuckDuckGo SERP research, ideation, and writing.

**How to use:** Trigger this workflow and provide the demand keyword when asked.

1. Ask the user for the demand keyword they want to target, if they haven't provided one in the prompt.
2. Read the playbook at `public/aeo-content-playbook.md` to ensure all rules are followed.
3. Run the following python command to locally search DuckDuckGo to gather competitor SERP titles and snippets:
```bash
python3 -c "from duckduckgo_search import DDGS; import json; print(json.dumps([{'title': r['title'], 'body': r['body']} for r in DDGS().text('YOUR_KEYWORD_HERE', max_results=10)], indent=2))"
```
4. Analyze the collected SERP gaps and ideate **2 distinct, highly compelling**, and counter-intuitive high-ticket angle topics.
5. Write the two full articles (2,000+ words each) and save them to `content_drafts/article_name.md`. They **MUST** strictly adhere to the playbook rules:
    - 50-character Meta Titles and 140-character Meta Descriptions.
    - Prominent `TL;DR` right under the H1.
    - H2/H3 question architectures with immediate 1-3 line direct Answer Capsules underneath.
    - Markdown tables mapped correctly with `✓` and `✗`.
    - At least 10 FAQs formatted for schema extraction.
6. Once both articles are written, upload them to Sanity by running:
// turbo
```bash
python3 upload_drafts.py
```
7. Verify the new pages using the AEO testing tool:
// turbo
```bash
node seo-aeo-agent/implementer.js
```
8. Notify the user that the pipeline is complete and the new AEO blogs are live.
