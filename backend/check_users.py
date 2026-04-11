import sqlite3
import os
db_path = os.path.join(os.path.dirname(__file__), 'lms.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute('SELECT id, username, email, role, is_superuser FROM users')
users = cur.fetchall()
print('Users:')
for u in users:
    print(f'  ID={u[0]}, username={u[1]}, email={u[2]}, role={u[3]}, is_superuser={u[4]}')

conn.close()
