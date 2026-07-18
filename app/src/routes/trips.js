const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const escapeHtml = require("../utils/escapeHtml");

const router = express.Router();

router.get("/trips/new", authMiddleware, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Новое путешествие</title>
    </head>
    <body>
      <main>
        <h1>Новое путешествие</h1>
        <form method="POST" action="/trips">
          <p>
            <label for="title">Название</label><br>
            <input id="title" name="title" type="text" required>
          </p>
          <p>
            <label for="country">Страна</label><br>
            <input id="country" name="country" type="text" required>
          </p>
          <p>
            <label for="city">Город</label><br>
            <input id="city" name="city" type="text" required>
          </p>
          <p>
            <label for="description">Описание</label><br>
            <textarea id="description" name="description" rows="5" required></textarea>
          </p>
          <p>
            <label for="start_date">Дата начала</label><br>
            <input id="start_date" name="start_date" type="date" required>
          </p>
          <p>
            <label for="end_date">Дата окончания</label><br>
            <input id="end_date" name="end_date" type="date" required>
          </p>
          <p>
            <label for="latitude">Широта</label><br>
            <input id="latitude" name="latitude" type="number" min="-90" max="90" step="any" required>
          </p>
          <p>
            <label for="longitude">Долгота</label><br>
            <input id="longitude" name="longitude" type="number" min="-180" max="180" step="any" required>
          </p>
          <p>
            <label for="image_url">Ссылка на изображение</label><br>
            <input id="image_url" name="image_url" type="url" required>
          </p>
          <p>
            <label for="cost">Стоимость путешествия</label><br>
            <input id="cost" name="cost" type="number" min="0" step="0.01" required>
          </p>
          <button type="submit">Сохранить путешествие</button>
        </form>
        <p><a href="/my-trips">Вернуться к моим путешествиям</a></p>
      </main>
    </body>
    </html>
  `);
});

router.post("/trips", authMiddleware, (req, res) => {
  try {
    const title = req.body.title?.trim();
    const country = req.body.country?.trim();
    const city = req.body.city?.trim();
    const description = req.body.description?.trim();
    const startDate = req.body.start_date?.trim();
    const endDate = req.body.end_date?.trim();
    const latitudeText = req.body.latitude?.trim();
    const longitudeText = req.body.longitude?.trim();
    const imageUrl = req.body.image_url?.trim();
    const costText = req.body.cost?.trim();

    if (
      !title ||
      !country ||
      !city ||
      !description ||
      !startDate ||
      !endDate ||
      !latitudeText ||
      !longitudeText ||
      !imageUrl ||
      !costText
    ) {
      return res.status(400).send("Заполните все поля");
    }

    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    const cost = Number(costText);
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
      return res.status(400).send("Укажите корректные даты путешествия");
    }

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).send("Широта должна быть от -90 до 90");
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).send("Долгота должна быть от -180 до 180");
    }

    if (!Number.isFinite(cost) || cost < 0) {
      return res.status(400).send("Стоимость не может быть отрицательной");
    }

    if (endDate < startDate) {
      return res.status(400).send("Дата окончания не может быть раньше даты начала");
    }

    let parsedImageUrl;

    try {
      parsedImageUrl = new URL(imageUrl);
    } catch {
      return res.status(400).send("Укажите корректную ссылку на изображение");
    }

    if (parsedImageUrl.protocol !== "http:" && parsedImageUrl.protocol !== "https:") {
      return res.status(400).send("Ссылка на изображение должна начинаться с http:// или https://");
    }

    const result = db
      .prepare(`
        INSERT INTO trips (
          user_id, title, country, city, description,
          start_date, end_date, latitude, longitude, image_url, cost
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        req.session.userId,
        title,
        country,
        city,
        description,
        startDate,
        endDate,
        latitude,
        longitude,
        imageUrl,
        cost
      );

    res.redirect(`/trips/${result.lastInsertRowid}`);
  } catch (error) {
    console.error("Ошибка сохранения путешествия:", error.message);
    res.status(500).send("Не удалось сохранить путешествие");
  }
});

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
