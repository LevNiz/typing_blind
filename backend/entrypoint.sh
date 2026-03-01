#!/bin/bash
set -e

echo "Waiting for database to be ready..."
# Парсим DATABASE_URL для получения параметров подключения
# Формат: postgresql+asyncpg://user:password@host:port/dbname
DB_URL="${DATABASE_URL:-postgresql+asyncpg://postgres:postgres@postgres:5432/typing_trainer}"

# Извлекаем параметры из URL
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Если не удалось распарсить, используем значения по умолчанию
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-typing_trainer}

# Ждем пока база данных будет готова
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is ready! Running migrations..."
# Запускаем миграции
alembic upgrade head

echo "Starting application..."
# Запускаем приложение
exec "$@"

