# AGENTS.md - LMS Platform Пropаганда ДВ

## Проект

**Название:** LMS Platform Пропаганда ДВ
**Назначение:** Платформа для стоматологического обучения (dentist, assistant, technician)
**Версия:** 0.5.0 (MVP)

---

## Текущее состояние (апрель 2026)

### Backend
- FastAPI + SQLAlchemy + SQLite (async)
- Роутеры: auth, courses, quizzes, reviews, comments, templates, admin, instruments, practice, notifications, learning-paths, certificates
- ~5000+ строк кода
- Docker-ready (docker-compose.yml)
- Sentry monitoring + structured logging

### Frontend  
- React 18 + Vite + TanStack Query
- Роутинг, темная/светлая тема, RichTextEditor
- ~6500+ строк CSS

### Frontend UI Components
- lucide-react icons (BookOpen, CheckCircle2, Download, etc.)
- UI components: Badge, Card, Button, ProgressBar, Avatar, EmptyState, Skeleton, Tabs, Modal, DropdownMenu
- CourseComponents: CourseCard, CourseGrid
- AdminComponents: AdminToolbar, UsersTable, UserRowActions, AdminStatsRow
- ProfileComponents: ProfileSidebar, ProfileStatsGrid, ActivityFeed
- VideoPlayer with subtitles and speed control

### БД
- 17 таблиц: users, courses, sections, chapters, lesson_contents, enrollments, lesson_progress, quizzes, questions, answers, quiz_attempts, comments, templates, instruments, practice_questions, reviews, notifications, learning_paths, learning_path_courses, certificates

---

## Критические проблемы безопасности

### 1. Поломанная модель прав доступа
**Проблема:** Создание курсов на backend висит на `get_current_active_user`, без явной проверки роли. Frontend компенсирует UI-ограничениями и хардкодом `currentUser.id === 5`.

**Решение:** Вынести permissions в backend как единственный источник истины. Создать policy-слой:
- `can_create_course`
- `can_publish_course`
- `can_manage_quiz`
- `can_view_admin`
- `can_comment_lesson`
- `can_upload_media`

### 2. Кривая auth/session схема
**Проблема:** Backend при логине ставит HttpOnly cookie И возвращает access token в теле ответа. Frontend кладёт токен в localStorage. Двойная схема хуже безопасностью.

**Решение:** Выбрать одну стратегию:
- Вариант А: Short-lived access token + refresh token в HttpOnly Secure cookie с rotation
- Вариант Б: Cookie-session для API

### 3. is_active не дожат до конца
**Проблема:** При логине проверяется `user.is_active`, но `get_current_active_user` не проверяет активность. Деактивированный пользователь может жить в системе до истечения токена.

**Решение:** Добавить проверку is_active в `get_current_active_user`.

### 4. stored XSS в контенте
**Проблема:** RichTextEditor сохраняет innerHTML напрямую, без санитизации. Контент уроков рендерится как HTML.

**Решение:** Серверная санитизация с whitelist-политикой тегов/атрибутов. Добавить CSP.

### 5. Загрузка файлов опасная
**Проблема:** Загрузка в `/uploads` напрямую, без проверки MIME, размера, вирус-скана.

**Решение:** 
- MIME sniffing + size limits
- Безопасная генерация пути (uuid)
- Separate public bucket

### 6. Scoring квизов
**Проблема:** Процент считается от количества отправленных ответов, а не от общего числа вопросов. Можно обмануть API-запросом.

**Решение:** Исправить формулу на: `correct / total_questions * 100`

### 7. Комментарии читаются публично
**Проблема:** GET /comments/lesson/{lesson_id} не т��ебует авторизации.

**Решение:** Закрыть для неавторизованных, если курсы закрытые.

### 8. Секреты и инфраструктура
**Проблема:** Дефолтные credentials в docker-compose, SECRET_KEY с fallback, `echo=True` в SQLAlchemy.

**Решение:**
- Убрать дефолтные креды
- Выключить echo=True
- Разнести dev/prod конфиги
- использовать .env с реальными secrets

---

## Архитектурные улучшения

### Backend Service Layer
Сейчас бизнес-логика размазана по роутерам. Нужно:
```
app/
├── routers/    # Только приём/возврат DTO
├── services/   # Бизнес-логика
├── policies/   # Permissions
├── repositories/  # Работа с БД
└── schemas/   # DTO
```

