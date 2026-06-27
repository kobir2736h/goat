import sys
import requests

# ✅ Input: user_message, persona_prompt, max_tokens
user_message = sys.argv[1]
persona_prompt = sys.argv[2]
max_tokens = int(sys.argv[3])  # ← এখানে arg থেকে token নিচ্ছি

# 🔐 Gemini API Key
api_key = "AIzaSyCvmHvTXU7icrv-pTE9Xs8b3H-HpqEzFBQ"


full_prompt = f"""{persona_prompt}

User: {user_message}
"""

# 🌐 Gemini API config
url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
headers = {"Content-Type": "application/json"}
params = {"key": api_key}
payload = {
    "contents": [
        {"parts": [{"text": full_prompt}]}
    ]
}

response = requests.post(url, headers=headers, json=payload, params=params)

if response.status_code == 200:
    text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    trimmed = " ".join(text.split()[:max_tokens])  # token অনুযায়ী কাটতেছি
    print(trimmed)
else:
    print("❌ Gemini API Error:")
    print(response.text)
