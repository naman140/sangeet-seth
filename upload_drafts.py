import os
import re
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SANITY_PROJECT_ID = "g9ebnag6"
SANITY_DATASET = "production"
SANITY_TOKEN = os.environ.get("SANITY_TOKEN", "")

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
        elif stripped.startswith('**Meta Title:**') or stripped.startswith('**Meta Description:**'):
            # Rule: Do not include metadata in the body UI
            continue
        elif stripped.startswith('---'):
            # Rule: Do not include markdown hr in UI
            continue
        elif stripped.startswith('**Word Count:**'):
            # Rule: Stop parsing when we hit performance metrics
            break
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
        elif stripped.startswith('| '):
            # Table logic: Sanity native portable text doesn't support complex tables out of the box,
            # so we'll render it as a blockquote or normal text for now as a fallback
            current_text.append(line)
        elif not stripped:
            flush()
        else:
            current_text.append(line)
    flush()
    return blocks

def upload_to_sanity(title, slug, excerpt, blocks):
    print(f"🚀 Uploading '{title}' to Sanity...")
    
    # Rule: Prevent Duplicate Blogs by using createOrReplace with explicit ID
    post_id = f"post-{slug}"
    mutation = {
        "mutations": [
            {
                "createOrReplace": {
                    "_id": post_id,
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

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    title_match = re.search(r'# (.+)', content)
    title = title_match.group(1).strip() if title_match else os.path.basename(filepath)
    
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    
    excerpt = ""
    tldr_match = re.search(r'## TL;DR\n+([^\n]+)', content)
    if tldr_match:
        excerpt = tldr_match.group(1).strip()
        
    blocks = markdown_to_blocks(content)
    upload_to_sanity(title, slug, excerpt, blocks)

if __name__ == "__main__":
    drafts_dir = "content_drafts"
    if not os.path.exists(drafts_dir):
        print("No content_drafts directory found.")
    else:
        for filename in os.listdir(drafts_dir):
            if filename.endswith(".md"):
                filepath = os.path.join(drafts_dir, filename)
                print(f"\nProcessing {filename}...")
                process_file(filepath)
