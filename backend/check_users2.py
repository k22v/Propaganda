import sqlite3
conn = sqlite3.connect('lms.db')
cursor = conn.cursor()
cursor.execute("SELECT id, username, full_name, role FROM users")
print("Users:", cursor.fetchall())
conn.close()
