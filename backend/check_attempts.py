import sqlite3
import os
db_path = os.path.join(os.path.dirname(__file__), 'lms.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check quiz attempts
cur.execute('SELECT id, quiz_id, enrollment_id, score, passed, answers, completed_at FROM quiz_attempts')
attempts = cur.fetchall()
print(f'Quiz attempts: {len(attempts)}')
for a in attempts:
    print(f'  Attempt {a[0]}: quiz_id={a[1]}, enrollment_id={a[2]}, score={a[3]}, passed={a[4]}')

# Check if user has taken a quiz
cur.execute('''
SELECT qa.id, qa.score, qa.passed, u.username, c.title, lc.title, q.title
FROM quiz_attempts qa
JOIN enrollments e ON qa.enrollment_id = e.id
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
JOIN quizzes q ON qa.quiz_id = q.id
JOIN lesson_contents lc ON q.lesson_id = lc.id
''')
results = cur.fetchall()
print(f'Results: {len(results)}')
for r in results:
    print(f'  {r}')

conn.close()
