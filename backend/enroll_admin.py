import sqlite3
import os
db_path = os.path.join(os.path.dirname(__file__), 'lms.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check if admin is enrolled in course 2
cur.execute('SELECT * FROM enrollments WHERE user_id = 2 AND course_id = 2')
existing = cur.fetchone()
print('Existing enrollment for admin in course 2:', existing)

if not existing:
    from datetime import datetime
    cur.execute('INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (2, 2, ?)', (datetime.utcnow(),))
    conn.commit()
    print('Added admin to course 2')
else:
    print('Admin already enrolled in course 2')

# Verify
cur.execute('SELECT e.id, e.user_id, e.course_id, u.username FROM enrollments e JOIN users u ON e.user_id = u.id')
enrollments = cur.fetchall()
print('All enrollments:')
for e in enrollments:
    print(f'  User {e[1]} ({e[3]}) -> Course {e[2]}')

conn.close()
