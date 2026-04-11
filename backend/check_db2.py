import sqlite3
conn = sqlite3.connect('lms.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cursor.fetchall()]
print("Tables:", tables)
if 'reviews' in tables:
    cursor.execute("SELECT * FROM reviews")
    print("Reviews:", cursor.fetchall())
conn.close()
