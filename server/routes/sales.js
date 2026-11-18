const express = require("express");
const { db, uid } = require("../db");
const { authMiddleware, requireRole } = require("../auth");

const router = express.Router();
router.use(authMiddleware);

const PAYMENT_METHODS = ["efectivo","tarjeta","transferencia","credito"];

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM sales ORDER BY date DESC").all();
  const itemsBySale = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?");
  const out = rows.map(s => {
    const items = itemsBySale.all(s.id).map(i=>({ id:i.id, productId:i.product_id, name:i.name, qty:i.qty, price:i.price, iva:i.iva, discount:i.discount }));
    return { id:s.id, date:s.date, customerId:s.customer_id, customerName:s.customer_name, items, subtotal:s.subtotal, ivaTotal:s.iva_total, discount:s.discount, total:s.total, paymentMethod:s.payment_method, paid:s.paid, credit:!!s.credit, notes:s.notes, userId:s.user_id };
  });
  res.json(out);
});

router.post("/", (req, res) => {
  const b = req.body || {};
  const items = Array.isArray(b.items) ? b.items : [];
  if (items.length === 0) return res.status(400).json({ error: "Sin productos" });
  if (!PAYMENT_METHODS.includes(b.paymentMethod)) return res.status(400).json({ error: "Método inválido" });

  // validate items + stock
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let ivaTotal = 0;
  const prepared = [];
  for (const it of items) {
    const p = db.prepare("SELECT * FROM products WHERE id = ?").get(it.productId);
    if (!p) return res.status(400).json({ error: "Producto no encontrado" });
    const qty = +it.qty;
    if (!(qty > 0)) return res.status(400).json({ error: "Cantidad inválida" });
    if (p.stock < qty) return res.status(400).json({ error: `Stock insuficiente para ${p.name}` });
    const price = +it.price || p.price;
    const disc = Math.max(0, +it.discount || 0);
    const lineSub = price * qty;
    if (disc > lineSub) return res.status(400).json({ error: "Descuento mayor al subtotal de línea" });
    const lineNet = lineSub - disc;
    const lineIva = lineNet * (p.iva / 100);
    subtotal += lineSub;
    itemDiscountTotal += disc;
    ivaTotal += lineIva;
    prepared.push({ product:p, qty, price, disc, lineIva });
  }
  const globalDiscount = Math.max(0, +b.discount || 0);
  const netAfterGlobal = subtotal - itemDiscountTotal - globalDiscount;
  if (globalDiscount > (subtotal - itemDiscountTotal)) return res.status(400).json({ error: "Descuento global excede el subtotal" });
  const total = netAfterGlobal + ivaTotal;
  const credit = b.paymentMethod === "credito";
  let paid = +b.paid || 0;
  if (!credit) {
    if (paid <= 0) paid = total;
    if (paid < total) return res.status(400).json({ error: `Faltan ${total - paid}`, missing: total - paid });
  } else {
    if (paid < 0) paid = 0;
    if (paid > total) paid = total;
  }

  const id = uid();
  const now = new Date().toISOString();
  const insertSale = db.prepare(`INSERT INTO sales (id,date,customer_id,customer_name,subtotal,iva_total,discount,total,payment_method,paid,credit,notes,user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  insertSale.run(id, now, b.customerId||null, b.customerName||"Cliente general", subtotal, ivaTotal, globalDiscount + itemDiscountTotal, total, b.paymentMethod, paid, credit?1:0, b.notes||"", req.user.id);

  const insertItem = db.prepare(`INSERT INTO sale_items (id,sale_id,product_id,name,qty,price,iva,discount) VALUES (?,?,?,?,?,?,?,?)`);
  for (const pr of prepared) {
    insertItem.run(uid(), id, pr.product.id, pr.product.name, pr.qty, pr.price, pr.lineIva, pr.disc);
    db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(pr.qty, pr.product.id);
  }

  // cash entry
  if (b.paymentMethod === "efectivo" && paid > 0) {
    db.prepare("INSERT INTO cash_entries (id,date,type,amount,description,category,ref_id,user_id) VALUES (?,?,?,?,?,?,?,?)")
      .run(uid(), now, "in", paid, `Venta #${id.slice(-6)}`, "Venta", id, req.user.id);
  }
  if (credit && paid > 0) {
    db.prepare("INSERT INTO cash_entries (id,date,type,amount,description,category,ref_id,user_id) VALUES (?,?,?,?,?,?,?,?)")
      .run(uid(), now, "in", paid, `Abono inicial crédito #${id.slice(-6)}`, "Crédito", id, req.user.id);
  }

  res.json({ id, total, paid, change: Math.max(0, paid - total), missing: 0 });
});

module.exports = router;