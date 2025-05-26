from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import re
from markdown import markdown
load_dotenv()
from models import db, bcrypt, User
from flask import abort
from models import Vitals,CareChatMessage



def clean_response(raw_text):
    clean_text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL)
    clean_text = re.sub(r"#.*", "", clean_text)
    clean_text = re.sub(r"\*\*(.*?)\*\*", r"\1", clean_text)
    clean_text = re.sub(r"\*(.*?)\*", r"\1", clean_text)
    clean_text = re.sub(r"\n{2,}", "\n\n", clean_text)
    return clean_text.strip()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
bcrypt.init_app(app)

with app.app_context():
    db.create_all()
    if not User.query.filter_by(username='rootadmin').first():
            root = User(name='Root Admin', username='rootadmin', role='admin')
            root.set_password('admin123')
            db.session.add(root)
            db.session.commit()
            print("✅ Root admin created with username='rootadmin' and password='admin123'")
    test_user = User.query.filter_by(username='bob').first()
    if test_user and not test_user.vitals:
        demo_vitals = Vitals(user_id=test_user.id, bp="122/78", hr=70, weight=72.5, temp=98.6)
        db.session.add(demo_vitals)
        db.session.commit()
        print("✅ Demo vitals inserted for bob")



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
    username = data.get('username')
    password = data.get('password')
    role = 'patient'

    if not all([name, username, password]):
        return jsonify({'error': 'Missing name, username, or password'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409

    user = User(name=name, username=username, role=role)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()
    print("Register endpoint hit")

    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'name': user.name,
            'username': user.username,
            'role': user.role
        }
    }), 200

@app.route('/users', methods=['GET'])
def get_users():
    auth_username = request.args.get('admin')  # rootadmin verification
    admin_user = User.query.filter_by(username=auth_username).first()

    if not admin_user or admin_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    users = User.query.all()
    user_list = [
        {
            'id': u.id,
            'name': u.name,
            'username': u.username,
            'role': u.role
        } for u in users
    ]
    return jsonify({'users': user_list}), 200


@app.route('/update-role', methods=['POST'])
def update_user_role():
    data = request.get_json()
    admin_username = data.get('admin')
    target_username = data.get('username')
    new_role = data.get('role')

    admin_user = User.query.filter_by(username=admin_username).first()
    target_user = User.query.filter_by(username=target_username).first()

    if not admin_user or admin_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    if not target_user:
        return jsonify({'error': 'User not found'}), 404

    # Only rootadmin can change admin roles
    if target_user.role == 'admin' and admin_user.username != 'rootadmin':
        return jsonify({'error': 'Only rootadmin can change other admin roles'}), 403

    target_user.role = new_role
    db.session.commit()
    return jsonify({'message': f"{target_username}'s role updated to {new_role}"}), 200

@app.route('/sonar-chat', methods=['POST'])
def sonar_chat():
    data = request.get_json()
    messages = data.get('messages', [])
    patient = data.get('patient', {})

    if not messages:
        return jsonify({'error': 'No messages provided'}), 400

    convo = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
    patient_context = (
        f"You are helping a patient named {patient.get('name', 'Bob')}, age {patient.get('age', 'unknown')}.\n"
        f"The patient has: {', '.join(patient.get('conditions', [])) or 'no known conditions'}.\n"
        f"They are prescribed: {', '.join(patient.get('medications', [])) or 'no medications'}.\n"
        f"Their latest vitals: blood pressure {patient.get('vitals', {}).get('bp', 'N/A')} and heart rate {patient.get('vitals', {}).get('hr', 'N/A')} bpm.\n\n"
        f"When responding, speak directly *to* the patient in plain, human-friendly language. Use ‘you’ instead of ‘the patient’. Keep responses to 3–4 sentences. Include source citations at the end."
    )

    full_prompt = (
        f"You are a clinical health assistant named SonarCare. Use the following patient context:\n\n"
        f"{patient_context}\n"
        f"Here is a chat history with the patient:\n\n"
        f"{convo}\n\n"
        f"Respond clearly using medical guidelines. Answer in context using the patient information.\n. "
        f"Only answer questions about their health, treatment, or monitoring setup. If off-topic, kindly redirect.\n\n"
        f"Summarize in 3–4 sentences and cite trusted sources at the end."
    )

    # 🖨️ Print final prompt for debugging
    print("📨 Final prompt to Sonar:\n", full_prompt)

    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('SONAR_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "sonar-reasoning",
                "messages": [{"role": "user", "content": full_prompt}]
            }
        )

        # 🔎 Inspect full response including <think> section
        raw_json = response.json()
        print("📬 Raw response from Sonar API:")
        print(raw_json)

        raw_answer = raw_json['choices'][0]['message']['content']
        clean_answer = clean_response(raw_answer)
        citations = raw_json.get('citations', [])

        return jsonify({'answer': clean_answer, 'citations': citations})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/update-vitals', methods=['POST'])
