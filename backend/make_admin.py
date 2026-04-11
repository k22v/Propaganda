import sqlite3
conn = sqlite3.connect('lms.db')
cursor = conn.cursor()
cursor.execute("UPDATE users SET role = 'admin' WHERE username = 'admin'")
conn.commit()
print('Done, rows affected:', cursor.rowcount)
conn.close()
