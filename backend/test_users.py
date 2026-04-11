import sys
sys.path.insert(0, 'C:/Users/ADMIN/Downloads/lms-platform/lms-platform/backend')
import sqlite3
import bcrypt

conn = sqlite3.connect('C:/Users/ADMIN/Downloads/lms-platform/lms-platform/backend/lms.db')
cur = conn.cursor()
cur.execute("SELECT id, username, hashed_password FROM users")
users = cur.fetchall()
print("Users:", users)

for user in users:
    print(f"\nUser: {user[1]}")
    print(f"Hash: {user[2][:50]}...")
    
    # Check if it's a valid bcrypt hash
    try:
        if bcrypt.checkpw(b'admin123', user[2].encode('utf-8')):
            print("Password 'admin123' matches!")
        else:
            print("Password 'admin123' does NOT match")
    except Exception as e:
        print(f"Error checking password: {e}")
