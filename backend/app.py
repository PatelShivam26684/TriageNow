from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import re
from markdown import markdown
load_dotenv()


def clean_response(raw_text):
    # Remove <think> sections
    clean_text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL)

    # Remove markdown headers (###, **, etc.)
    clean_text = re.sub(r"#.*", "", clean_text)  # strip headers
    clean_text = re.sub(r"\*\*(.*?)\*\*", r"\1", clean_text)  # bold
    clean_text = re.sub(r"\*(.*?)\*", r"\1", clean_text)  # italic
    clean_text = re.sub(r"\n{2,}", "\n\n", clean_text)  # normalize spacing

    return markdown(clean_text.strip())

app = Flask(__name__)
CORS(app)

SONAR_API_KEY = os.getenv("SONAR_API_KEY")
print("Loaded SONAR_API_KEY:", SONAR_API_KEY)

@app.route('/triage', methods=['POST'])
def triage():
    data = request.get_json()
    symptoms = data.get('symptoms', '')
    medications = data.get('medications', [])

    prompt = (
        f"A patient reports the following symptoms: {symptoms}. "
        f"They have access to: {', '.join(medications)}. "
        f"Give a friendly, plain-English triage recommendation: "
        f"Should they stay home, go to urgent care, or visit the ER? "
        f"Summarize clearly in less than 5 sentences, then include sources as a list at the end."
    )

    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {SONAR_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "sonar-reasoning",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )

        # Debugging info
        print("Status Code:", response.status_code)
        print("Raw Response Text:", response.text)

        resp_json = response.json()
        print("Parsed JSON:", resp_json)

        raw_answer = resp_json['choices'][0]['message']['content']
        print("Extracted Answer:", raw_answer)

        answer = clean_response(raw_answer)
        sources = resp_json.get('citations', [])
        return jsonify({"answer": answer, "citations": sources}), response.status_code

    except Exception as e:
        import traceback
        print("ERROR:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)