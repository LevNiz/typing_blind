# Деплой на сервер (wtyping.ru)

## Безопасность конфигов в публичном репозитории

**Размещать конфиги nginx в репозитории безопасно:** в них нет паролей, ключей или секретов. Только домен, порты и пути к сертификатам (публичные данные).

**Не коммитить никогда:**
- `.env` (JWT_SECRET_KEY, пароли БД, и т.д.)
- Файлы с реальными секретами

В `CORS_ORIGINS` на сервере укажите `https://wtyping.ru` в `.env` (файл не попадает в git).

---

# Пошаговые команды деплоя (от нуля до запуска)

Команды по порядку для **Ubuntu/Debian**. Выполнять на сервере под пользователем с sudo.

---

### Шаг 0. Обновление системы (рекомендуется)

```bash
sudo apt update && sudo apt upgrade -y
```

---

### Шаг 1. Установка Docker

```bash
# Зависимости
sudo apt install -y ca-certificates curl gnupg

# Репозиторий Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Ubuntu:
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
# Debian (вместо ubuntu укажите debian и bookworm):
# echo "deb [arch=...] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Проверка:

```bash
docker --version
docker compose version
```

---

### Шаг 2. Установка Nginx и Certbot

```bash
sudo apt install -y nginx certbot
```

Проверка:

```bash
nginx -v
certbot --version
```

---

### Шаг 3. Клонирование проекта

```bash
# Каталог приложения (можно изменить)
export APP_DIR=/var/www/typing-trainer
sudo mkdir -p "$APP_DIR"
sudo chown "$USER:$USER" "$APP_DIR"
cd "$APP_DIR"

# Клонирование (подставьте свой URL репозитория)
git clone https://github.com/YOUR_USER/YOUR_REPO.git .
```

---

### Шаг 4. Файл окружения .env

```bash
cd "$APP_DIR"
cp env.example .env
nano .env
```

Обязательно задать:

- `JWT_SECRET_KEY` — случайная строка минимум 32 символа
- `POSTGRES_PASSWORD` — пароль БД (не оставлять `postgres` в проде)
- `CORS_ORIGINS` — добавить `https://wtyping.ru,https://www.wtyping.ru`
- `FRONTEND_PORT=8080`

Пример для продакшена:

```env
POSTGRES_PASSWORD=ваш_надёжный_пароль
JWT_SECRET_KEY=ваш_секретный_ключ_минимум_32_символа
CORS_ORIGINS=https://wtyping.ru,https://www.wtyping.ru,http://localhost
FRONTEND_PORT=8080
```

---

### Шаг 5. Каталог для Certbot (ACME challenge)

```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
```

---

### Шаг 6. Первый конфиг Nginx (только HTTP)

```bash
sudo cp "$APP_DIR/deploy/nginx-wtyping.ru-initial.conf" /etc/nginx/sites-available/wtyping.ru
sudo ln -sf /etc/nginx/sites-available/wtyping.ru /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

### Шаг 7. Запуск приложения (Docker)

```bash
cd "$APP_DIR"
docker compose up -d --build
```

Проверка:

```bash
docker compose ps
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080
# Ожидается 200
```

---

### Шаг 8. Получение SSL-сертификата

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d wtyping.ru -d www.wtyping.ru --email your@email.com --agree-tos --no-eff-email
```

DH-параметры и опции SSL (один раз):

```bash
sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
sudo curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf -o /etc/letsencrypt/options-ssl-nginx.conf
```

---

### Шаг 9. Полный конфиг Nginx (HTTPS)

```bash
sudo cp "$APP_DIR/deploy/nginx-wtyping.ru.conf" /etc/nginx/sites-available/wtyping.ru
sudo nginx -t && sudo systemctl reload nginx
```

---

### Шаг 10. Автопродление сертификата (cron)

```bash
sudo crontab -e
```

Добавить строку:

```cron
0 3,15 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

---

### Итог

| Компонент | Описание |
|-----------|----------|
| Docker | postgres, api, frontend (порт 8080) |
| Nginx | 80/443 → proxy на 127.0.0.1:8080 |
| Certbot | сертификаты + продление по cron |

Проверка: открыть в браузере `https://wtyping.ru`.

**Полезные команды после деплоя:**

```bash
cd /var/www/typing-trainer
docker compose logs -f          # логи
docker compose down             # остановка
docker compose up -d            # запуск
git pull && docker compose up -d --build   # обновление кода
```

---

## Требования на сервере

