import sys
sys.path.insert(0, 'C:/Users/ADMIN/Downloads/lms-platform/lms-platform/backend')
import sqlite3
import bcrypt
from app.auth import verify_password

conn = sqlite3.connect('C:/Users/ADMIN/Downloads/lms-platform/lms-platform/backend/lms.db')
cur = conn.cursor()
cur.execute("SELECT id, username, hashed_password FROM users")
users = cur.fetchall()

for user in users:
    print(f"User: {user[1]}")
    result = verify_password("admin123", user[2])
    print(f"verify_password('admin123', hash): {result}")
    
    # Also test with bcrypt directly
    try:
        result2 = bcrypt.checkpw(b'admin123', user[2].encode('utf-8'))
        print(f"bcrypt.checkpw: {result2}")
    except Exception as e:
        print(f"bcrypt error: {e}")
