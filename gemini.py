import sys
import requests

api_key = "AIzaSyCvmHvTXU7icrv-pTE9Xs8b3H-HpqEzFBQ"
user_input = " ".join(sys.argv[1:])

url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
headers = {"Content-Type": "application/json"}
params = {"key": api_key}

payload = {
    "contents": [
        {"parts": [{"text": user_input}]}
    ]
}

response = requests.post(url, headers=headers, json=payload, params=params)

if response.status_code == 200:
    text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    print(text)
else:
    print(f"Error: {response.text}")
