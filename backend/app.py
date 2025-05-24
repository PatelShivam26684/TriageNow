from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import re
from markdown import markdown
load_dotenv()
from models import db, bcrypt, User



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
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
bcrypt.init_app(app)

with app.app_context():
    db.create_all()
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

@app.route('/register', methods=['POST'])
def register():
    print("✅ /register endpoint was hit!")
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'patient')

    if not all([name, email, password]):
        return jsonify({'error': 'Missing name, email, or password'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(name=name, email=email, role=role)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()
    print("Register endpoint hit")

    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    }), 200

if __name__ == '__main__':
    print("Registered routes:")
    print(app.url_map)
    app.run(port=5000)