const express = require("express");
const db = require("../db");
const escapeHtml = require("../utils/escapeHtml");

const router = express.Router();

router.get("/trips/:id", (req, res) => {
  try {
    const tripId = Number(req.params.id);

    if (!Number.isInteger(tripId) || tripId <= 0) {
      return res.status(400).send("Указан неверный номер путешествия");
    }

    const trip = db
      .prepare(`
        SELECT trips.id, trips.title, trips.country, trips.city,
               trips.description, trips.start_date, trips.end_date,
               users.username AS author
        FROM trips
        JOIN users ON trips.user_id = users.id
        WHERE trips.id = ?
      `)
      .get(tripId);

    if (!trip) {
      return res.status(404).send("Путешествие не найдено");
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(trip.title)}</title>
      </head>
      <body>
        <main>
          <h1>${escapeHtml(trip.title)}</h1>
          <p>Автор: ${escapeHtml(trip.author)}</p>
          <p>Место: ${escapeHtml(trip.city)}, ${escapeHtml(trip.country)}</p>
          <p>Даты: ${escapeHtml(trip.start_date)} — ${escapeHtml(trip.end_date)}</p>
          <h2>Впечатления</h2>
          <p>${escapeHtml(trip.description)}</p>
          <p><a href="/">Вернуться к путешествиям</a></p>
        </main>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Ошибка получения путешествия:", error.message);
    res.status(500).send("Не удалось получить путешествие");
  }
});

module.exports = router;
