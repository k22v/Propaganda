import sqlite3
conn = sqlite3.connect('lms.db')
c = conn.cursor()
with open('debug2.txt', 'w', encoding='utf-8') as f:
    f.write('=== SECTIONS ===\n')
    for r in c.execute('SELECT id, course_id, title FROM sections'):
        f.write(f'{r}\n')
    f.write('\n=== CHAPTERS ===\n')
    for r in c.execute('SELECT id, section_id, title FROM chapters'):
        f.write(f'{r}\n')
    f.write('\n=== LESSONS ===\n')
    for r in c.execute('SELECT id, chapter_id, title FROM lesson_contents'):
        f.write(f'{r}\n')
print('Done')
