# Meowdoku: Brain Puzzle Games - Open-source

**The Purr-fect Sudoku Puzzle** — An addictive, feline-themed logic puzzle built as a high-performance Telegram Mini App (TMA).

[![Telegram Mini App](https://img.shields.io/badge/Telegram-Mini_App-24A1DE?style=flat&logo=telegram&logoColor=white)](https://t.me/meowdokubot)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)

---

## 🎮 Play Now

Open the game directly in Telegram:
👉 **[https://t.me/meowdokubot](https://t.me/meowdokubot)**

---

## 📖 Rules of Meowdoku

Meowdoku is a logic-based grid puzzle inspired by Star Battle / Queens with a charming cat theme:

1. **One Cat per Color**: Each colored territory must contain exactly one cat.
2. **One Cat per Row and Column**: No two cats can share the same horizontal row or vertical column.
3. **No Touching**: Cats cannot touch each other horizontally, vertically, or diagonally.
4. **Fish Lives System**: Players start with 3 fish. Placing a cat in an illegal cell costs 1 fish. Run out of fish and you must retry!

---

## ✨ Key Features

- **🐾 Progressive Level System**:
  - Over 100+ procedurally verified logic levels that increase in grid size and complexity.
  - Seamless in-memory level preloading cache for instant transitions without loading spinners.

- **⏱️ Daily Challenge Mode (Level 5+)**:
  - Deterministic 6x6 daily puzzle synchronized globally across all players.
  - Live speedrun stopwatch timer with personal best tracking and leaderboard persistence.

- **🔥 Dynamic Daily Streaks & Rewards**:
  - Fully dynamic streak calculation engine based on player check-in history.
  - 7-day progression cycle strip matching active streak cycles.
  - **Manual Daily Check-In**: Players claim 1 free Cat Hint or Cross Hint every day.
  - Radiant animated sun with 360° rotating sunburst flare.

- **🛍️ Telegram Stars Shop (`XTR`)**:
  - Native in-app purchases using Telegram Stars.
  - Cat Hint bundles (5, 10, 20) and Cross Hint bundles (5, 10, 20) with volume discount tags.
  - Cosmetic unlocks: Avatars (1–9) and decorative frames (1–9) for 15 ⭐ each (Avatars 1 & 2 and Frames 1 & 2 are free).
  - Background polling bot handling `pre_checkout_query` and crediting orders instantly.

- **🎨 Player Profile Customization**:
  - Choose and equip unlocked avatars and decorative photo frames.
  - Custom display name editor with live preview.
  - Clean frame layering preserving squarish avatar geometry and animal face visibility.

- **🏆 Global Leaderboard**:
  - Top 30 global rankings displaying player custom avatars, frames, levels, and fish balances.
  - Elevated "Your Rank" highlight card for quick spot checking.

- **🌐 Multilingual Localization (i18n)**:
  - 100% translated across 8 languages:
    - 🇬🇧 English (`en`)
    - 🇮🇳 Hindi (`hi`)
    - 🇷🇺 Russian (`ru`)
    - 🇪🇸 Spanish (`es`)
    - 🇫🇷 French (`fr`)
    - 🇩🇪 German (`de`)
    - 🇯🇵 Japanese (`ja`)
    - 🇨🇳 Simplified Chinese (`zh`)

- **📱 Telegram Mini App Native Features**:
  - Cryptographic Telegram authentication via `initData` HMAC-SHA256 validation.
  - Native haptic feedback (`impactOccurred`, `notificationOccurred`).
  - Edge-to-edge safe area inset handling (`safeAreaInset`, `contentSafeAreaInset`).
  - Accidental close prevention (`enableClosingConfirmation`, `disableVerticalSwipes`).
  - Add to Home Screen shortcut prompt (Bot API 8.0+).

- **🎵 Rich Audio & Motion**:
  - Web Audio API procedural sound effects (purrs, meows, cell taps, wins, defeats).
  - Smooth micro-interactions powered by Framer Motion and Lottie animations (Sun, Star, Trophy, Duck, Leaderboard).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), Custom Design System |
| **Animation & FX** | [Framer Motion](https://www.framer.com/motion/), [Lottie Web](https://airbnb.io/lottie/), [Lucide React](https://lucide.dev/) |
| **Database** | [MySQL 8.x](https://www.mysql.com/) via `mysql2/promise` connection pooling |
| **Telegram Integration** | Telegram WebApp SDK, Telegram Bot API (long polling service via `scripts/bot.js`) |


## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **npm** or **pnpm**
- **MySQL Database**: v8.0 or compatible
- **Telegram Bot Token**: Created via [@BotFather](https://t.me/BotFather)

### 2. Clone the Repository
```bash
git clone https://github.com/nasirul786/meowdoku.git
cd web
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your actual database and Telegram Bot credentials:
```env
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=meowdoku
DB_USER=root
DB_PASS=your_database_password

# Telegram Bot API Token (from @BotFather)
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ

# App Configuration
NEXT_PUBLIC_VERSION=1.16.0
```

### 5. Initialize the Database Schema
Ensure your MySQL database exists and run the required table creation statements:

```sql
CREATE TABLE IF NOT EXISTS users (
  telegram_id BIGINT PRIMARY KEY,
  username VARCHAR(255) DEFAULT NULL,
  first_name VARCHAR(255) DEFAULT NULL,
  display_name VARCHAR(255) DEFAULT NULL,
  current_level INT DEFAULT 1,
  fish_balance INT DEFAULT 3,
  cat_hints INT DEFAULT 3,
  cross_hints INT DEFAULT 3,
  avatar_id INT DEFAULT 1,
  frame_id INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  checkin_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_date (telegram_id, checkin_date)
);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  challenge_date DATE NOT NULL,
  duration_seconds INT NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_challenge (telegram_id, challenge_date)
);

CREATE TABLE IF NOT EXISTS shop_bundles (
  id VARCHAR(64) PRIMARY KEY,
  item_type VARCHAR(32) NOT NULL,
  quantity INT NOT NULL,
  price_stars INT NOT NULL,
  discount_percent INT DEFAULT 0,
  active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_unlocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  item_type VARCHAR(32) NOT NULL,
  item_id INT NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_item (telegram_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_charge_id VARCHAR(255) NOT NULL,
  telegram_id BIGINT NOT NULL,
  item_type VARCHAR(32) NOT NULL,
  item_id VARCHAR(64) NOT NULL,
  price_stars INT NOT NULL,
  payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Shop Bundles
INSERT IGNORE INTO shop_bundles (id, item_type, quantity, price_stars, discount_percent, active) VALUES
('cat_hints_5', 'cat_hints', 5, 10, 0, 1),
('cat_hints_10', 'cat_hints', 10, 18, 10, 1),
('cat_hints_20', 'cat_hints', 20, 32, 20, 1),
('cross_hints_5', 'cross_hints', 5, 8, 0, 1),
('cross_hints_10', 'cross_hints', 10, 14, 12, 1),
('cross_hints_20', 'cross_hints', 20, 25, 22, 1);
```

### 6. Start the Development Server
```bash
npm run dev
```
> **Note**: `npm run dev` starts both the **Next.js Web Server** (port 3000) and the **Telegram Bot Polling Worker** concurrently!

### 7. Connect to Telegram Mini App
To test inside Telegram on your mobile device or desktop:
1. Start an HTTPS tunnel (e.g. `ngrok http 3000`).
2. Go to [@BotFather](https://t.me/BotFather) on Telegram.
3. Select your bot $\rightarrow$ **Bot Settings** $\rightarrow$ **Menu Button** or **Configure Mini App**.
4. Set the Web App URL to your HTTPS ngrok URL (e.g. `https://your-domain.ngrok-free.app`).
5. Open your bot in Telegram and tap the menu button to play!

---

## 📜 Available Scripts

Inside `web/`:

- `npm run dev`: Runs Next.js development server and the Telegram Bot polling script concurrently.
- `npm run build`: Compiles the Next.js production build with TypeScript validation.
- `npm run start`: Starts the Next.js production server and the Telegram Bot polling script.
- `npm run bot`: Runs only the Telegram Bot polling worker.
- `npm run lint`: Runs ESLint checks.

