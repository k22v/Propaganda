import asyncio
from app.database import async_session_maker
from sqlalchemy import text
from app.models import Quiz, Question, Answer, LessonContent

async def create_quiz():
    async with async_session_maker() as session:
        result = await session.execute(text('''
            SELECT ch.id FROM chapters ch
            JOIN sections s ON ch.section_id = s.id
            WHERE s.course_id = 2 LIMIT 1
        '''))
        row = result.fetchone()
        
        if not row:
            print("No chapters found")
            return
        
        chapter_id = row[0]
        
        lesson = LessonContent(
            chapter_id=chapter_id,
            title="Test",
            content_type="quiz",
            order=999
        )
        session.add(lesson)
        await session.flush()
        
        quiz = Quiz(
            lesson_id=lesson.id,
            title="Test Quiz",
            passing_score=70
        )
        session.add(quiz)
        await session.flush()
        
        questions_data = [
            ("Question 1?", [("Answer 1", True), ("Answer 2", False), ("Answer 3", False), ("Answer 4", False)]),
            ("Question 2?", [("Answer 1", False), ("Answer 2", True), ("Answer 3", False), ("Answer 4", False)]),
            ("Question 3?", [("Answer 1", True), ("Answer 2", False), ("Answer 3", False), ("Answer 4", False)]),
            ("Question 4?", [("Answer 1", False), ("Answer 2", False), ("Answer 3", True), ("Answer 4", False)]),
            ("Question 5?", [("Answer 1", True), ("Answer 2", False), ("Answer 3", False), ("Answer 4", False)]),
            ("Question 6?", [("Answer 1", False), ("Answer 2", True), ("Answer 3", False), ("Answer 4", False)]),
            ("Question 7?", [("Answer 1", False), ("Answer 2", False), ("Answer 3", False), ("Answer 4", True)]),
            ("Question 8?", [("Answer 1", True), ("Answer 2", False), ("Answer 3", False), ("Answer 4", False)]),
            ("Question 9?", [("Answer 1", False), ("Answer 2", True), ("Answer 3", False), ("Answer 4", False)]),
            ("Question 10?", [("Answer 1", False), ("Answer 2", False), ("Answer 3", True), ("Answer 4", False)])
        ]
        
        for i, (q_text, answers) in enumerate(questions_data):
            question = Question(quiz_id=quiz.id, text=q_text, order=i+1)
            session.add(question)
            await session.flush()
            
            for j, (a_text, is_correct) in enumerate(answers):
                answer = Answer(question_id=question.id, text=a_text, is_correct=is_correct, order=j+1)
                session.add(answer)
        
        await session.commit()
        print("Done")

asyncio.run(create_quiz())
