import requests
import json

import os
from dotenv import load_dotenv

load_dotenv()

SANITY_PROJECT_ID = "g9ebnag6"
SANITY_DATASET = "production"
SANITY_TOKEN = os.environ.get("SANITY_TOKEN", "")

def wipe_all_posts():
    # Fetch all posts
    query_url = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-03-01/data/query/{SANITY_DATASET}?query=*[_type == 'post']{{_id}}"
    headers = {
        "Authorization": f"Bearer {SANITY_TOKEN}"
    }
    res = requests.get(query_url, headers=headers)
    data = res.json()
    posts = data.get('result', [])
    
    if not posts:
        print("No posts found to delete.")
        return
        
    mutations = [{"delete": {"id": post["_id"]}} for post in posts]
    
    mutate_url = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-03-01/data/mutate/{SANITY_DATASET}"
    res = requests.post(mutate_url, headers={"Content-Type": "application/json", **headers}, json={"mutations": mutations})
    
    if res.status_code == 200:
        print(f"✅ Successfully deleted {len(mutations)} posts.")
    else:
        print(f"❌ Deletion failed: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    wipe_all_posts()
