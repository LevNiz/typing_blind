# Тренажёр слепой печати - Frontend

Frontend приложение для тренажёра слепой печати, построенное на React 18 + TypeScript + Vite.

## Технологии

- **React 18** + **TypeScript**
- **Vite** - сборщик
- **Tailwind CSS** - стилизация
- **React Router** - маршрутизация
- **TanStack Query** - управление состоянием сервера
- **React Hook Form** + **Zod** - формы и валидация
- **Framer Motion** - анимации
- **Axios** - HTTP клиент

## Установка

```bash
npm install
```

## Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно на http://localhost:3000

## Сборка для продакшена

```bash
npm run build
```

## Переменные окружения

Скопируйте `.env.example` в `.env` и настройте:

```bash
cp .env.example .env
```

- `VITE_API_URL` - URL backend API (по умолчанию http://localhost:8000)

## Структура проекта

```
src/
  app/          # Роутинг и провайдеры
  pages/        # Страницы приложения
  components/   # Переиспользуемые компоненты
  features/     # Функциональные модули (auth, trainings, texts, leaderboard)
  api/          # API клиент (axios)
  lib/          # Утилиты и хелперы
  styles/       # Глобальные стили
```

