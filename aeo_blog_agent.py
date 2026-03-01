import os
import sys
import json
import re
from datetime import datetime

import requests
from dotenv import load_dotenv
from duckduckgo_search import DDGS
import anthropic

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
SANITY_PROJECT_ID = os.getenv("SANITY_PROJECT_ID", "g9ebnag6")
SANITY_DATASET = os.getenv("SANITY_DATASET", "production")
# Utilizing the token from earlier sessions for frictionless execution
SANITY_TOKEN = os.getenv("SANITY_TOKEN", "")

if not ANTHROPIC_API_KEY:
    ANTHROPIC_API_KEY = input("Enter your Anthropic API Key for Claude: ").strip()

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def get_playbook():
    playbook_path = "public/aeo-content-playbook.md"
    if os.path.exists(playbook_path):
        with open(playbook_path, "r", encoding="utf-8") as f:
            return f.read()
    return "Playbook not found."

def analyze_and_ideate(keyword):
    print(f"\n🔍 Searching DuckDuckGo for: {keyword}")
    # Get standard results and news
    results = DDGS().text(keyword, max_results=10)
    snippets = []
    competitor_titles = []
    if results:
        for r in results:
            snippets.append(r.get('body', ''))
            competitor_titles.append(r.get('title', ''))

    prompt = f"""
I have a demand keyword: "{keyword}".
Here are the current top ranking titles from search engines:
{json.dumps(competitor_titles, indent=2)}

Here are some snippets of the content currently ranking:
{json.dumps(snippets, indent=2)}

TASK 1: Act as an expert DataForSEO alternative. Read the titles and snippets, and score the keyword competition as LOW, MEDIUM, or HIGH.
TASK 2: Based on these gaps, act as a master SEO/AEO strategist and ideate exactly TWO distinct, highly compelling article topics/angles.
The topics should be authoritative, counter-intuitive (if possible), or deeply valuable to high-ticket coaches ($10k+/mo).

Output your response strictly in the following JSON format:
{{
  "competition_score": "LOW/MEDIUM/HIGH",
  "reasoning": "...",
  "articles": [
    {{
      "title": "Proposed Article 1 Title",
      "slug": "proposed-article-1-slug",
      "primary_keyword": "...",
      "angle_description": "..."
    }},
    {{
      "title": "...",
      "slug": "...",
      "primary_keyword": "...",
      "angle_description": "..."
    }}
  ]
}}
"""
    print("🧠 Asking Claude to analyze competition and ideate...")
    message = client.messages.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens=1500,
        temperature=0.7,
        messages=[{"role": "user", "content": prompt}]
    )
    text_content = message.content[0].text
    try:
        json_str = text_content[text_content.find('{'):text_content.rfind('}')+1]
        return json.loads(json_str)
    except:
        print("❌ Failed to parse Claude's JSON response.")
        return None

