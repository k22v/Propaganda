import sqlite3
import os
db_path = os.path.join(os.path.dirname(__file__), 'lms.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get lesson contents
cur.execute('SELECT id, title FROM lesson_contents')
contents = cur.fetchall()
print('Lesson contents:')
for c in contents:
    print(f'  {c[0]}: {c[1]}')

# YouTube videos related to dentistry
videos = {
    1: "https://www.youtube.com/watch?v=9rS5sLvL7vQ",  # Introduction to dentistry
    2: "https://www.youtube.com/watch?v=BGj-zDve8nA",  # Dental anatomy
    3: "https://www.youtube.com/watch?v=1XaCjq3KJ5w",  # Dental procedures
    4: "https://www.youtube.com/watch?v=5ZwGfJZL9Q4",  # Dental instruments
    5: "https://www.youtube.com/watch?v=XOc88F-Yc4c",  # Tooth restoration
    6: "https://www.youtube.com/watch?v=KsMP1bDbnYk",  # Dental hygiene
    7: "https://www.youtube.com/watch?v=W-P7-5I0_hs",  # Dental assistant work
    8: "https://www.youtube.com/watch?v=2bR5fK3X5yE",  # Dental x-rays
}

# Update lesson contents with video URLs
for content_id, video_url in videos.items():
    cur.execute('UPDATE lesson_contents SET video_url = ? WHERE id = ?', (video_url, content_id))
    print(f'Updated content {content_id} with video')

conn.commit()

# Verify
cur.execute('SELECT id, title, video_url FROM lesson_contents WHERE video_url IS NOT NULL')
updated = cur.fetchall()
print(f'\nUpdated {len(updated)} lessons with videos')

conn.close()
print('\nDone! Videos added to course.')
