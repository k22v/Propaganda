# LMS Platform

Платформа для создания и прохождения онлайн-курсов.

## Требования

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## Запуск
РАБОЧИЙ СЕРВЕР БУДЕТ НА СИСТЕМЕ ЛИНУКС

### 1. База данных

Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE lms_db;
```

### 2. Бэкенд (FastAPI)

```bash
cd backend

# Создайте виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Установите зависимости
pip install -r requirements.txt

# Примените миграции
alembic upgrade head

# Запустите сервер
uvicorn app.main:app --reload
```

Бэкенд будет доступен на http://localhost:8000

### 3. Фронтенд (React)

```bash
cd frontend

# Установите зависимости
npm install

# Запустите dev сервер
npm run dev
```

Фронтенд будет доступен на http://localhost:3000

## API Endpoints

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь
- `GET /api/courses/` - Список курсов
- `GET /api/courses/my` - Мои курсы
- `POST /api/courses/` - Создать курс
- `GET /api/courses/{id}` - Детали курса
- `DELETE /api/courses/{id}` - Удалить курс
- `POST /api/courses/{id}/enroll` - Записаться на курс
- `GET /api/courses/{id}/lessons` - Уроки курса
- `POST /api/courses/{id}/lessons` - Создать урок
- `POST /api/quizzes/` - Создать тест
- `GET /api/quizzes/lesson/{lesson_id}` - Тест урока
- `POST /api/quizzes/{quiz_id}/attempt` - Отправить попытку
- `GET /api/quizzes/attempt/{quiz_id}/best` - Лучшая попытка
- `GET /api/quizzes/certificates/my` - Мои сертификаты

## Структура проекта

```
lms-platform/
├── backend/
│   ├── app/
│   │   ├── models.py      # Модели БД
│   │   ├── schemas.py     # Pydantic схемы
│   │   ├── auth.py        # Аутентификация
│   │   ├── database.py    # Подключение к БД
│   │   ├── config.py      # Настройки
│   │   ├── main.py        # Главный файл
│   │   └── routers/       # API роутеры
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api.js         # API клиент
    │   ├── App.jsx        # Главный компонент
    │   ├── main.jsx       # Точка входа
    │   ├── index.css      # Стили
    │   ├── components/    # Компоненты
    │   └── pages/         # Страницы
    └── package.json
```
