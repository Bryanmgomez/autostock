const express = require("express");
const { db } = require("../db");
const { authMiddleware, requireRole } = require("../auth");

const router = express.Router();
router.use(authMiddleware);

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM settings").all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

router.put("/", requireRole("gerente"), (req, res) => {
  const b = req.body || {};
  const upsert = db.prepare("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
  for (const [k,v] of Object.entries(b)) upsert.run(k, String(v));
  res.json({ ok: true });
});

module.exports = router;