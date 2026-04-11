import sqlite3
conn = sqlite3.connect('lms.db')
c = conn.cursor()
with open('output.txt', 'w', encoding='utf-8') as f:
    f.write('=== COURSES ===\n')
    for r in c.execute('SELECT id, title FROM courses'):
        f.write(str(r) + '\n')
    f.write('=== SECTIONS for course 4 ===\n')
    for r in c.execute('SELECT id, title FROM sections WHERE course_id=4'):
        f.write(str(r) + '\n')
    f.write('=== QUESTIONS COUNT ===\n')
    f.write(str(c.execute('SELECT COUNT(*) FROM questions').fetchone()) + '\n')
print('Done')