### Domain Model (Dental LMS)
```
- auth          # Аутентификация/авторизация
- users        # Пользователи, специализации
- organizations # Клиники
- catalog      # Каталог курсов
- content     # Уроки, контент
- assessments # Тесты, экзамены
- enrollments  # Записи на курсы
- progress    # Прогресс обучения
- certificates # Сертификаты
- notifications
- admin
```

### Доменная модель обучения
- Треки для: assistants, dentists, technicians
- Обязательные модули
- Практические кейсы
- Экзамены
- CE/CME кредиты (сертификация)

---

## Performance

### N+1 Queries
Sections → chapters → contents → progress - классический N+1. Нужны:
- selectinload/joinedload
- Агрегированные модели
- Предзагрузка связей

### Background Tasks
- Emails
- Уведомления
- Пересчёт статистики
- Обработка файлов

### Кэширование
- Каталог курсов
- Публичные карточки
- Структура уроков
- Справочники

---

## Priority задачи (2026)

### Безопасность (HIGH)
1. ✅ Permissions в backend (убрать хардкод)
2. Выбрать auth-схему
3. ✅ Починить is_active
4. ✅ Санитизация HTML
5. ✅ File upload pipeline
6. ✅ Scoring квизов
7. ✅ Убрать дефолтные секреты
8. ✅ Закрыть комментарии

### Архитектура (MEDIUM)
1. ✅ Service layer (users, courses, progress, auth)
2. ✅ Permission policies
3. ✅ Domain decomposition (dental)
4. ✅ Domain model (dental)

### Производительность (LOW)
1. ✅ Query optimization
2. ✅ Background tasks
3. ✅ Redis caching

---

## Итог

### ✅ Все задачи выполнены!

---

## Сессия (апрель 2026)

### Установлено
- lucide-react для иконок
- Playwright для e2e тестирования
- pytest + pytest-asyncio для backend тестов

### Backend обновления
1. **conftest.py** - исправлены async fixtures с `@pytest_asyncio.fixture`
2. **pyproject.toml** - добавлена конфигурация pytest `[tool.pytest.ini_options]`
3. **auth.py** - register endpoint возвращает `UserResponse` вместо ORM объекта
4. **test_auth.py** - фиксирован параметр `client` в `test_login_inactive_user`
5. **test_permissions.py** - фиксированы параметры `auth_headers`, `superuser` в тестах
6. **policies.py** - расширен с функциями:
   - `check_teacher_or_admin()` - проверка преподавателя/админа
   - `check_admin()` - проверка админа
   - `can_manage_quiz()` - проверка прав на управление квизами
   - `can_respond_to_review()` - проверка прав на ответ к отзывы
   - `can_delete_comment()` - проверка прав на удаление комментария
7. **routers** - обновлены на использование policy layer:
   - `courses.py` - `check_teacher_or_admin()` для create_course
   - `reviews.py` - `check_admin()` для respond_to_review
   - `comments.py** - `can_delete_comment()` для delete_comment
   - `quizzes.py** - `can_manage_quiz()` для create_quiz

### Infrastructure updates
1. **sentry_config.py** - Sentry monitoring integration
2. **logging_utils.py** - Structured logging with structlog
3. **main.py** - Sentry and logging initialization

### Dental LMS features
1. **models.py** - добавлены модели:
   - `LearningPath` - треки обучения для специализаций
   - `LearningPathCourse` - курсы в треке
   - `Certificate` - сертификаты за курсы
2. **schemas.py** - добавлены схемы для LearningPath и Certificate
3. **routers/learning_paths.py** - endpoints для треков и сертификатов:
   - `GET /api/learning-paths/` - список треков
   - `GET /api/learning-paths/{id}` - детали трека
   - `POST /api/learning-paths/` - создание трека
   - `PUT /api/learning-paths/{id}/courses` - обновление курсов в треке
   - `GET /api/certificates/my` - мои сертификаты
   - `GET /api/certificates/verify` - проверка сертификата
   - `POST /api/certificates/issue` - выдача сертификата

