-- Пользователи сайта
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Записи о путешествиях
CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    image_url TEXT NOT NULL,
    cost REAL NOT NULL DEFAULT 0 CHECK (cost >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (end_date >= start_date)
);

-- Тестовый пользователь для проверки сайта
INSERT OR IGNORE INTO users (username, email, password_hash)
VALUES (
    'traveler',
    'traveler@travel.ru',
    '$2b$10$TruKkVmHn5HofKEZ0WmUsOGIeDMHHNX8oZBOyO6Y5Jdm2bzn90yF6'
);

-- Тестовое путешествие для просмотра записей других пользователей
INSERT INTO trips (
    user_id,
    title,
    country,
    city,
    description,
    start_date,
    end_date,
    latitude,
    longitude,
    image_url,
    cost
)
SELECT
    users.id,
    'Поездка в Санкт-Петербург',
    'Россия',
    'Санкт-Петербург',
    'Несколько дней гулял по центру Санкт-Петербурга. Посетил Дворцовую площадь, Эрмитаж, Невский проспект и набережную Невы.',
    '2026-05-10',
    '2026-05-14',
    59.9343,
    30.3351,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Palace_Square_in_St._Petersburg.jpg/1280px-Palace_Square_in_St._Petersburg.jpg',
    35000
FROM users
WHERE users.email = 'traveler@travel.ru'
  AND NOT EXISTS (
      SELECT 1
      FROM trips
      WHERE trips.user_id = users.id
        AND trips.title = 'Поездка в Санкт-Петербург'
        AND trips.start_date = '2026-05-10'
  );
