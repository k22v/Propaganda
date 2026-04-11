import sqlite3
from datetime import datetime
conn = sqlite3.connect('lms.db')
cursor = conn.cursor()
# Enroll user 2 (dentist) in course 1
cursor.execute("INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)", (2, 1, datetime.utcnow()))
conn.commit()
print("Enrolled user 2 in course 1")
conn.close()
