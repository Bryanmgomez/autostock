require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { db, init } = require("./db");
const { authMiddleware } = require("./auth");

init();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/cash", require("./routes/cash"));
app.use("/api/credits", require("./routes/credits"));
app.use("/api/settings", require("./routes/settings"));

// reports endpoint: aggregate
app.get("/api/reports/summary", authMiddleware, (req, res) => {
  const date = req.query.date; // YYYY-MM-DD
  let sales = db.prepare("SELECT * FROM sales").all();
  if (date) sales = sales.filter(s => s.date.startsWith(date));
  const totalRevenue = sales.reduce((a,s)=>a+s.total,0);
  const cashSales = sales.filter(s=>s.payment_method==="efectivo").reduce((a,s)=>a+s.total,0);
  const creditSales = sales.filter(s=>s.credit).reduce((a,s)=>a+s.total,0);
  const discounts = sales.reduce((a,s)=>a+s.discount,0);
  const iva = sales.reduce((a,s)=>a+s.iva_total,0);
  // top products
  const itemRows = db.prepare("SELECT * FROM sale_items").all();
  const filteredIds = new Set(sales.map(s=>s.id));
  const topMap = {};
  for (const it of itemRows) {
    if (!filteredIds.has(it.sale_id)) continue;
    if (!topMap[it.product_id]) topMap[it.product_id] = { name: it.name, qty:0, revenue:0 };
    topMap[it.product_id].qty += it.qty;
    topMap[it.product_id].revenue += it.price*it.qty - it.discount;
  }
  const topProducts = Object.values(topMap).sort((a,b)=>b.revenue-a.revenue);
  // cash movements
  let cashEntries = db.prepare("SELECT * FROM cash_entries").all();
  if (date) cashEntries = cashEntries.filter(e => e.date.startsWith(date));
  const cashIn = cashEntries.filter(e=>e.type==="in").reduce((a,e)=>a+e.amount,0);
  const cashOut = cashEntries.filter(e=>e.type==="out").reduce((a,e)=>a+e.amount,0);
  // profit (cost)
  let profit = 0;
  for (const s of sales) {
    const its = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(s.id);
    for (const it of its) {
      const p = db.prepare("SELECT cost FROM products WHERE id = ?").get(it.product_id);
      const cost = p ? p.cost : 0;
      profit += (it.price - cost) * it.qty - it.discount;
    }
  }
  // cash session discrepancies
  let sessions = db.prepare("SELECT * FROM cash_sessions").all();
  if (date) sessions = sessions.filter(s => (s.closed_at||s.opened_at).startsWith(date));
  const discrepancies = sessions.filter(s=>s.status==="closed").map(s=>({ id:s.id, difference:s.difference }));
  res.json({ totalSales: sales.length, totalRevenue, cashSales, creditSales, discounts, iva, topProducts, cashIn, cashOut, profit, discrepancies });
});

const path = require("path");
// Serve frontend build
app.use("/assets", express.static(path.join(__dirname, "..", "dist", "assets")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`AutoStock running on http://localhost:${PORT}`));