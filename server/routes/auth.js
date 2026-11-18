const express = require("express");
const bcrypt = require("bcryptjs");
const { db, uid } = require("../db");
const { sign } = require("../auth");
const { authMiddleware, requireRole } = require("../auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  const token = sign(user);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
});

router.get("/me", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT id,username,role,name FROM users WHERE id = ?").get(req.user.id);
  res.json({ user });
});

// Gerente can manage users
router.get("/users", authMiddleware, requireRole("gerente"), (req, res) => {
  const rows = db.prepare("SELECT id,username,role,name,created_at FROM users").all();
  res.json(rows);
});

router.post("/users", authMiddleware, requireRole("gerente"), (req, res) => {
  const { username, password, role, name } = req.body || {};
  if (!username || !password || !role || !name) return res.status(400).json({ error: "Datos incompletos" });
  if (!["gerente","cajero"].includes(role)) return res.status(400).json({ error: "Rol inválido" });
  const exists = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (exists) return res.status(409).json({ error: "Usuario ya existe" });
  const id = uid();
  const hash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  db.prepare("INSERT INTO users (id,username,password_hash,role,name,created_at) VALUES (?,?,?,?,?,?)")
    .run(id, username, hash, role, name, now);
  res.json({ id, username, role, name });
});

router.put("/users/:id", authMiddleware, requireRole("gerente"), (req, res) => {
  const { role, name, password } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "No encontrado" });
  if (role && ["gerente","cajero"].includes(role)) {
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
  }
  if (name) db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, req.params.id);
  if (password) {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(password,10), req.params.id);
  }
  res.json({ ok: true });
});

router.delete("/users/:id", authMiddleware, requireRole("gerente"), (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: "No puedes eliminarte" });
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;