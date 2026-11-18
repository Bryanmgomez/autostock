const express = require("express");
const { db, uid } = require("../db");
const { authMiddleware, requireRole } = require("../auth");

const router = express.Router();
router.use(authMiddleware);

router.get("/payments", (req, res) => {
  const saleId = req.query.saleId;
  let rows;
  if (saleId) rows = db.prepare("SELECT * FROM credit_payments WHERE sale_id = ? ORDER BY date DESC").all(saleId);
  else rows = db.prepare("SELECT * FROM credit_payments ORDER BY date DESC").all();
  res.json(rows.map(p=>({ id:p.id, saleId:p.sale_id, date:p.date, amount:p.amount, note:p.note, userId:p.user_id })));
});

router.post("/payments", (req, res) => {
  const b = req.body || {};
  const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(b.saleId);
  if (!sale) return res.status(404).json({ error: "Venta no encontrada" });
  if (!sale.credit) return res.status(400).json({ error: "Venta no es a crédito" });
  const amount = +b.amount;
  if (!(amount > 0)) return res.status(400).json({ error: "Monto inválido" });
  // compute already paid
  const paid = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM credit_payments WHERE sale_id = ?").get(b.saleId).s + (sale.paid||0);
  const debt = sale.total - paid;
  if (amount > debt + 0.01) return res.status(400).json({ error: "El monto supera la deuda", debt });
  const id = uid();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO credit_payments (id,sale_id,date,amount,note,user_id) VALUES (?,?,?,?,?,?)")
    .run(id, b.saleId, now, amount, b.note||"", req.user.id);
  // cash entry
  db.prepare("INSERT INTO cash_entries (id,date,type,amount,description,category,ref_id,user_id) VALUES (?,?,?,?,?,?,?,?)")
    .run(uid(), now, "in", amount, `Abono crédito #${b.saleId.slice(-6)}`, "Crédito", b.saleId, req.user.id);
  res.json({ id, debt: debt - amount });
});

module.exports = router;