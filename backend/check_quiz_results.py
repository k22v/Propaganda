import sqlite3
import os
db_path = os.path.join(os.path.dirname(__file__), 'lms.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check the query that's failing - admin user (id=2)
cur.execute('SELECT role, is_superuser FROM users WHERE id = 2')
admin = cur.fetchone()
print(f'Admin user: role={admin[0]}, is_superuser={admin[1]}')

# Check all quiz attempts with full join
cur.execute('''
SELECT qa.id, qa.score, qa.passed, qa.completed_at,
       u.username, u.email,
       c.id as course_id, c.title as course_title,
       s.id as section_id, s.title as section_title,
       ch.id as chapter_id, ch.title as chapter_title,
       lc.id as lesson_id, lc.title as lesson_title,
       q.id as quiz_id, q.title as quiz_title
FROM quiz_attempts qa
JOIN enrollments e ON qa.enrollment_id = e.id
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
JOIN quizzes q ON qa.quiz_id = q.id
JOIN lesson_contents lc ON q.lesson_id = lc.id
JOIN chapters ch ON lc.chapter_id = ch.id
JOIN sections s ON ch.section_id = s.id
ORDER BY qa.completed_at DESC
''')
results = cur.fetchall()
print(f'\nFound {len(results)} results:')
for r in results:
    print(f'  Attempt {r[0]}: user={r[4]}, course={r[7]}, section={r[9]}, chapter={r[11]}, lesson={r[13]}')

conn.close()
