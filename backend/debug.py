import sqlite3
conn = sqlite3.connect('lms.db')
c = conn.cursor()
with open('courses.txt', 'w', encoding='utf-8') as f:
    f.write('All courses:\n')
    for r in c.execute('SELECT id, title, is_published, author_id FROM courses'):
        f.write(f'{r}\n')
    f.write('\nChapters for course 4:\n')
    for r in c.execute('SELECT id, title, section_id FROM chapters WHERE section_id IN (SELECT id FROM sections WHERE course_id=4)'):
        f.write(f'{r}\n')
print('Done')
