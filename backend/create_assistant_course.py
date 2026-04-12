from datetime import datetime
import sqlite3

conn = sqlite3.connect('lms.db')
cursor = conn.cursor()
now = datetime.now().isoformat()

# Получаем ID админа
cursor.execute("SELECT id FROM users WHERE username = 'admin' LIMIT 1")
admin_id = cursor.fetchone()[0]

# Создаём курс
cursor.execute("""
    INSERT INTO courses (title, description, cover_image, author_id, is_published, specialization, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (
    "Основы стоматологической помощи",
    "Полный курс для ассистентов стоматолога. Включает теоретические основы и практические навыки работы в стоматологическом кабинете.",
    None,
    admin_id,
    1,
    "assistant",
    now,
    now
))
course_id = cursor.lastrowid
print(f'Course ID: {course_id}')

# Раздел 1: Основы работы ассистента
cursor.execute("""
    INSERT INTO sections (course_id, title, description, "order", created_at)
    VALUES (?, ?, ?, ?, ?)
""", (course_id, "Основы работы ассистента", "Базовые навыки и обязанности", 1, now))
section1_id = cursor.lastrowid

cursor.execute("""
    INSERT INTO chapters (section_id, title, description, "order", created_at)
    VALUES (?, ?, ?, ?, ?)
""", (section1_id, "Роль и обязанности", "", 1, now))
chapter1_id = cursor.lastrowid

cursor.execute("""
    INSERT INTO lesson_contents (chapter_id, title, content_type, content, "order", created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    chapter1_id,
    "Кто такой ассистент стоматолога",
    "text",
    """<h2>Ассистент стоматолога</h2><p>Ассистент стоматолога — специалист, помогающий врачу во время приёма пациентов. Это важная роль в команде стоматологической клиники.</p><h3>Обязанности:</h3><ul><li>Подготовка кабинета к приёму</li><li>Подготовка инструментов и материалов</li><li>Помощь врачу во время процедур</li><li>Работа с оборудованием</li><li>Ведение документации</li></ul>""",
    1,
    now,
    now
))

cursor.execute("""
    INSERT INTO lesson_contents (chapter_id, title, content_type, content, "order", created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    chapter1_id,
    "Рабочее место ассистента",
    "text",
    """<h2>Рабочее место ассистента</h2><p>Блок ассистента включает все необходимые инструменты для помощи врачу.</p><img src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800" alt="Рабочее место ассистента" style="max-width:100%;border-radius:8px;" />""",
    2,
    now,
    now
))

cursor.execute("""
    INSERT INTO lesson_contents (chapter_id, title, content_type, content, "order", created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    chapter1_id,
    "Этикет общения",
    "text",
    """<h2>Этикет общения с пациентом</h2><h3>Приветствие:</h3><ul><li>Встречать пациента с улыбкой</li><li>Обращаться по имени</li><li>Предложить удобно разместиться</li></ul><h3>Общение:</h3><ul><li>Быть вежливым и доброжелательным</li><li>Слушать внимательно</li><li>Объяснять процедуры</li></ul><h3>Прощание:</h3><ul><li>Поблагодарить за визит</li><li>Сообщить о следующем приёме</li></ul>""",
    3,
    now,
    now
))

# Раздел 2: Стерилизация
cursor.execute("""
    INSERT INTO sections (course_id, title, description, "order", created_at)
    VALUES (?, ?, ?, ?, ?)
""", (course_id, "Стерилизация", "Правила стерилизации", 2, now))
section2_id = cursor.lastrowid

cursor.execute("""
    INSERT INTO chapters (section_id, title, description, "order", created_at)
    VALUES (?, ?, ?, ?, ?)
""", (section2_id, "Стерилизация инструментов", "", 1, now))
chapter2_id = cursor.lastrowid

cursor.execute("""
    INSERT INTO lesson_contents (chapter_id, title, content_type, content, "order", created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    chapter2_id,
    "Этапы стерилизации",
    "text",
    """<h2>Этапы стерилизации</h2><ol><li><strong>Дезинфекция</strong> — уничтожение патогенных микроорганизмов</li><li><strong>Очистка</strong> — удаление видимых загрязнений</li><li><strong>Предстерилизационная очистка</strong> — удаление остатков биологических материалов</li><li><strong>Стерилизация</strong> — при 134°C в течение 20 минут (автоклавирование)</li><li><strong>Хранение</strong> — в стерильных контейнерах</li></ol>""",
    1,
    now,
    now
))

