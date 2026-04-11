import asyncio
from app.database import async_session_maker
from app.models import Course, Section, Chapter, LessonContent, User, Enrollment
from sqlalchemy import select

async def create_test_course():
    async with async_session_maker() as db:
        admin = (await db.execute(select(User).where(User.username == 'admin'))).scalar_one_or_none()
        if not admin:
            print("Admin not found!")
            return

        admin.role = "admin"
        await db.commit()
        print("Admin role updated to 'admin'")

        result = await db.execute(select(Course).where(Course.title == "Курс для ассистентов"))
        existing = result.scalar_one_or_none()
        if existing:
            print("Course already exists!")
            return

        course = Course(
            title="Курс для ассистентов",
            description="Базовый курс для обучения ассистентов стоматолога",
            author_id=admin.id,
            is_published=True
        )
        db.add(course)
        await db.flush()

        section1 = Section(
            course_id=course.id,
            title="Введение",
            description="Основы работы ассистента",
            order=1
        )
        db.add(section1)
        await db.flush()

        chapter1 = Chapter(
            section_id=section1.id,
            title="Обязанности ассистента",
            description="Что делает ассистент на приёме",
            order=1
        )
        db.add(chapter1)
        await db.flush()

        lesson1 = LessonContent(
            chapter_id=chapter1.id,
            title="Роль ассистента в клинике",
            content_type="text",
            content="<h2>Добро пожаловать!</h2><p>Ассистент стоматолога — важный член команды. Ваши обязанности:</p><ul><li>Подготовка кабинета к приёму</li><li>Подача инструментов врачу</li><li>Работа с аспирацией</li><li>Поддержание стерильности</li></ul>",
            order=1
        )
        db.add(lesson1)

        section2 = Section(
            course_id=course.id,
            title="Базовые навыки",
            description="Основные процедуры",
            order=2
        )
        db.add(section2)
        await db.flush()

        chapter2 = Chapter(
            section_id=section2.id,
            title="Работа с оборудованием",
            description="Как пользоваться стоматологическим оборудованием",
            order=1
        )
        db.add(chapter2)
        await db.flush()

        lesson2 = LessonContent(
            chapter_id=chapter2.id,
            title="Стоматологический наконечник",
            content_type="text",
            content="<h2>Наконечник турбинный</h2><p>Используется для препарирования твёрдых тканей зуба.</p><p><strong>Правила работы:</strong></p><ol><li>Проверьте соединение с воздухом</li><li>Убедитесь в подаче воды</li><li>Не нажимайте сильно на зуб</li></ol>",
            order=1
        )
        db.add(lesson2)

        enrollment = Enrollment(
            user_id=admin.id,
            course_id=course.id
        )
        db.add(enrollment)

        await db.commit()
        print(f"Course created: {course.title}")
        print("Admin enrolled in course")

asyncio.run(create_test_course())
