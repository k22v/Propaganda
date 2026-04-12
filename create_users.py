import sys
sys.stdout.reconfigure(encoding='utf-8')
import bcrypt
import sqlite3

conn = sqlite3.connect('backend/lms.db')
cursor = conn.cursor()

# Delete all users
cursor.execute('DELETE FROM users')
print('Deleted all users')

# Create admin (superuser)
admin_password = bcrypt.hashpw('123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
cursor.execute('''
    INSERT INTO users (username, email, hashed_password, is_active, is_superuser, role, specialization, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', ('admin', 'admin@propaganda-dv.ru', admin_password, 1, 1, 'admin', '', '2026-04-12T00:00:00'))
print('Created admin (superuser)')

# Create dentist
dentist_password = bcrypt.hashpw('123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
cursor.execute('''
    INSERT INTO users (username, email, hashed_password, is_active, is_superuser, role, specialization, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', ('dentist', 'dentist@propaganda-dv.ru', dentist_password, 1, 0, 'dentist', 'dentist', '2026-04-12T00:00:00'))
print('Created dentist')

# Create assistant
assistant_password = bcrypt.hashpw('123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
cursor.execute('''
    INSERT INTO users (username, email, hashed_password, is_active, is_superuser, role, specialization, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', ('assistant', 'assistant@propaganda-dv.ru', assistant_password, 1, 0, 'assistant', 'assistant', '2026-04-12T00:00:00'))
print('Created assistant')

# Create technician
technician_password = bcrypt.hashpw('123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
cursor.execute('''
    INSERT INTO users (username, email, hashed_password, is_active, is_superuser, role, specialization, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', ('technician', 'technician@propaganda-dv.ru', technician_password, 1, 0, 'technician', 'technician', '2026-04-12T00:00:00'))
print('Created technician')

# Create clinic_admin
clinic_admin_password = bcrypt.hashpw('123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
cursor.execute('''
    INSERT INTO users (username, email, hashed_password, is_active, is_superuser, role, specialization, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', ('clinic_admin', 'clinic_admin@propaganda-dv.ru', clinic_admin_password, 1, 0, 'clinic_admin', 'clinic_admin', '2026-04-12T00:00:00'))
print('Created clinic_admin')

conn.commit()

# Verify
cursor.execute('SELECT id, username, is_superuser, role, specialization FROM users')
print('\nUsers:')
for row in cursor.fetchall():
    print(f'  {row}')

conn.close()
print('\nDone!')