import asyncio
from app.database import async_session_maker
from sqlalchemy import text
from app.models import Quiz, Question, Answer, LessonContent, Chapter, Section

async def create_quiz():
    async with async_session_maker() as session:
        # Get chapters for course 2
        result = await session.execute(text('''
            SELECT ch.id, ch.title 
            FROM chapters ch
            JOIN sections s ON ch.section_id = s.id
            WHERE s.course_id = 2
        '''))
        chapters = result.fetchall()
        
        if not chapters:
            print("No chapters found for course 2")
            return
        
        chapter_id = chapters[0][0]
        print(f"Using chapter {chapter_id}: {chapters[0][1]}")
        
        # Create quiz lesson
        lesson = LessonContent(
            chapter_id=chapter_id,
            title="Итоговый тест",
            content_type="quiz",
            order=999
        )
        session.add(lesson)
        await session.flush()
        
        # Create quiz
        quiz = Quiz(
            lesson_id=lesson.id,
            title="Тест: Экстренная стоматологическая помощь",
            description="Итоговый тест по курсу",
            passing_score=70
        )
        session.add(quiz)
        await session.flush()
        
        # Create 10 questions
        questions_data = [
            ("Сколько времени в норме должно длиться кровотечение после удаления зуба?", [
                ("До 5 минут", False),
                ("До 15 минут", True),
                ("До 30 минут", False),
                ("До 1 часа", False)
            ]),
            ("Какой первый шаг при остановке постэкстракционного кровотечения?", [
                ("Наложить швы", False),
                ("Приложить горячий компресс", False),
                ("Попросить пациента прикусить тампон", True),
                ("Дать лекарства", False)
            ]),
            ("Какой признак НЕ характерен для анафилаксии?", [
                ("Отёк лица", False),
                ("Зуд кожи", False),
                ("Повышение аппетита", True),
                ("Затруднённое дыхание", False)
            ]),
            ("Что НЕ входит в состав аптечки экстренной помощи?", [
                ("Стерильные салфетки", False),
                ("Анальгетики", False),
                ("Зубная щётка", True),
                ("Гемостатическая губка", False)
            ]),
            ("При подозрении на перелом челюсти следует:", [
                ("Вправить кость самостоятельно", False),
                ("Наложить фиксирующую повязку и вызвать врача", True),
                ("Удалить все зубы", False),
                ("Оставить пациента без помощи", False)
            ]),
            ("Какой антисептик рекомендуется использовать для обработки ран в полости рта?", [
                ("Йод", False),
                ("Хлоргексидин", True),
                ("Спирт", False),
                ("Перекись водорода", False)
            ]),
            ("Признаком какого состояния является бледность кожи, слабость и учащённый пульс?", [
                ("Аллергия", False),
                ("Анемия/шок", True),
                ("Гипертония", False),
                ("Диабет", False)
            ]),
            ("Что нужно сделать при выбитом зубе у ребёнка?", [
                ("Выбросить зуб", False),
                ("Поместить в молоко и обратиться к врачу", True),
                ("Вставить обратно самим", False),
                ("Оставить высыхать", False)
            ]),
            ("Какой минимальный процент правильных ответов для прохождения теста?", [
                ("50%", False),
                ("60%", False),
                ("70%", True),
                ("90%", False)
            ]),
            ("При отёке Квинке первой мерой является:", [
                ("Наложить компресс", False),
                ("Дать анальгетик", False),
                ("Вызвать скорую помощь и дать антигистаминное", True),
                ("Уложить пациента спать", False)
            ])
        ]
        
        for i, (q_text, answers) in enumerate(questions_data):
            question = Question(
                quiz_id=quiz.id,
                text=q_text,
                order=i+1
            )
            session.add(question)
            await session.flush()
            
            for j, (a_text, is_correct) in enumerate(answers):
                answer = Answer(
                    question_id=question.id,
                    text=a_text,
                    is_correct=is_correct,
                    order=j+1
                )
                session.add(answer)
        
        await session.commit()
        print(f"Quiz created! ID: {quiz.id}, Lesson ID: {lesson.id}")
        print(f"Questions: {len(questions_data)}")

asyncio.run(create_quiz())
