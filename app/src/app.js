const express = require("express");
const db = require("./db");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(authRoutes);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Дневник путешествий</title>
    </head>
    <body>
      <main>
        <h1>Дневник путешествий</h1>
        <p>Здесь пользователи смогут делиться своими поездками.</p>
        <p><a href="/register">Зарегистрироваться</a></p>
      </main>
    </body>
    </html>
  `);
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
