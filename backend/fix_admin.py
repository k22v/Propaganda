import sqlite3
conn = sqlite3.connect('lms.db')
cur = conn.cursor()
cur.execute('UPDATE users SET role = "admin" WHERE username = "admin"')
conn.commit()
print('Admin role updated')
