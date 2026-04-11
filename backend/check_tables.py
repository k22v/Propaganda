import sqlite3

conn = sqlite3.connect('lms.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables in database:")
for table in tables:
    print(f"  {table[0]}")

# Check if we need to init DB
if 'courses' not in [t[0] for t in tables]:
    print("\nNo courses table! Need to init database.")
    from app.database import init_db
    init_db()

conn.close()