- Docker и Docker Compose
- Nginx (на хосте) — для SSL и проксирования
- Certbot (Let's Encrypt)

---

## 1. Установка Nginx и Certbot (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
# Или только certbot + webroot (без плагина nginx):
# sudo apt install -y certbot
```

---

## 2. Подготовка каталога для ACME challenge

```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
```

---

## 3. Первый запуск: получение сертификата

### Вариант A: Nginx уже проксирует приложение (порт 80 свободен для certbot)

1. Скопировать **начальный** конфиг (только HTTP, без HTTPS):

   ```bash
   sudo cp deploy/nginx-wtyping.ru-initial.conf /etc/nginx/sites-available/wtyping.ru
   sudo ln -sf /etc/nginx/sites-available/wtyping.ru /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

2. На сервере фронт должен слушать не 80 (чтобы порт 80 был свободен для nginx), а например 8080. В `.env`: `FRONTEND_PORT=8080`, затем `docker-compose up -d`. Тогда nginx проксирует на `127.0.0.1:8080`.

3. Получить сертификат (webroot):

   ```bash
   sudo certbot certonly --webroot -w /var/www/certbot -d wtyping.ru -d www.wtyping.ru --email your@email.com --agree-tos --no-eff-email
   ```

4. Создать опции SSL для nginx (один раз):

   ```bash
   sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
   ```

   Если используете готовый конфиг certbot для nginx:

   ```bash
   # Опционально: certbot может подсказать путь к options-ssl-nginx.conf
   # Обычно: /etc/letsencrypt/options-ssl-nginx.conf
   sudo ls /etc/letsencrypt/
   ```

   Если файла `options-ssl-nginx.conf` нет — добавьте в конфиг вручную (см. ниже блок ssl_params).

5. Заменить конфиг на полный (с HTTPS):

   ```bash
   sudo cp deploy/nginx-wtyping.ru.conf /etc/nginx/sites-available/wtyping.ru
   sudo nginx -t && sudo systemctl reload nginx
   ```

### Вариант B: Certbot в режиме standalone (если порт 80 занят и сложно освободить)

1. Временно остановить nginx и приложение на порту 80:

   ```bash
   sudo systemctl stop nginx
   # И остановить контейнер frontend, если слушает 80
   ```

2. Получить сертификат:

   ```bash
   sudo certbot certonly --standalone -d wtyping.ru -d www.wtyping.ru --email your@email.com --agree-tos --no-eff-email
   ```

3. Создать dhparams и при необходимости `options-ssl-nginx.conf` (см. выше).

4. Включить полный конфиг nginx и запустить сервисы:

   ```bash
   sudo cp deploy/nginx-wtyping.ru.conf /etc/nginx/sites-available/wtyping.ru
   sudo ln -sf /etc/nginx/sites-available/wtyping.ru /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl start nginx
   # Запустить docker-compose
   ```

---

## 4. Автопродление сертификатов (Certbot)

### Проверка продления вручную

```bash
sudo certbot renew --dry-run
```

### Автопродление по cron (рекомендуется)

Создать задачу (дважды в день, certbot сам пропустит, если продление не нужно):

```bash
sudo crontab -e
```

Добавить строку:

```cron
0 3,15 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

Или только проверка + reload nginx при успехе (через certbot hook):

```bash
# Скрипт деплоя после продления (опционально)
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/sh
systemctl reload nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

Тогда cron:

```cron
0 3 * * * certbot renew --quiet
```

### Автопродление через systemd (альтернатива cron)

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
sudo systemctl status certbot.timer
```

После продления certbot по умолчанию перезапускает сервисы, указанные в конфиге (или можно использовать `--deploy-hook "systemctl reload nginx"` в `/etc/letsencrypt/renewal/wtyping.ru.conf` в секции `[renewalparams]`: `renew_hook = systemctl reload nginx`).

---

## 5. Отсутствует options-ssl-nginx.conf

Если после установки certbot файла `/etc/letsencrypt/options-ssl-nginx.conf` нет, создайте его вручную или добавьте в `server { listen 443 ssl; ... }`:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
```

В нашем конфиге используется `include /etc/letsencrypt/options-ssl-nginx.conf;`. Если файла нет — замените эту строку на блок выше или создайте файл:

```bash
sudo curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf -o /etc/letsencrypt/options-ssl-nginx.conf
```

---

## 6. Порядок запуска на сервере

1. Запуск приложения (в каталоге проекта):

   ```bash
   docker-compose up -d
   ```

2. Фронт в Docker должен быть доступен на хосте на порту 8080: в `.env` задать `FRONTEND_PORT=8080`, тогда контейнер будет слушать `127.0.0.1:8080` и nginx проксирует на него.

3. Nginx на хосте слушает 80/443 и проксирует на `127.0.0.1:80`.

4. В `.env` на сервере указать:

   ```env
   FRONTEND_PORT=8080
   CORS_ORIGINS=https://wtyping.ru,https://www.wtyping.ru,http://localhost
   ```

После изменения `.env` перезапустить контейнер API:

```bash
docker-compose up -d --force-recreate api
```
