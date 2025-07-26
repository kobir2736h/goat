import sys
import requests

api_key = "AIzaSyCvmHvTXU7icrv-pTE9Xs8b3H-HpqEzFBQ"

# ✅ Input: user_message, persona_prompt, context_string
user_message = sys.argv[1]
persona_prompt = sys.argv[2]
context_string = sys.argv[3]

# 🔢 max token (fixed for short reply)
max_tokens = 12

# 🔗 Full AI prompt
full_prompt = f"""{persona_prompt}

Chat History:
{context_string}

User: {user_message}
Sohana:"""

# 🔗 Gemini API setup
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
    trimmed = " ".join(text.split()[:max_tokens])
    print(trimmed)
else:
    print("❌ Gemini API Error:")
    print(response.text)
