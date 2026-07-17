const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

function registrationPage(message = "") {
  const messageHtml = message ? `<p>${message}</p>` : "";

  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Регистрация</title>
    </head>
    <body>
      <main>
        <h1>Регистрация</h1>
        ${messageHtml}
        <form method="POST" action="/register">
          <div>
            <label for="username">Имя пользователя</label>
            <input id="username" name="username" type="text" required>
          </div>
          <div>
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required>
          </div>
          <div>
            <label for="password">Пароль</label>
            <input id="password" name="password" type="password" minlength="6" required>
          </div>
          <button type="submit">Создать аккаунт</button>
        </form>
        <p><a href="/">Вернуться на главную</a></p>
      </main>
    </body>
    </html>
  `;
}

function loginPage(message = "") {
  const messageHtml = message ? `<p>${message}</p>` : "";

  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Вход</title>
    </head>
    <body>
      <main>
        <h1>Вход</h1>
        ${messageHtml}
        <form method="POST" action="/login">
          <div>
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required>
          </div>
          <div>
            <label for="password">Пароль</label>
            <input id="password" name="password" type="password" required>
          </div>
          <button type="submit">Войти</button>
        </form>
        <p><a href="/register">Создать аккаунт</a></p>
        <p><a href="/">Вернуться на главную</a></p>
      </main>
    </body>
    </html>
  `;
}

router.get("/register", (req, res) => {
  res.send(registrationPage());
});

router.post("/register", async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!username || !email || !password) {
      return res.status(400).send(registrationPage("Заполните все поля"));
    }

    if (!email.includes("@")) {
      return res.status(400).send(registrationPage("Введите корректный email"));
    }

    if (password.length < 6) {
      return res.status(400).send(registrationPage("Пароль должен содержать не менее 6 символов"));
    }

    const existingUser = db
      .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
      .get(username, email);

    if (existingUser) {
      return res.status(400).send(registrationPage("Такое имя или email уже заняты"));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    db.prepare(`
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `).run(username, email, passwordHash);

    res.redirect("/login?registered=1");
  } catch (error) {
    console.error("Ошибка регистрации:", error.message);
    res.status(500).send(registrationPage("Не удалось создать пользователя"));
  }
});

router.get("/login", (req, res) => {
  const message = req.query.registered
    ? "Регистрация прошла успешно. Теперь войдите."
    : "";

  res.send(loginPage(message));
});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).send(loginPage("Заполните все поля"));
    }

    const user = db
      .prepare("SELECT id, username, password_hash FROM users WHERE email = ?")
      .get(email);

    if (!user) {
      return res.status(401).send(loginPage("Неверный email или пароль"));
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password_hash);

    if (!passwordIsCorrect) {
      return res.status(401).send(loginPage("Неверный email или пароль"));
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.redirect("/");
  } catch (error) {
    console.error("Ошибка входа:", error.message);
    res.status(500).send(loginPage("Не удалось выполнить вход"));
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Ошибка выхода:", error.message);
      return res.status(500).send("Не удалось выйти из аккаунта");
    }

    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

module.exports = router;