cursor.execute("""
    INSERT INTO lesson_contents (chapter_id, title, content_type, content, "order", created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    chapter2_id,
    "Автоклав",
    "text",
    """<h2>Автоклав — основной метод стерилизации</h2><p>Автоклавирование — наиболее надёжный метод стерилизации. Работает при температуре 134°C и давлении 2 атмосферы.</p><img src="https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800" alt="Автоклав" style="max-width:100%;border-radius:8px;" />""",
    2,
    now,
    now
))

cursor.execute("""
    INSERT INTO lesson_contents (chapter_id, title, content_type, content, video_url, "order", created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (
    chapter2_id,
    "Видео: Процесс стерилизации",
    "video",
    """<h2>Видеоурок: Правильная стерилизация инструментов</h2><p>Посмотрите видео, чтобы узнать правильную последовательность действий при стерилизации.</p>""",
    "https://www.youtube.com/embed/jfKfPfyJRdk",
    3,
    now,
    now
))

# Раздел 3: Оборудование
cursor.execute("""
    INSERT INTO sections (course_id, title, description, "order", created_at)
    VALUES (?, ?, ?, ?, ?)
""", (course_id, "Оборудование", "Работа с техникой", 3, now))
section3_id = cursor.lastrowid

cursor.execute("""
    INSERT INTO chapters (section_id, title, description, "order", created_at)
    VALUES (?, ?, ?, ?, ?)
""", (section3_id, "Стоматологическая установка", "", 1, now))
chapter3_id = cursor.lastrowid

cursor.execute("""
    INSERT INTO lesson_contents (chapter_id, title, content_type, content, "order", created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    chapter3_id,
    "Устройство установки",
    "text",
    """<h2>Части стоматологической установки</h2><ul><li><strong>Кресло пациента</strong> — регулируемое, с подголовником</li><li><strong>Блок врача</strong> — бормашина, наконечники, инструменты</li><li><strong>Блок ассистента</strong> — слюноотсос, пылесос, светофильтры</li><li><strong>Светильник</strong> — освещение рабочей зоны</li><li><strong>Монитор</strong> — для рентген-снимков и информации</li></ul>""",
    1,
    now,
    now
))

cursor.execute("""
    INSERT INTO lesson_contents (chapter_id, title, content_type, content, "order", created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    chapter3_id,
    "Стоматологическая установка",
    "text",
    """<h2>Стоматологическая установка</h2><p>Современная стоматологическая установка с креслом, блоком врача и ассистента.</p><img src="https://images.unsplash.com/photo-1609840633564-3561f8e907e0?w=800" alt="Стоматологическая установка" style="max-width:100%;border-radius:8px;" />""",
    2,
    now,
    now
))

# Раздел 4: Практические навыки
cursor.execute("""
    INSERT INTO sections (course_id, title, description, "order", created_at)
    VALUES (?, ?, ?, ?, ?)
""", (course_id, "Практические навыки", "Работа с пациентами", 4, now))
section4_id = cursor.lastrowid

cursor.execute("""
    INSERT INTO chapters (section_id, title, description, "order", created_at)
    VALUES (?, ?, ?, ?, ?)
""", (section4_id, "Работа с пациентом", "", 1, now))
chapter4_id = cursor.lastrowid

cursor.execute("""
    INSERT INTO lesson_contents (chapter_id, title, content_type, content, "order", created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    chapter4_id,
    "Подготовка пациента",
    "text",
    """<h2>Подготовка пациента к приёму</h2><ol><li>Проверить запись в расписании</li><li>Подготовить карту пациента</li><li>Приветствовать пациента</li><li>Помочь разместиться в кресле</li><li>Предложить фартук/бахилы</li><li>Спросить о самочувствии</li></ol>""",
    1,
    now,
    now
))

cursor.execute("""
    INSERT INTO lesson_contents (chapter_id, title, content_type, content, "order", created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    chapter4_id,
    "Экстренные ситуации",
    "text",
    """<h2>Экстренные ситуации в стоматологии</h2><h3>Что делать:</h3><ul><li><strong>Обморок</strong> — уложить, обеспечить доступ воздуха, вызвать врача</li><li><strong>Кровотечение</strong> — прижать салфетку, вызвать врача</li><li><strong>Аллергия</strong> — прекратить контакт, сообщить врачу</li><li><strong>Боль</strong> — успокоить, сообщить врачу</li></ul>""",
    2,
    now,
    now
))

# Тест
cursor.execute("""
    INSERT INTO quizzes (lesson_id, title, description, passing_score, max_attempts, show_correct_answers, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (chapter3_id, "Итоговый тест", "Проверка знаний", 70, 3, 1, now))
quiz_id = cursor.lastrowid

questions = [
    ("Кто такой ассистент стоматолога?", [
        ("Врач", False),
        ("Помощник врача", True),
        ("Администратор", False),
        ("Техник", False),
    ]),
    ("При какой температуре автоклавирование?", [
        ("100°C", False),
        ("134°C", True),
        ("180°C", False),
        ("200°C", False),
    ]),
    ("Сколько времени автоклавирование?", [
        ("10 мин", False),
        ("20 мин", True),
        ("30 мин", False),
        ("60 мин", False),
    ]),
    ("Первый этап стерилизации?", [
        ("Стерилизация", False),
        ("Дезинфекция", True),
        ("Очистка", False),
        ("Хранение", False),
    ]),
    ("Что надевает ассистент?", [
        ("Халат", False),
        ("Перчатки и маску", True),
        ("Только перчатки", False),
        ("Ничего", False),
    ]),
    ("Как часто менять перчатки?", [
        ("Раз в день", False),
        ("Между пациентами", True),
        ("Раз в неделю", False),
        ("Никогда", False),
    ]),
    ("Что в блоке ассистента?", [
        ("Бормашина", False),
        ("Слюноотсос", True),
        ("Телевизор", False),
        ("Компьютер", False),
    ]),
    ("Качество ассистента?", [
        ("Лень", False),
        ("Внимательность", True),
        ("Грубость", False),
        ("Безразличие", False),
    ]),
    ("Как приветствовать пациента?", [
        ("Молча", False),
        ("По имени с улыбкой", True),
        ("Криком", False),
        ("Не обращать внимания", False),
    ]),
    ("После пациента обработать?", [
        ("Нет", False),
        ("Да, поверхности", True),
        ("Только пол", False),
        ("Ничего", False),
    ]),
]

for i, (q_text, answers) in enumerate(questions):
    cursor.execute("INSERT INTO questions (quiz_id, text, question_type, \"order\", created_at) VALUES (?, ?, 'single', ?, ?)",
        (quiz_id, q_text, i+1, now))
    q_id = cursor.lastrowid
    for j, (a_text, is_correct) in enumerate(answers):
        cursor.execute("INSERT INTO answers (question_id, text, is_correct, \"order\") VALUES (?, ?, ?, ?)",
            (q_id, a_text, is_correct, j+1))

# Практические задания
practice_questions = [
    ("essay", "Подготовка кабинета", "Опишите последовательность подготовки кабинета к приёму пациента. Какие действия нужно выполнить?", 1),
    ("essay", "Работа с оборудованием", "Перечислите основные элементы блока ассистента и их назначение.", 2),
    ("essay", "Экстренная ситуация", "Опишите ваши действия, если пациент потерял сознание в кресле.", 3),
    ("essay", "Стерилизация", "Расскажите об этапах стерилизации инструментов и их особенностях.", 4),
    ("essay", "Общение с пациентом", "Как правильно приветствовать пациента и подготовить его к осмотру?", 5),
]

for pq_type, pq_text, pq_desc, _ in practice_questions:
    cursor.execute("""
        INSERT INTO practice_questions (course_id, question_text, question_type, explanation, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (course_id, pq_text, pq_type, pq_desc, 1, now))

conn.commit()
print('Course {} created!'.format(course_id))
print('Done!')

conn.close()