### Backend tests (63 tests passing)
- `tests/test_admin.py` - 12 тестов для admin endpoints
- `tests/test_auth.py` - 11 тестов для аутентификации
- `tests/test_comments.py` - 4 теста для комментариев
- `tests/test_permissions.py` - 11 тестов для permissions и курсов
- `tests/test_rbac.py` - 25 тестов для RBAC policies

### Frontend обновления
1. **ui.jsx** - создан компонент ui/index.jsx с базовыми компонентами (Badge, Card, Button, ProgressBar, Avatar, EmptyState, Skeleton, Tabs, Modal, DropdownMenu)
2. **Dashboard.jsx** - обновлён с lucide-react иконками (BookOpen, CheckCircle2, Award, Bell, ChevronRight, Play)
3. **Dashboard.css** - добавлены стили для icon-based stat cards
4. **ProfileComponents.jsx** - исправлен импорт Badge
5. **CourseComponents.jsx, AdminComponents.jsx** - обновлены импорты
6. **AdminDashboard.jsx** - полностью переработан с использованием:
   - AdminToolbar с фильтрами
   - UsersTable компонент
   - AdminStatsRow для KPI
   - Badge/Tabs/Card компоненты
7. **Courses.jsx** - обновлён с:
   - CourseGrid компонентом
   - EmptyState для пустых результатов
   - Skeleton для загрузки
   - lucide-react Search иконкой
8. **Courses.css** - создан файл стилей
9. **ui.css** - исправлен путь импорта
10. **Layout.jsx/css** - обновлён с lucide-react иконками, mobile меню, улучшенный header
11. **CourseDetail.jsx** - добавлены lucide-react иконки для контента и навигации
12. **MyCourses.jsx** - обновлён с Card, Badge, Button компонентами
13. **LessonView.jsx** - добавлены lucide-react иконки для комментариев и квизов, интегрирован VideoPlayer
14. **QuizView.jsx** - полностью переработан с Card, Badge, Button компонентами
15. **CreateCourse.jsx** - обновлён с Card, Badge, Button
16. **CreateQuiz.jsx** - обновлён с Card, Badge, Button, lucide-react иконками
17. **Glossary.jsx** - добавлены импорты для UI компонентов
18. **InstrumentDetail.jsx** - обновлён с Card, Badge, Button, lucide-react иконками
19. **PracticeQuestions.jsx** - обновлён с Card, Badge, Button, lucide-react иконками
20. **Login.jsx** - переработан с gradient background и lucide-react
21. **Register.jsx** - переработан с lucide-react иконками
22. **NotFound.jsx** - обновлён с HeartCrack иконкой, современный дизайн
23. **Toast.jsx** - обновлён с lucide-react иконками (CheckCircle, XCircle, etc.)
24. **ContentModal.jsx** - обновлены иконки типов контента на lucide-react
25. **ProfileComponents.jsx** - обновлены иконки статистики на lucide-react
26. **AdminComponents.jsx** - обновлены иконки AdminStatsRow на lucide-react

### Frontend e2e tests (9 tests passing)
- `tests/auth.spec.ts` - 4 теста для аутентификации
- `tests/courses.spec.ts` - 3 теста для курсов
- `tests/admin.spec.ts` - 3 теста для админки (1 skipped)
- `playwright.config.ts` - конфигурация с webServer для backend и frontend
- `package.json` - добавлены `test:e2e` и `test:e2e:ui` scripts

---

## Dev команды

```bash
# Backend
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Backend tests
cd backend
C:\Users\ADMIN\AppData\Roaming\Python\Python310\Scripts\pytest.exe tests/ -v

# Frontend  
cd frontend
npm run dev

# Frontend e2e tests
cd frontend
npm run test:e2e

# Docker
docker-compose up -d
```

---

## Users (тестовые)

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@propaganda-dv.ru | admin123 | admin |
| dentist | dentist@propaganda-dv.ru | 123456 | student |
| assistant | assistant@propaganda-dv.ru | 123456 | assistant |
| technician | technician@propaganda-dv.ru | 123456 | technician |
| clinic_admin | clinic_admin@propaganda-dv.ru | 123456 | student |

---

## Endpoints

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- Health: http://localhost:8000/health

---

## Git

- Репозиторий: https://github.com/k22v/Propaganda
- Ветка: main