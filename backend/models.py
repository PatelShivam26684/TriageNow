from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

# Create instances of SQLAlchemy and Bcrypt
db = SQLAlchemy()
bcrypt = Bcrypt()

VALID_ROLES = ['patient', 'care_team', 'admin']
# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(10), nullable=False)  # 'patient' or 'admin'

    # Password checking
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')



