import sqlite3
conn = sqlite3.connect('lms.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(reviews)")
print("Reviews schema:", cursor.fetchall())
cursor.execute("SELECT * FROM reviews")
print("Reviews:", cursor.fetchall())
conn.close()
