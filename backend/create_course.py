import asyncio
import sys
sys.path.insert(0, '.')

from app.database import async_session_maker
from app.models import Course, Section, Chapter, LessonContent, ContentType, Quiz, Question, Answer, User
from sqlalchemy import select

async def create_assistant_course():
    async with async_session_maker() as session:
        # Get admin user
        result = await session.execute(select(User).where(User.role == "admin"))
        admin = result.scalar_one_or_none()
        
        if not admin:
            print("Admin user not found!")
            return
        
        # Create course
        course = Course(
            title="Экстренная стоматологическая помощь",
            description="Курс для ассистентов стоматолога по оказанию экстренной помощи пациентам. Включает видеоматериалы, практические задания и тестирование.",
            author_id=admin.id,
            is_published=True
        )
        session.add(course)
        await session.flush()
        
        # Section 1: Основы
        section1 = Section(
            course_id=course.id,
            title="1. Основы экстренной помощи",
            description="Базовые знания о экстренных состояниях в стоматологии",
            order=1
        )
        session.add(section1)
        await session.flush()
        
        # Chapter 1.1
        chapter1 = Chapter(
            section_id=section1.id,
            title="1.1 Распознавание экстренных состояний",
            description="Как определить, что пациенту нужна экстренная помощь",
            order=1
        )
        session.add(chapter1)
        await session.flush()
        
        # Lesson 1.1.1 - Text
        lesson1 = LessonContent(
            chapter_id=chapter1.id,
            title="Признаки экстренных состояний",
            content_type=ContentType.TEXT,
            content="""## Основные признаки экстренных состояний

### Кровотечение
- Интенсивное кровотечение из лунки зуба
- Кровь не останавливается более 15 минут
- Признаки анемии (бледность, слабость)

### Боль
- Острая боль, не снимаемая анальгетиками
- Боль, отдающая в ухо, висок, шею
- Признаки абсцесса (отек, температура)

### Травма
- Выбитый зуб
- Перелом челюсти
- Повреждение мягких тканей

### Аллергическая реакция
- Отёк Квинке
- Анафилаксия
- Крапивница""",
            order=1
        )
        session.add(lesson1)
        
        # Lesson 1.1.2 - Video
        lesson2 = LessonContent(
            chapter_id=chapter1.id,
            title="Видео: Алгоритм первой помощи",
            content_type=ContentType.VIDEO,
            video_url="https://example.com/videos/first-aid.mp4",
            duration=300,
            order=2
        )
        session.add(lesson2)
        
        # Chapter 1.2
        chapter2 = Chapter(
            section_id=section1.id,
            title="1.2 Оборудование для экстренной помощи",
            description="Какое оборудование должно быть в кабинете",
            order=2
        )
        session.add(chapter2)
        await session.flush()
        
        lesson3 = LessonContent(
            chapter_id=chapter2.id,
            title="Аптечка экстренной помощи",
            content_type=ContentType.TEXT,
            content="""## Аптечка ассистента стоматолога

### Обязательное оборудование:
1. **Перевязочные материалы**
   - Стерильные салфетки
   - Бинты различных размеров
   - Марлевые тампоны

2. **Кровоостанавливающие средства**
   - Гемостатическая губка
   - Ватные тампоны
   - Пинцет

3. **Медикаменты**
   - Анальгетики
   - Антисептики (хлоргексидин)
   - Солевой раствор

4. **Инструменты**
   - Зонд
   - Экскаватор
   - Пластина для прикусывания""",
            order=1
        )
        session.add(lesson3)
        
        # Section 2: Кровотечения
        section2 = Section(
            course_id=course.id,
            title="2. Управление кровотечением",
            description="Методы остановки кровотечений в стоматологии",
            order=2
        )
        session.add(section2)
        await session.flush()
        
        chapter3 = Chapter(
            section_id=section2.id,
            title="2.1 Постэкстракционное кровотечение",
            order=1
        )
        session.add(chapter3)
        await session.flush()
        
        lesson4 = LessonContent(
            chapter_id=chapter3.id,
            title="Остановка кровотечения после удаления зуба",
            content_type=ContentType.TEXT,
            content="""## Алгоритм действий при постэкстракционном кровотечении

### Шаг 1: Оценка
- Определить интенсивность кровотечения
- Проверить наличие сгустка крови
- Оценить общее состояние пациента

### Шаг 2: Первичные меры
1. Попросить пациента прикусить марлевый тампон на 15-20 минут
2. Убедиться, что пациент не сплёвывает и не полощет рот
3. Проверить давление пациента

### Шаг 3: Дополнительные меры
- Приложить холод к щеке
- Использовать гемостатическую губку
- Наложить швы при необходимости

### Когда вызывать врача:
- Кровотечение более 30 минут
- Признаки шока
- Большое количество крови""",
            order=1
        )
        session.add(lesson4)
        
        # Section 3: Тестирование
        section3 = Section(
            course_id=course.id,
            title="3. Итоговый тест",
            description="Проверка знаний по курсу",
            order=3
        )
        session.add(section3)
        await session.flush()
        
        chapter4 = Chapter(
            section_id=section3.id,
            title="Экзаменационный тест",
            order=1
        )
        session.add(chapter4)
        await session.flush()
        
        # Create quiz
        quiz = Quiz(
            lesson_id=0,  # Will be updated after creating lesson
            title="Тест: Экстренная стоматологическая помощь",
            description="Итоговый тест по курсу для ассистентов",
            passing_score=70
        )
        session.add(quiz)
        await session.flush()
        
        # Create quiz lesson
        quiz_lesson = LessonContent(
            chapter_id=chapter4.id,
            title="Итоговый тест",
            content_type=ContentType.QUIZ,
            order=1
        )
        session.add(quiz_lesson)
        await session.flush()
        
        # Update quiz with correct lesson_id
        quiz.lesson_id = quiz_lesson.id
        
        # Create 10 questions
        questions_data = [
            {
                "text": "Сколько времени в норме должно длиться кровотечение после удаления зуба?",
                "answers": [
                    ("До 5 минут", True),
                    ("До 15 минут", True),
                    ("До 30 минут", False),
                    ("До 1 часа", False)
                ]
            },
            {
                "text": "Какой первый шаг при остановке постэкстракционного кровотечения?",
                "answers": [
                    ("Наложить швы", False),
                    ("Приложить горячий компресс", False),
                    ("Попросить пациента прикусить тампон", True),
                    ("Дать лекарства", False)
                ]
            },
            {
                "text": "Какой признак НЕ характерен для анафилаксии?",
                "answers": [
                    ("Отёк лица", False),
                    ("Зуд кожи", False),
                    ("Повышение аппетита", True),
                    ("Затруднённое дыхание", False)
                ]
            },
            {
                "text": "Что НЕ входит в состав аптечки экстренной помощи?",
                "answers": [
                    ("Стерильные салфетки", False),
                    ("Анальгетики", False),
                    ("Зубная щётка", True),
                    ("Гемостатическая губка", False)
                ]
            },
            {
                "text": "При подозрении на перелом челюсти следует:",
                "answers": [
                    ("Вправить кость самостоятельно", False),
                    ("Наложить фиксирующую повязку и вызвать врача", True),
                    ("Удалить все зубы", False),
                    ("Оставить пациента без помощи", False)
                ]
            },
            {
                "text": "Какой антисептик рекомендуется использовать для обработки ран в полости рта?",
                "answers": [
                    ("Йод", False),
                    ("Хлоргексидин", True),
                    ("Спирт", False),
                    ("Перекись водорода", False)
                ]
            },
            {
                "text": "Признаком какого состояния является бледность кожи, слабость и учащённый пульс?",
                "answers": [
                    ("Аллергия", False),
                    ("Анемия/шок", True),
                    ("Гипертония", False),
                    ("Диабет", False)
                ]
            },
            {
                "text": "Что нужно сделать при выбитом зубе у ребёнка?",
                "answers": [
                    ("Выбросить зуб", False),
                    ("Поместить в молоко и обратиться к врачу", True),
                    ("Вставить обратно самим", False),
                    ("Оставить высыхать", False)
                ]
            },
            {
                "text": "Какой минимальный процент правильных ответов для прохождения теста?",
                "answers": [
                    ("50%", False),
                    ("60%", False),
                    ("70%", True),
                    ("90%", False)
                ]
            },
            {
                "text": "При отёке Квинке (отёке лица) первой мерой является:",
                "answers": [
                    ("Наложить компресс", False),
                    ("Дать анальгетик", False),
                    ("Вызвать скорую помощь и дать антигистаминное", True),
                    ("Уложить пациента спать", False)
                ]
            }
        ]
        
        for i, q_data in enumerate(questions_data):
            question = Question(
                quiz_id=quiz.id,
                text=q_data["text"],
                order=i + 1
            )
            session.add(question)
            await session.flush()
            
            for j, (answer_text, is_correct) in enumerate(q_data["answers"]):
                answer = Answer(
                    question_id=question.id,
                    text=answer_text,
                    is_correct=is_correct,
                    order=j + 1
                )
                session.add(answer)
        
        await session.commit()
        print(f"Course created: {course.id}")
        print(f"Quiz created with {len(questions_data)} questions")

if __name__ == "__main__":
    asyncio.run(create_assistant_course())
