import sqlite3
import os
db_path = os.path.join(os.path.dirname(__file__), 'lms.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check which course each quiz belongs to
cur.execute('''
SELECT q.id, q.title, lc.id as content_id, lc.title as content_title, 
       c.id as chapter_id, s.id as section_id, s.course_id
FROM quizzes q
JOIN lesson_contents lc ON q.lesson_id = lc.id
JOIN chapters c ON lc.chapter_id = c.id
JOIN sections s ON c.section_id = s.id
''')
quizzes = cur.fetchall()
print('Quiz to Course mapping:')
for q in quizzes:
    print(f'  Quiz {q[0]}: lesson_id={q[2]}, course_id={q[6]}')

# Check enrollments
cur.execute('SELECT e.id, e.user_id, e.course_id, u.username FROM enrollments e JOIN users u ON e.user_id = u.id')
enrollments = cur.fetchall()
print('Enrollments:')
for e in enrollments:
    print(f'  User {e[1]} ({e[3]}) -> Course {e[2]}')

conn.close()
