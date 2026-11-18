const express = require("express");
const { db, uid } = require("../db");
const { authMiddleware, requireRole } = require("../auth");

const router = express.Router();
router.use(authMiddleware);

router.get("/entries", (req, res) => {
  const rows = db.prepare("SELECT * FROM cash_entries ORDER BY date DESC").all();
  res.json(rows.map(e=>({ id:e.id, date:e.date, type:e.type, amount:e.amount, description:e.description, category:e.category, refId:e.ref_id, userId:e.user_id })));
});

router.post("/entries", (req, res) => {
  const b = req.body || {};
  if (!b.description) return res.status(400).json({ error: "Descripción requerida" });
  if (!(+b.amount > 0)) return res.status(400).json({ error: "Monto inválido" });
  if (!["in","out"].includes(b.type)) return res.status(400).json({ error: "Tipo inválido" });
  const id = uid();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO cash_entries (id,date,type,amount,description,category,ref_id,user_id) VALUES (?,?,?,?,?,?,?,?)")
    .run(id, now, b.type, +b.amount, b.description, b.category||"General", b.refId||null, req.user.id);
  res.json({ id });
});

router.delete("/entries/:id", requireRole("gerente"), (req, res) => {
  db.prepare("DELETE FROM cash_entries WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// sessions
router.get("/sessions", (req, res) => {
  const rows = db.prepare("SELECT * FROM cash_sessions ORDER BY opened_at DESC").all();
  res.json(rows.map(s=>({ id:s.id, openedAt:s.opened_at, closedAt:s.closed_at, openingAmount:s.opening_amount, closingAmount:s.closing_amount, expectedAmount:s.expected_amount, difference:s.difference, status:s.status, userId:s.user_id })));
});

router.get("/current", (req, res) => {
  const s = db.prepare("SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1").get();
  if (!s) return res.json(null);
  res.json({ id:s.id, openedAt:s.opened_at, openingAmount:s.opening_amount, status:s.status });
});

router.post("/open", (req, res) => {
  const existing = db.prepare("SELECT id FROM cash_sessions WHERE status = 'open'").get();
  if (existing) return res.status(400).json({ error: "Ya hay una caja abierta" });
  const amount = Math.max(0, + (req.body||{}).openingAmount || 0);
  const id = uid();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO cash_sessions (id,opened_at,opening_amount,status,user_id) VALUES (?,?,?,?,?)")
    .run(id, now, amount, "open", req.user.id);
  // record opening as cash entry
  db.prepare("INSERT INTO cash_entries (id,date,type,amount,description,category,user_id) VALUES (?,?,?,?,?,?,?)")
    .run(uid(), now, "in", amount, "Apertura de caja", "Apertura", req.user.id);
  res.json({ id, openingAmount: amount });
});

router.post("/close", (req, res) => {
  const b = req.body || {};
  const session = db.prepare("SELECT * FROM cash_sessions WHERE id = ? AND status = 'open'").get(b.sessionId);
  if (!session) return res.status(400).json({ error: "Sesión no encontrada o cerrada" });
  const closing = +b.closingAmount;
  if (isNaN(closing)) return res.status(400).json({ error: "Monto de cierre inválido" });
  // expected: opening + entries in - entries out since opened_at
  const entries = db.prepare("SELECT * FROM cash_entries WHERE date >= ?").all(session.opened_at);
  let ins = 0, outs = 0;
  for (const e of entries) {
    if (e.type === "in") ins += e.amount; else outs += e.amount;
  }
  // subtract opening? opening included as entry, but formula uses opening_amount. entries includes opening entry, so expected = ins - outs. But if opening entry recorded, okay.
  const expected = ins - outs;
  const diff = closing - expected;
  const now = new Date().toISOString();
  db.prepare("UPDATE cash_sessions SET closed_at=?,closing_amount=?,expected_amount=?,difference=?,status='closed' WHERE id=?")
    .run(now, closing, expected, diff, session.id);
  res.json({ expected, closing, difference: diff });
});

module.exports = router;