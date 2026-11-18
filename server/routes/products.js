const express = require("express");
const { db, uid } = require("../db");
const { authMiddleware, requireRole } = require("../auth");

const router = express.Router();
router.use(authMiddleware);

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY name").all();
  res.json(rows.map(r => ({ ...r, price:r.price, cost:r.cost, iva:r.iva, stock:r.stock, minStock:r.min_stock, min_stock:r.min_stock, createdAt:r.created_at })));
});

router.post("/", requireRole("gerente"), (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: "Nombre requerido" });
  const id = uid();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO products (id,name,sku,category,price,cost,iva,stock,min_stock,description,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(id, b.name, b.sku||"", b.category||"Otros", +b.price||0, +b.cost||0, +b.iva||19, +b.stock||0, +b.minStock||+b.min_stock||5, b.description||"", now);
  res.json({ id });
});

router.put("/:id", requireRole("gerente"), (req, res) => {
  const b = req.body || {};
  const p = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!p) return res.status(404).json({ error: "No encontrado" });
  db.prepare(`UPDATE products SET name=?,sku=?,category=?,price=?,cost=?,iva=?,stock=?,min_stock=?,description=? WHERE id=?`)
    .run(b.name??p.name, b.sku??p.sku, b.category??p.category, + (b.price??p.price), +(b.cost??p.cost), +(b.iva??p.iva), +(b.stock??p.stock), +(b.minStock??b.min_stock??p.min_stock), b.description??p.description, req.params.id);
  res.json({ ok: true });
});

router.delete("/:id", requireRole("gerente"), (req, res) => {
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;