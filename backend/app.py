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
    if not User.query.filter_by(username='rootadmin').first():
            root = User(name='Root Admin', username='rootadmin', role='admin')
            root.set_password('admin123')
            db.session.add(root)
            db.session.commit()
            print("✅ Root admin created with username='rootadmin' and password='admin123'")

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

if __name__ == '__main__':
    print("Registered routes:")
    print(app.url_map)
    app.run(port=5000)