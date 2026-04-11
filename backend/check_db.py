import sqlite3

conn = sqlite3.connect('lms.db')
cursor = conn.cursor()

# Check if columns exist
cursor.execute("PRAGMA table_info(courses)")
columns = cursor.fetchall()
print("Columns in courses table:")
for col in columns:
    print(f"  {col}")

conn.close()