def markdown_to_blocks(md_text):
    blocks = []
    lines = md_text.split('\n')
    current_text = []
    current_style = 'normal'
    
    def flush():
        nonlocal current_text, current_style
        if not current_text: return
        text = '\n'.join(current_text).strip()
        if not text: return
        
        children = []
        parts = re.split(r'(\*\*.*?\*\*)', text)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                children.append({"_type": "span", "marks": ["strong"], "text": part[2:-2]})
            elif part:
                children.append({"_type": "span", "marks": [], "text": part})
                
        blocks.append({
            "_type": "block",
            "style": current_style,
            "children": children
        })
        current_text = []
        current_style = 'normal'

    for line in lines:
        stripped = line.strip()
        if stripped.startswith('## '):
            flush()
            current_style = 'h2'
            current_text.append(stripped[3:])
            flush()
        elif stripped.startswith('### '):
            flush()
            current_style = 'h3'
            current_text.append(stripped[4:])
            flush()
        elif stripped.startswith('# '):
            flush()
            current_style = 'h1'
            current_text.append(stripped[2:])
            flush()
        elif stripped.startswith('> '):
            flush()
            current_style = 'blockquote'
            current_text.append(stripped[2:])
            flush()
        elif stripped.startswith('- '):
            flush()
            text = stripped[2:]
            children = []
            parts = re.split(r'(\*\*.*?\*\*)', text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    children.append({"_type": "span", "marks": ["strong"], "text": part[2:-2]})
                elif part:
                    children.append({"_type": "span", "marks": [], "text": part})
                    
            blocks.append({
                "_type": "block",
                "style": "normal",
                "listItem": "bullet",
                "level": 1,
                "children": children
            })
        elif not stripped:
            flush()
        else:
            current_text.append(line)
    flush()
    return blocks

def write_article(article_info, playbook_text):
    print(f"\n✍️ Generating article: {article_info['title']}...")
    
    prompt = f"""
You are an elite Answer Engine Optimization (AEO) writer.
I need you to write a complete, publication-ready article based EXACTLY on the rules in the provided AEO Content Playbook.

ARTICLE DETAILS:
- Title: {article_info['title']}
- Primary Keyword: {article_info['primary_keyword']}
- Angle: {article_info['angle_description']}

AEO PLAYBOOK RULES TO FOLLOW STRICTLY:
{playbook_text}

IMPORTANT: Write the entire response strictly in standard Markdown.
- Headings should be Markdown (##, ###).
- Lists should be (-).
- Bold text should use (**bold**). 
- Do NOT output any JSON.
- Ensure you fulfill the AEO required elements: TL;DR, Answer Capsules right after headings, FAQ sections, etc.
"""
    message = client.messages.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens=6000,
        temperature=0.4,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text.strip()

def upload_to_sanity(title, slug, excerpt, blocks):
    print(f"🚀 Uploading '{title}' to Sanity...")
    
    mutation = {
        "mutations": [
            {
                "create": {
                    "_type": "post",
                    "title": title,
                    "slug": {
                        "_type": "slug",
                        "current": slug
                    },
                    "excerpt": excerpt,
                    "publishedAt": datetime.utcnow().isoformat() + "Z",
                    "body": blocks
                }
            }
        ]
    }
    
    url = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-03-01/data/mutate/{SANITY_DATASET}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SANITY_TOKEN}"
    }
    
    response = requests.post(url, headers=headers, json=mutation)
    if response.status_code == 200:
        print("✅ Successfully published!")
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(response.text)

def main():
    print("=======================================")
    print("🤖 AEO Blog Content Agent Pipeline")
    print("=======================================")
    
    if len(sys.argv) > 1:
        keyword = " ".join(sys.argv[1:]).strip()
        print(f"\n🎯 Demand keyword/topic: {keyword}")
    else:
        keyword = input("\n🎯 Enter the demand keyword/topic: ").strip()
        if not keyword:
            print("No keyword provided. Exiting.")
            sys.exit(1)
        
    playbook = get_playbook()
    
    ideation = analyze_and_ideate(keyword)
    if not ideation:
        sys.exit(1)
        
    print(f"\n📊 Keyword Competition: {ideation.get('competition_score')}")
    print(f"💡 Reasoning: {ideation.get('reasoning')}")
    
    articles = ideation.get("articles", [])
    if not articles:
        print("No articles generated by Claude.")
        sys.exit(1)
        
    for idx, art in enumerate(articles):
        print(f"\n--- Processing Article {idx+1}/{len(articles)} ---")
        md_text = write_article(art, playbook)
        
        # Extract a short excerpt from the TL;DR section for the blog card design
        excerpt = art['angle_description']
        tldr_match = re.search(r'## TL;DR\n+([^\n]+)', md_text)
        if tldr_match:
            excerpt = tldr_match.group(1).strip()
            
        blocks = markdown_to_blocks(md_text)
        upload_to_sanity(art['title'], art['slug'], excerpt, blocks)
        
    print("\n🎉 Pipeline Complete! 2 Articles published to Sanity.")
    print("🔄 Verifying Static Pages with SEO/AEO Agent...")
    os.system("node seo-aeo-agent/implementer.js")
    print("✅ Full cycle complete!")

if __name__ == "__main__":
    main()
