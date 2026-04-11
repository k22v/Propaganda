import sqlite3

conn = sqlite3.connect('lms.db')
cursor = conn.cursor()

# Add new columns to courses table
try:
    cursor.execute('ALTER TABLE courses ADD COLUMN specialization VARCHAR(50)')
    print('Added specialization column')
except Exception as e:
    print(f'specialization: {e}')

try:
    cursor.execute('ALTER TABLE courses ADD COLUMN start_date TIMESTAMP')
    print('Added start_date column')
except Exception as e:
    print(f'start_date: {e}')

try:
    cursor.execute('ALTER TABLE courses ADD COLUMN end_date TIMESTAMP')
    print('Added end_date column')
except Exception as e:
    print(f'end_date: {e}')

conn.commit()
conn.close()
print('Done')