def update_vitals():
    data = request.get_json()
    username = data.get('username')
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not user.vitals:
        user.vitals = Vitals(user_id=user.id)

    user.vitals.bp = data.get('bp')
    user.vitals.hr = data.get('hr')
    user.vitals.weight = data.get('weight')
    user.vitals.temp = data.get('temp')
    db.session.commit()

    return jsonify({'message': 'Vitals updated successfully'}), 200

@app.route('/vitals/<username>', methods=['GET'])
def get_vitals(username):
    user = User.query.filter_by(username=username).first()
    if not user or user.role != 'patient':
        return jsonify({'error': 'Vitals are only available for patients.'}), 403

    if not user.vitals:
        return jsonify({'message': 'No vitals recorded for this patient.'}), 200

    return jsonify({
        'bp': user.vitals.bp,
        'hr': user.vitals.hr,
        'weight': user.vitals.weight,
        'temp': user.vitals.temp,
        'recorded_at': user.vitals.recorded_at.isoformat()
    }), 200


@app.route('/bored-chat', methods=['POST'])
def bored_chat():
    data = request.get_json()
    messages = data.get('messages', [])
    patient = data.get('patient', {})

    if not messages:
        return jsonify({'error': 'No messages provided'}), 400

    convo = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
    patient_context = (
        f"The user you're chatting with is named {patient.get('name', 'Bob')}, age {patient.get('age', 'unknown')}.\n"
        f"They have the following conditions: {', '.join(patient.get('conditions', [])) or 'none listed'}.\n"
        f"Their latest vitals include BP: {patient.get('vitals', {}).get('bp', 'N/A')}, HR: {patient.get('vitals', {}).get('hr', 'N/A')}.\n\n"
    )

    prompt = (
        f"You are a friendly AI assistant for bored patients. When patients are bored or anxious, you teach them fun, useful, or health-related facts in simple terms.\n\n"
        f"{patient_context}"
        f"Here is a chat history with the patient:\n\n"
        f"{convo}\n\n"
        f"Answer clearly and make the patient feel engaged. If they ask about their medical condition, respond with empathy and education. "
        f"If they ask about something random (like 'why is the sky blue'), explain it in an accessible way. Keep answers under 5 sentences and cite sources where helpful.\n"
        f"Use a human-friendly conversational tone and only site sources when necessary."
    )

    print("📨 Final prompt to Sonar (bored mode):\n", prompt)

    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('SONAR_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "sonar-reasoning",
                "messages": [{"role": "user", "content": prompt}]
            }
        )

        raw = response.json()
        print("📬 Raw Bored Chat Response:", raw)

        content = raw['choices'][0]['message']['content']
        clean = clean_response(content)
        sources = raw.get('citations', [])
        return jsonify({'answer': clean, 'citations': sources})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/care-chat', methods=['POST'])
def save_care_chat_message():
    data = request.get_json()
    username = data.get('username')
    sender = data.get('sender')  # 'user', 'nurse', or 'bot'
    content = data.get('content')

    if not all([username, sender, content]):
        return jsonify({'error': 'Missing required fields'}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    message = CareChatMessage(user_id=user.id, sender=sender, content=content)
    db.session.add(message)
    db.session.commit()

    return jsonify({'message': 'Message saved'}), 201


@app.route('/care-chat/<username>', methods=['GET'])
def get_care_chat_messages(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    messages = CareChatMessage.query.filter_by(user_id=user.id).order_by(CareChatMessage.timestamp).all()
    result = [
        {
            'sender': msg.sender,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat()
        } for msg in messages
    ]
    return jsonify({'messages': result}), 200



if __name__ == '__main__':
    print("Registered routes:")
    print(app.url_map)
    app.run(port=5000)