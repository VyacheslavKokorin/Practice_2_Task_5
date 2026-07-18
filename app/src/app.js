const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./db");
const authRoutes = require("./routes/auth");
const tripsRoutes = require("./routes/trips");
const authMiddleware = require("./middleware/authMiddleware");
const escapeHtml = require("./utils/escapeHtml");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "../public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(authRoutes);
app.use(tripsRoutes);

app.get("/", (req, res) => {
  try {
    const trips = db
      .prepare(`
        SELECT trips.id, trips.title, trips.country, trips.city,
               trips.start_date, trips.end_date, users.username AS author
        FROM trips
        JOIN users ON trips.user_id = users.id
        ORDER BY trips.created_at DESC
      `)
      .all();

    let accountInfo = `
      <p><a href="/register">Зарегистрироваться</a></p>
      <p><a href="/login">Войти</a></p>
    `;

    if (req.session.userId) {
      accountInfo = `
        <p>Вы вошли в аккаунт.</p>
        <p><a href="/my-trips">Мои путешествия</a></p>
        <p><a href="/trips/new">Добавить путешествие</a></p>
        <form method="POST" action="/logout">
          <button type="submit">Выйти</button>
        </form>
      `;
    }

    let tripsHtml = "<p>Путешествий пока нет.</p>";

    if (trips.length > 0) {
      tripsHtml = trips
        .map(
          (trip) => `
            <article>
              <h3><a href="/trips/${trip.id}">${escapeHtml(trip.title)}</a></h3>
              <p>Автор: ${escapeHtml(trip.author)}</p>
              <p>Место: ${escapeHtml(trip.city)}, ${escapeHtml(trip.country)}</p>
              <p>Даты: ${escapeHtml(trip.start_date)} — ${escapeHtml(trip.end_date)}</p>
            </article>
          `
        )
        .join("");
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/styles.css">
        <title>Дневник путешествий</title>
      </head>
      <body>
        <main>
          <h1>Дневник путешествий</h1>
          <p>Здесь пользователи смогут делиться своими поездками.</p>
          ${accountInfo}
          <h2>Путешествия пользователей</h2>
          ${tripsHtml}
        </main>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Ошибка получения путешествий:", error.message);
    res.status(500).send("Не удалось получить список путешествий");
  }
});

app.get("/my-trips", authMiddleware, (req, res) => {
  try {
    const trips = db
      .prepare(`
        SELECT id, title, country, city, start_date, end_date
        FROM trips
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .all(req.session.userId);

    let tripsHtml = "<p>У вас пока нет путешествий.</p>";

    if (trips.length > 0) {
      tripsHtml = trips
        .map(
          (trip) => `
            <article>
              <h2><a href="/trips/${trip.id}">${escapeHtml(trip.title)}</a></h2>
              <p>Место: ${escapeHtml(trip.city)}, ${escapeHtml(trip.country)}</p>
              <p>Даты: ${escapeHtml(trip.start_date)} — ${escapeHtml(trip.end_date)}</p>
            </article>
          `
        )
        .join("");
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/styles.css">
        <title>Мои путешествия</title>
      </head>
      <body>
        <main>
          <h1>Мои путешествия</h1>
          <p><a href="/trips/new">Добавить путешествие</a></p>
          ${tripsHtml}
          <p><a href="/">Вернуться на главную</a></p>
        </main>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Ошибка получения путешествий пользователя:", error.message);
    res.status(500).send("Не удалось получить ваши путешествия");
  }
});

app.get("/db-check", (req, res) => {
  try {
    const result = db.prepare("SELECT 1 AS result").get();

    res.json({
      message: "Подключение к базе данных работает",
      result: result.result
    });
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error.message);
    res.status(500).json({
      message: "Не удалось подключиться к базе данных"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
