from datetime import datetime
import sqlite3
from app.auth import get_password_hash

conn = sqlite3.connect('lms.db')
cursor = conn.cursor()
now = datetime.now().isoformat()

# Get admin ID
cursor.execute("SELECT id FROM users WHERE username = 'admin' LIMIT 1")
admin_id = cursor.fetchone()[0]

users = [
    ("student1", "student1@test.com", "Student One", "student123"),
    ("student2", "student2@test.com", "Student Two", "student123"),
    ("student3", "student3@test.com", "Student Three", "student123"),
    ("teacher1", "teacher1@test.com", "Teacher One", "teacher123"),
]

for username, email, full_name, password in users:
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO users (email, username, hashed_password, full_name, specialization, role, is_active, is_superuser, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            email,
            username,
            get_password_hash(password),
            full_name,
            None,
            "student" if "student" in username else "teacher",
            1,
            0,
            now
        ))
        print(f'Created user: {username}')

conn.commit()
print('All users created!')
conn.close()
