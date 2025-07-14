# 🚀 Руководство по развертыванию Tele•Ga Platform

Это подробное руководство поможет вам развернуть Tele•Ga Platform от локальной разработки до продакшн-среды.

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Локальная разработка](#локальная-разработка)
3. [Настройка Supabase](#настройка-supabase)
4. [Развертывание Backend](#развертывание-backend)
5. [Развертывание Frontend](#развертывание-frontend)
6. [Настройка Telegram Bot](#настройка-telegram-bot)
7. [Настройка платежных систем](#настройка-платежных-систем)
8. [Мониторинг и логирование](#мониторинг-и-логирование)

## 🚀 Быстрый старт

### Требования

- **Node.js 18+**
- **npm или pnpm**
- **Git**
- Аккаунт в **Supabase** (бесплатный)
- Аккаунт в **Railway/Render** для backend (бесплатный)
- Аккаунт в **Vercel/Netlify** для frontend (бесплатный)

### Клонирование репозитория

```bash
git clone https://github.com/your-username/telega-platform.git
cd telega-platform
```

## 💻 Локальная разработка

### 1. Настройка Backend

```bash
cd backend
npm install
cp .env.example .env
```

Отредактируйте `.env` файл:

```env
# Основные настройки
NODE_ENV=development
PORT=3000

# Supabase настройки
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT секрет
JWT_SECRET=your-super-secret-jwt-key-here

# Telegram Bot (опционально для локальной разработки)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Платежные системы (опционально)
CLICK_MERCHANT_ID=your-click-merchant-id
CLICK_SECRET_KEY=your-click-secret-key
PAYME_MERCHANT_ID=your-payme-merchant-id
PAYME_SECRET_KEY=your-payme-secret-key
```

Запуск backend сервера:

```bash
npm run dev
```

Backend будет доступен на `http://localhost:3000`

### 2. Настройка Frontend приложений

#### Панель продавца

```bash
cd telega-seller-panel
npm install
cp .env.local.example .env.local
```

Настройте `.env.local`:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Запуск:

```bash
npm run dev
```

Панель продавца будет доступна на `http://localhost:5174`

#### Витрина покупателя

```bash
cd telega-storefront
npm install
cp .env.local.example .env.local
```

Настройте `.env.local` аналогично панели продавца.

Запуск:

```bash
npm run dev
```

Витрина будет доступна на `http://localhost:5175`

## 🗄️ Настройка Supabase

### 1. Создание проекта

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Дождитесь завершения настройки (2-3 минуты)

### 2. Настройка базы данных

1. Перейдите в раздел **SQL Editor**
2. Выполните SQL скрипт из файла `database_schema.sql`:

```sql
-- Скопируйте и выполните содержимое database_schema.sql
```

### 3. Настройка аутентификации

1. Перейдите в **Authentication > Settings**
2. Включите **Email confirmations**
3. Настройте **Email templates** (опционально)

### 4. Настройка Storage

1. Перейдите в **Storage**
2. Создайте bucket с именем `product-images`
3. Настройте политики доступа:

```sql
-- Политика для чтения изображений (публичная)
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Политика для загрузки изображений (только аутентифицированные пользователи)
CREATE POLICY "Authenticated upload access" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

### 5. Получение ключей

1. Перейдите в **Settings > API**
2. Скопируйте:
   - **Project URL**
   - **anon public key**
   - **service_role secret key**

## 🌐 Развертывание Backend

### Вариант 1: Railway (Рекомендуется)

1. Зайдите на [railway.app](https://railway.app)
2. Подключите ваш GitHub репозиторий
3. Выберите папку `backend` для развертывания
4. Настройте переменные окружения:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-jwt-key-here
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
CLICK_MERCHANT_ID=your-click-merchant-id
CLICK_SECRET_KEY=your-click-secret-key
PAYME_MERCHANT_ID=your-payme-merchant-id
PAYME_SECRET_KEY=your-payme-secret-key
```

5. Railway автоматически развернет приложение
6. Скопируйте URL развернутого приложения

### Вариант 2: Render

1. Зайдите на [render.com](https://render.com)
2. Создайте новый **Web Service**
3. Подключите GitHub репозиторий
4. Настройки:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Добавьте переменные окружения (аналогично Railway)

### Вариант 3: Vercel

1. Установите Vercel CLI: `npm i -g vercel`
2. В папке `backend` выполните:

```bash
vercel
```

3. Следуйте инструкциям CLI
4. Настройте переменные окружения через веб-интерфейс

## 🎨 Развертывание Frontend

### Панель продавца на Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. Импортируйте проект из GitHub
3. Настройки:
   - **Framework Preset**: Vite
   - **Root Directory**: `telega-seller-panel`
4. Переменные окружения:

```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Нажмите **Deploy**

### Витрина на Netlify

1. Зайдите на [netlify.com](https://netlify.com)
2. Подключите GitHub репозиторий
3. Настройки сборки:
   - **Base directory**: `telega-storefront`
   - **Build command**: `npm run build`
   - **Publish directory**: `telega-storefront/dist`
4. Добавьте переменные окружения (аналогично Vercel)

## 🤖 Настройка Telegram Bot

### 1. Создание бота

1. Найдите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен

### 2. Настройка webhook

После развертывания backend, настройте webhook:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-backend-url.railway.app/api/webhook/telegram"}'
```

### 3. Настройка команд бота

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setMyCommands" \
     -H "Content-Type: application/json" \
     -d '{
       "commands": [
         {"command": "start", "description": "Запустить бота"},
         {"command": "catalog", "description": "Посмотреть каталог"},
         {"command": "cart", "description": "Моя корзина"},
         {"command": "orders", "description": "Мои заказы"},
         {"command": "help", "description": "Помощь"}
       ]
     }'
```

### 4. Настройка WebApp

1. В панели продавца перейдите в настройки магазина
2. Укажите токен бота
3. Настройте URL WebApp: `https://your-storefront-url.netlify.app`

## 💳 Настройка платежных систем

### Click

1. Зарегистрируйтесь в [Click Merchant](https://merchant.click.uz)
2. Получите Merchant ID и Secret Key
3. Настройте webhook URL: `https://your-backend-url/api/webhook/click`
4. Добавьте ключи в переменные окружения

### Payme

1. Зарегистрируйтесь в [Payme Business](https://business.payme.uz)
2. Получите Merchant ID и Secret Key
3. Настройте webhook URL: `https://your-backend-url/api/webhook/payme`
4. Добавьте ключи в переменные окружения

### Telegram Payments

1. Обратитесь к [@BotFather](https://t.me/BotFather)
2. Используйте команду `/mybots` → выберите бота → **Payments**
3. Подключите платежного провайдера
4. Получите токен провайдера

## 📊 Мониторинг и логирование

### Настройка логирования

1. Зарегистрируйтесь в [LogRocket](https://logrocket.com) (опционально)
2. Добавьте ключ в переменные окружения:

```env
LOGROCKET_APP_ID=your-logrocket-app-id
```

### Мониторинг ошибок

1. Зарегистрируйтесь в [Sentry](https://sentry.io)
2. Создайте проект для Node.js
3. Добавьте DSN в переменные окружения:

```env
SENTRY_DSN=your-sentry-dsn
```

### Health checks

Backend автоматически предоставляет эндпоинт для проверки здоровья:

```
GET https://your-backend-url/health
```

Ответ:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-29T09:00:00Z",
  "services": {
    "database": "healthy",
    "external_apis": "healthy"
  }
}
```

## 🔧 Дополнительные настройки

### Настройка домена

#### Для backend (Railway)
1. В настройках проекта Railway перейдите в **Settings**
2. Добавьте пользовательский домен
3. Настройте DNS записи у вашего провайдера

#### Для frontend (Vercel/Netlify)
1. В настройках проекта добавьте пользовательский домен
2. Настройте DNS записи (обычно CNAME)
3. SSL сертификат настроится автоматически

### Настройка CDN

Для улучшения производительности настройте CDN:

1. **Cloudflare** - бесплатный CDN с множеством функций
2. **AWS CloudFront** - мощный CDN от Amazon
3. **Vercel Edge Network** - автоматически для проектов на Vercel

### Backup стратегия

1. **Supabase** автоматически создает бэкапы
2. Настройте дополнительные бэкапы через **Supabase CLI**:

```bash
npx supabase db dump --db-url "your-database-url" > backup.sql
```

## 🚨 Устранение неполадок

### Частые проблемы

#### Backend не запускается
- Проверьте переменные окружения
- Убедитесь, что Supabase доступен
- Проверьте логи в Railway/Render

#### Frontend не подключается к API
- Проверьте CORS настройки в backend
- Убедитесь, что API URL правильный
- Проверьте сетевые запросы в DevTools

#### Telegram bot не отвечает
- Проверьте токен бота
- Убедитесь, что webhook настроен правильно
- Проверьте логи webhook'ов

#### Платежи не работают
- Проверьте ключи платежных систем
- Убедитесь, что webhook URL доступен
- Проверьте настройки в панели мерчанта

### Логи и отладка

#### Просмотр логов Railway
```bash
railway logs
```

#### Просмотр логов Vercel
```bash
vercel logs
```

#### Локальная отладка
```bash
# Backend
npm run dev

# Frontend
npm run dev -- --debug
```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте [FAQ](#устранение-неполадок)
2. Изучите логи приложения
3. Обратитесь к технической документации
4. Создайте issue в GitHub репозитории

---

**Удачного развертывания! 🚀**

*Это руководство будет обновляться по мере развития платформы.*

