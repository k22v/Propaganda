import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'backend', 'lms.db')
if os.path.exists(db_path):
    os.remove(db_path)
    print("Old DB deleted")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create tables manually
cursor.execute('''CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    specialization VARCHAR(50),
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL,
    is_superuser BOOLEAN NOT NULL,
    avatar_id INTEGER,
    created_at DATETIME NOT NULL
)''')

cursor.execute('''CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    cover_image VARCHAR(500),
    author_id INTEGER NOT NULL,
    is_published BOOLEAN NOT NULL,
    specialization VARCHAR(50),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY(author_id) REFERENCES users(id)
)''')

cursor.execute('CREATE INDEX IF NOT EXISTS ix_courses_is_published ON courses(is_published)')
cursor.execute('CREATE INDEX IF NOT EXISTS ix_courses_author_id ON courses(author_id)')

# Sections
cursor.execute('''CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY(course_id) REFERENCES courses(id)
)''')

# Chapters
cursor.execute('''CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY,
    section_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY(section_id) REFERENCES sections(id)
)''')

# Lesson contents
cursor.execute('''CREATE TABLE IF NOT EXISTS lesson_contents (
    id INTEGER PRIMARY KEY,
    chapter_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    content TEXT,
    video_url VARCHAR(500),
    file_url VARCHAR(500),
    model_url VARCHAR(500),
    xray_image VARCHAR(500),
    hotspots_data TEXT,
    duration INTEGER,
    "order" INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY(chapter_id) REFERENCES chapters(id)
)''')

# Enrollments
cursor.execute('''CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(course_id) REFERENCES courses(id)
)''')

# All other tables...
tables = [
    '''CREATE TABLE IF NOT EXISTS lesson_progress (
        id INTEGER PRIMARY KEY,
        enrollment_id INTEGER NOT NULL,
        lesson_id INTEGER NOT NULL,
        is_completed BOOLEAN NOT NULL,
        completed_at DATETIME,
        FOREIGN KEY(enrollment_id) REFERENCES enrollments(id)
    )''',
    '''CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY,
        lesson_id INTEGER NOT NULL UNIQUE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        passing_score INTEGER NOT NULL,
        created_at DATETIME NOT NULL
    )''',
    '''CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY,
        quiz_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        question_type VARCHAR(20) NOT NULL,
        image_url VARCHAR(500),
        hotspots_json TEXT,
        "order" INTEGER NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
    )''',
    '''CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY,
        question_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        "order" INTEGER NOT NULL,
        FOREIGN KEY(question_id) REFERENCES questions(id)
    )''',
    '''CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY,
        quiz_id INTEGER NOT NULL,
        enrollment_id INTEGER NOT NULL,
        score INTEGER,
        passed BOOLEAN NOT NULL,
        answers TEXT,
        started_at DATETIME NOT NULL,
        completed_at DATETIME,
        FOREIGN KEY(quiz_id) REFERENCES quizzes(id),
        FOREIGN KEY(enrollment_id) REFERENCES enrollments(id)
    )''',
    '''CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY,
        enrollment_id INTEGER NOT NULL UNIQUE,
        certificate_number VARCHAR(50) NOT NULL UNIQUE,
        issued_at DATETIME NOT NULL,
        course_title VARCHAR(500) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        FOREIGN KEY(enrollment_id) REFERENCES enrollments(id)
    )''',
    '''CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY,
        lesson_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        parent_id INTEGER,
        created_at DATETIME NOT NULL,
        updated_at DATETIME,
        FOREIGN KEY(lesson_id) REFERENCES lesson_contents(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(parent_id) REFERENCES comments(id)
    )''',
    '''CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_default BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    )'''
]

for t in tables:
    cursor.execute(t)

conn.commit()
conn.close()
print("New database created with all columns including specialization!")