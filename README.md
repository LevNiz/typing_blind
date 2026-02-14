# Typing Trainer

Веб-приложение для тренировки слепой печати с поддержкой текстов и кода.

## Технологии

### Backend
- FastAPI (Python 3.12)
- PostgreSQL 15
- SQLAlchemy 2.0 (async)
- Alembic (миграции)
- JWT аутентификация
- Docker

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router

## Быстрый старт

### Требования
- Docker и Docker Compose
- Git

### Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd TT
```

2. Создайте файл `.env` из примера:
```bash
cp .env.example .env
```

3. Отредактируйте `.env` файл:
   - Измените `JWT_SECRET_KEY` на случайную строку (минимум 32 символа)
   - Настройте `CORS_ORIGINS` для вашего домена
   - При необходимости измените пароли и настройки БД

4. Запустите проект:
```bash
docker-compose up -d
```

5. Примените миграции:
```bash
docker-compose exec api alembic upgrade head
```

6. Откройте в браузере:
   - Frontend: http://localhost
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Разработка

### Backend (только API + БД)

```bash
# Запустите только postgres и api из корневого docker-compose
docker-compose up -d postgres api

# Или используйте dev версию
docker-compose -f docker-compose.dev.yml up -d postgres api

# Для локальной разработки без Docker:
cd backend
# Создайте .env файл
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Структура проекта

```
TT/
├── backend/          # FastAPI приложение
│   ├── app/         # Основной код приложения
│   ├── alembic/     # Миграции БД
│   └── Dockerfile   # Docker образ для backend
├── frontend/        # React приложение
│   ├── src/         # Исходный код
│   └── Dockerfile   # Docker образ для frontend
├── docker-compose.yml  # Общий docker-compose для всех сервисов
└── .env.example     # Пример конфигурации
```

## Основные команды

### Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Остановка всех сервисов
docker-compose down

# Просмотр логов
docker-compose logs -f

# Пересборка образов
docker-compose build --no-cache

# Выполнение команды в контейнере
docker-compose exec api <command>
docker-compose exec frontend <command>
```

### Миграции БД

```bash
# Создать новую миграцию
docker-compose exec api alembic revision --autogenerate -m "migration_name"

# Применить миграции
docker-compose exec api alembic upgrade head

# Откатить последнюю миграцию
docker-compose exec api alembic downgrade -1
```

### Создание админа

```bash
# Подключиться к БД
docker-compose exec postgres psql -U postgres -d typing_trainer

# Назначить админа (замените email на реальный)
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
```

## Деплой на сервер

### Подготовка

1. Убедитесь, что на сервере установлены Docker и Docker Compose
2. Склонируйте репозиторий на сервер
3. Создайте `.env` файл с production настройками:
   - Сильный `JWT_SECRET_KEY`
   - Правильный `CORS_ORIGINS` с вашим доменом
   - Надежные пароли для БД

### Запуск

```bash
# Соберите образы
docker-compose build

# Запустите сервисы
docker-compose up -d

# Примените миграции
docker-compose exec api alembic upgrade head
```

### Nginx Reverse Proxy (опционально)

Если используете Nginx как reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL/HTTPS

Рекомендуется использовать Let's Encrypt с Certbot для HTTPS.

## Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `POSTGRES_USER` | Пользователь БД | `postgres` |
| `POSTGRES_PASSWORD` | Пароль БД | `postgres` |
| `POSTGRES_DB` | Имя БД | `typing_trainer` |
| `DATABASE_URL` | URL подключения к БД | `postgresql+asyncpg://...` |
| `JWT_SECRET_KEY` | Секретный ключ для JWT | **Обязательно изменить!** |
| `CORS_ORIGINS` | Разрешенные домены для CORS | `http://localhost:5173,...` |
| `API_PORT` | Порт API | `8000` |
| `FRONTEND_PORT` | Порт Frontend | `80` |

## Безопасность

- ✅ JWT токены с коротким временем жизни
- ✅ Refresh tokens в httpOnly cookies
- ✅ Хеширование паролей (bcrypt)
- ✅ Защита админ-панели
- ✅ CORS настройки
- ⚠️ **Обязательно измените `JWT_SECRET_KEY` в production!**
- ⚠️ **Используйте HTTPS в production!**

## API Документация

После запуска доступна по адресу:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Лицензия

MIT

