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
    INSERT INTO courses (title, description, cover_image, author_id, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    "Основы стоматологической помощи",
    "Полный курс для ассистентов стоматолога. Включает теоретические основы и практические навыки работы в стоматологическом кабинете.",
    None,
    admin_id,
    1,
    now,
    now
))
course_id = cursor.lastrowid
print(f'Course ID: {course_id}')

# Раздел 1
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
    """<h2>Ассистент стоматолога</h2><p>Ассистент стоматолога — специалист, помогающий врачу.</p><h3>Обязанности:</h3><ul><li>Подготовка кабинета</li><li>Подготовка инструментов</li><li>Помощь врачу</li><li>Работа с оборудованием</li></ul>""",
    1,
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
    """<h2>Этикет</h2><p>Приветствие, общение, прощание с пациентом.</p>""",
    2,
    now,
    now
))

# Раздел 2
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
    """<h2>Этапы</h2><ol><li>Дезинфекция</li><li>Очистка</li><li>Стерилизация (134°C, 20 мин)</li><li>Хранение</li></ol>""",
    1,
    now,
    now
))

# Раздел 3
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
    """<h2>Части установки</h2><ul><li>Кресло</li><li>Блок врача</li><li>Блок ассистента</li><li>Светильник</li></ul>""",
    1,
    now,
    now
))

# Тест
cursor.execute("""
    INSERT INTO quizzes (lesson_id, title, description, passing_score, created_at)
    VALUES (?, ?, ?, ?, ?)
""", (chapter3_id, "Итоговый тест", "Проверка знаний", 70, now))
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
    ("Что такое дезинфекция?", [
        ("Уборка", False),
        ("Уничтожение микробов", True),
        ("Покраска", False),
        ("Сушка", False),
    ]),
    ("Где хранить стерильные инструменты?", [
        ("На столе", False),
        ("В контейнерах", True),
        ("В раковине", False),
        ("На полу", False),
    ]),
    ("Зачем аспирация?", [
        ("Для красоты", False),
        ("Удалять слюну", True),
        ("Охлаждать", False),
        ("Светить", False),
    ]),
    ("Что проверяют индикаторы?", [
        ("Время", False),
        ("Стерилизацию", True),
        ("Цвет", False),
        ("Температуру в комнате", False),
    ]),
    ("Надёжный метод?", [
        ("Кипячение", False),
        ("Автоклавирование", True),
        ("Протирание", False),
        ("Ополаскивание", False),
    ]),
    ("При аллергии на перчатки?", [
        ("Работать без них", False),
        ("Гипоаллергенные", True),
        ("Ничего", False),
        ("Уволиться", False),
    ]),
    ("Когда мыть руки?", [
        ("Раз в день", False),
        ("Перед каждым приёмом", True),
        ("Только утром", False),
        ("Никогда", False),
    ]),
    ("Предстерилизационная очистка это?", [
        ("Первое мытьё", False),
        ("Удаление грязи перед стерилизацией", True),
        ("Покраска", False),
        ("Замена", False),
    ]),
    ("Можно ли одноразовые несколько раз?", [
        ("Да", False),
        ("Нет", True),
        ("Иногда", False),
        ("Когда хочется", False),
    ]),
    ("Что такое коффердам?", [
        ("Кресло", False),
        ("Резиновая завеса", True),
        ("Бормашина", False),
        ("Лекарство", False),
    ]),
    ("Для чего слюноотсос?", [
        ("Пить", False),
        ("Удалять слюну", True),
        ("Полировать", False),
        ("Сушить", False),
    ]),
    ("Сухожар сколько градусов?", [
        ("100°C", False),
        ("134°C", False),
        ("180°C", True),
        ("50°C", False),
    ]),
    ("Антисептик это?", [
        ("Средство для дезинфекции", True),
        ("Тип перчаток", False),
        ("Инструмент", False),
        ("Мебель", False),
    ]),
    ("Как обрабатывать поверхность?", [
        ("Никак", False),
        ("Антисептиком после каждого", True),
        ("Раз в день", False),
        ("Раз в месяц", False),
    ]),
    ("Пациент боится — что делать?", [
        ("Смеяться", False),
        ("Успокоить", True),
        ("Прогнать", False),
        ("Привязать", False),
    ]),
    ("Температура в кабинете?", [
        ("Любая", False),
        ("20-24°C", True),
        ("Как на улице", False),
        ("0°C", False),
    ]),
    ("Документация?", [
        ("Стихи", False),
        ("Карта, протоколы", True),
        ("Письма", False),
        ("Рецепты", False),
    ]),
    ("Что ведёт ассистент?", [
        ("Дневник", False),
        ("Историю болезни", True),
        ("Газету", False),
        ("Журнал", False),
    ]),
    ("Разлилась кровь?", [
        ("Оставить", False),
        ("Обработать дезинфекцией", True),
        ("Засыпать", False),
        ("Смыть просто водой", False),
    ]),
    ("Какие перчатки использовать?", [
        ("Любые", False),
        ("Стерильные", True),
        ("Грязные", False),
        ("Дырявые", False),
    ]),
]

for i, (q_text, answers) in enumerate(questions):
    cursor.execute("INSERT INTO questions (quiz_id, text, question_type, \"order\", created_at) VALUES (?, ?, 'single', ?, ?)",
        (quiz_id, q_text, i+1, now))
    q_id = cursor.lastrowid
    for j, (a_text, is_correct) in enumerate(answers):
        cursor.execute("INSERT INTO answers (question_id, text, is_correct, \"order\") VALUES (?, ?, ?, ?)",
            (q_id, a_text, is_correct, j+1))

conn.commit()
print(f'Course {course_id} created with 30 questions!')
print('Done')

conn.close()
