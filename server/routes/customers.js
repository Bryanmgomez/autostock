const express = require("express");
const { db, uid } = require("../db");
const { authMiddleware, requireRole } = require("../auth");

const router = express.Router();
router.use(authMiddleware);

function validateEmail(e){ if(!e) return true; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

router.get("/", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  let rows = db.prepare("SELECT * FROM customers ORDER BY name").all();
  if (q) {
    rows = rows.filter(c =>
      (c.name||"").toLowerCase().includes(q) ||
      (c.last_name||"").toLowerCase().includes(q) ||
      (c.document||"").toLowerCase().includes(q)
    );
  }
  res.json(rows.map(c=>({ ...c, lastName:c.last_name, docType:c.doc_type, createdAt:c.created_at })));
});

router.post("/", (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: "Nombre requerido" });
  if (!b.document) return res.status(400).json({ error: "Documento requerido" });
  if (!validateEmail(b.email)) return res.status(400).json({ error: "Email inválido" });
  const exists = db.prepare("SELECT id FROM customers WHERE document = ?").get(b.document);
  if (exists) return res.status(409).json({ error: "Cliente ya existe con ese documento" });
  const id = uid();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO customers (id,name,last_name,doc_type,document,email,phone,address,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, b.name, b.lastName||b.last_name||"", b.docType||b.doc_type||"CC", b.document, b.email||"", b.phone||"", b.address||"", now);
  res.json({ id });
});

router.put("/:id", (req, res) => {
  const b = req.body || {};
  const c = db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id);
  if (!c) return res.status(404).json({ error: "No encontrado" });
  if (b.email && !validateEmail(b.email)) return res.status(400).json({ error: "Email inválido" });
  if (b.document && b.document !== c.document) {
    const ex = db.prepare("SELECT id FROM customers WHERE document = ?").get(b.document);
    if (ex) return res.status(409).json({ error: "Documento duplicado" });
  }
  db.prepare(`UPDATE customers SET name=?,last_name=?,doc_type=?,document=?,email=?,phone=?,address=? WHERE id=?`)
    .run(b.name??c.name, b.lastName??b.last_name??c.last_name, b.docType??b.doc_type??c.doc_type, b.document??c.document, b.email??c.email, b.phone??c.phone, b.address??c.address, req.params.id);
  res.json({ ok: true });
});

router.delete("/:id", requireRole("gerente"), (req, res) => {
  // prevent delete if sales
  const has = db.prepare("SELECT id FROM sales WHERE customer_id = ?").get(req.params.id);
  if (has) return res.status(400).json({ error: "Cliente tiene ventas asociadas" });
  db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;