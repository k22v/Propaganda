import asyncio
from app.database import async_session_maker
from app.models import User, Course, Section, Chapter, LessonContent, Quiz, Question, Answer
from app.auth import get_password_hash
from sqlalchemy import select

async def setup_demo_data():
    async with async_session_maker() as db:
        # Create admin
        admin = (await db.execute(select(User).where(User.username == 'admin'))).scalar_one_or_none()
        if not admin:
            admin = User(
                username='admin',
                email='admin@lms.com',
                hashed_password=get_password_hash('123456'),
                full_name='Administrator',
                role='admin',
                is_superuser=True
            )
            db.add(admin)
            await db.flush()
            print('Admin created: admin / 123456')
        else:
            print('Admin already exists')

        # Create users for each specialization
        specializations = [
            ('dentist', 'Врач-стоматолог'),
            ('assistant', 'Ассистент стоматолога'),
            ('technician', 'Зубной техник'),
            ('clinic_admin', 'Администратор клиники')
        ]
        
        for spec_key, spec_name in specializations:
            user = (await db.execute(select(User).where(User.username == spec_key))).scalar_one_or_none()
            if not user:
                user = User(
                    username=spec_key,
                    email=f'{spec_key}@lms.com',
                    hashed_password=get_password_hash('123456'),
                    full_name=spec_name,
                    role='student',
                    specialization=spec_key
                )
                db.add(user)
                print(f'User created: {spec_key} / 123456')
            else:
                print(f'User already exists: {spec_key}')

        # Create demo course
        course = Course(
            title="Основы стоматологии",
            description="Базовый курс по основам стоматологии с тестом из 10 вопросов",
            author_id=admin.id,
            is_published=True
        )
        db.add(course)
        await db.flush()

        # Create section
        section = Section(
            course_id=course.id,
            title="Введение в стоматологию",
            order=1
        )
        db.add(section)
        await db.flush()

        # Create chapter
        chapter = Chapter(
            section_id=section.id,
            title="Что такое стоматология?",
            order=1
        )
        db.add(chapter)
        await db.flush()

        # Create lesson content
        content = LessonContent(
            chapter_id=chapter.id,
            title="Введение",
            content_type="text",
            content="<h2>Добро пожаловать в курс!</h2><p>Стоматология — это раздел медицины, изучающий зубы, их строение, заболевания и методы лечения.</p>",
            order=1
        )
        db.add(content)
        await db.flush()

        # Create quiz with 10 questions
        quiz = Quiz(
            lesson_id=content.id,
            title="Тест по основам стоматологии",
            description="Проверьте свои знания",
            passing_score=70
        )
        db.add(quiz)
        await db.flush()

        # 10 quiz questions
        questions_data = [
            ("Как называется наука о зубах?", [
                ("Стоматология", True),
                ("Офтальмология", False),
                ("Кардиология", False),
                ("Неврология", False)
            ]),
            ("Какой зуб отвечает за пережёвывание пищи?", [
                ("Моляры", True),
                ("Резцы", False),
                ("Клыки", False),
                ("Премоляры", False)
            ]),
            ("Что такое кариес?", [
                ("Разрушение твёрдых тканей зуба", True),
                ("Воспаление дёсен", False),
                ("Потеря зуба", False),
                ("Изменение цвета эмали", False)
            ]),
            ("Сколько молочных зубов у человека?", [
                ("20", True),
                ("32", False),
                ("16", False),
                ("24", False)
            ]),
            ("Что означает термин 'пульпит'?", [
                ("Воспаление пульпы зуба", True),
                ("Кариес в стадии пятна", False),
                ("Разрушение эмали", False),
                ("Пародонтит", False)
            ]),
            ("Какой инструмент используется для осмотра зубов?", [
                ("Стоматологическое зеркало", True),
                ("Пинцет", False),
                ("Скальпель", False),
                ("Зонд", False)
            ]),
            ("Что такое периодонтит?", [
                ("Воспаление тканей вокруг корня зуба", True),
                ("Кариес эмали", False),
                ("Воспаление пульпы", False),
                ("Гингивит", False)
            ]),
            ("Какой метод стерилизации используется для металлических инструментов?", [
                ("Автоклавирование", True),
                ("Ультрафиолет", False),
                ("Холодная стерилизация", False),
                ("Кипячение", False)
            ]),
            ("Что такое винир?", [
                ("Накладка на переднюю поверхность зуба", True),
                ("Коронка на весь зуб", False),
                ("Имплантат", False),
                ("Пломба", False)
            ]),
            ("При каком заболевании наблюдается кровоточивость дёсен?", [
                ("Гингивит", True),
                ("Пульпит", False),
                ("Периодонтит", False),
                ("Флюс", False)
            ])
        ]

        for i, (q_text, answers) in enumerate(questions_data):
            question = Question(
                quiz_id=quiz.id,
                text=q_text,
                question_type="single",
                order=i+1
            )
            db.add(question)
            await db.flush()

            for j, (a_text, is_correct) in enumerate(answers):
                answer = Answer(
                    question_id=question.id,
                    text=a_text,
                    is_correct=is_correct,
                    order=j+1
                )
                db.add(answer)

        await db.commit()
        print(f'Course created: "{course.title}" with 10 quiz questions')

asyncio.run(setup_demo_data())
