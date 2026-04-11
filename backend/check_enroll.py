import sqlite3
conn = sqlite3.connect('lms.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM enrollments WHERE user_id = 2")
print("Enrollments for user_id=2:", cursor.fetchall())
cursor.execute("SELECT * FROM courses")
print("Courses:", cursor.fetchall())
conn.close()
