import sqlite3
conn = sqlite3.connect('lms.db')
cursor = conn.cursor()
cursor.execute('ALTER TABLE users ADD COLUMN last_login TIMESTAMP')
conn.commit()
print('Column added')
conn.close()