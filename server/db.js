const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "autostock.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('gerente','cajero')),
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT,
      category TEXT,
      price REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      iva REAL NOT NULL DEFAULT 19,
      stock REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 5,
      description TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      last_name TEXT,
      doc_type TEXT NOT NULL DEFAULT 'CC',
      document TEXT UNIQUE NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      iva_total REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL,
      paid REAL NOT NULL DEFAULT 0,
      credit INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      user_id TEXT,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    );
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT,
      name TEXT NOT NULL,
      qty REAL NOT NULL,
      price REAL NOT NULL,
      iva REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS cash_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('in','out')),
      amount REAL NOT NULL,
      description TEXT,
      category TEXT,
      ref_id TEXT,
      user_id TEXT
    );
    CREATE TABLE IF NOT EXISTS cash_sessions (
      id TEXT PRIMARY KEY,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      opening_amount REAL NOT NULL DEFAULT 0,
      closing_amount REAL,
      expected_amount REAL,
      difference REAL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
      user_id TEXT
    );
    CREATE TABLE IF NOT EXISTS credit_payments (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      user_id TEXT,
      FOREIGN KEY(sale_id) REFERENCES sales(id)
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // seed if empty
  const userCount = db.prepare("SELECT COUNT(*) c FROM users").get().c;
  if (userCount === 0) {
    const bcrypt = require("bcryptjs");
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    const now = new Date().toISOString();
    const hash = (p) => bcrypt.hashSync(p, 10);
    db.prepare("INSERT INTO users (id,username,password_hash,role,name,created_at) VALUES (?,?,?,?,?,?)")
      .run(uid(), "gerente", hash("gerente123"), "gerente", "Gerente General", now);
    db.prepare("INSERT INTO users (id,username,password_hash,role,name,created_at) VALUES (?,?,?,?,?,?)")
      .run(uid(), "cajero", hash("cajero123"), "cajero", "Cajero Principal", now);

    const products = [
      ["Cuaderno 100 hojas","CUA-100","Papelería",8500,5200,19,45,10,"Cuaderno cuadriculado 100 hojas"],
      ["Lápiz HB","LAP-HB","Escolar",1200,600,19,120,20,"Lápiz grafito HB"],
      ["Bolígrafo azul","BOL-AZ","Papelería",2500,1200,19,80,15,"Bolígrafo tinta azul"],
      ["Resma papel carta","RES-CAR","Oficina",18000,13500,19,25,5,"Resma 500 hojas carta"],
      ["Marcador permanente","MAR-PER","Arte",4500,2500,19,8,10,"Marcador permanente negro"],
      ["Tijeras escolares","TIJ-ESC","Escolar",6000,3500,19,30,8,"Tijeras punta roma"],
      ["Pegante en barra","PEG-BAR","Escolar",3500,1800,19,50,10,"Pegante en barra 21g"],
      ["Carpeta plástica","CAR-PLA","Oficina",5000,2800,19,3,8,"Carpeta plástica oficio"],
      ["Resaltador amarillo","RES-AMA","Papelería",3000,1500,19,60,12,"Resaltador fluorescente"],
      ["Corrector líquido","COR-LIQ","Papelería",4000,2000,19,22,8,"Corrector líquido 18ml"],
    ];
    const insP = db.prepare("INSERT INTO products (id,name,sku,category,price,cost,iva,stock,min_stock,description,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    for (const p of products) insP.run(uid(), ...p, now);

    const customers = [
      ["María","García","CC","1020304050","maria@example.com","3001234567","Calle 10 #5-20"],
      ["Juan","Pérez","CC","9876543210","juan@example.com","3109876543","Carrera 20 #15-30"],
      ["Empresa","ABC S.A.S","NIT","900123456","compras@abc.com","6041234567","Av. Principal #100"],
    ];
    const insC = db.prepare("INSERT INTO customers (id,name,last_name,doc_type,document,email,phone,address,created_at) VALUES (?,?,?,?,?,?,?,?,?)");
    for (const c of customers) insC.run(uid(), ...c, now);

    db.prepare("INSERT INTO cash_entries (id,date,type,amount,description,category,user_id) VALUES (?,?,?,?,?,?,?)")
      .run(uid(), now, "in", 200000, "Apertura de caja", "Apertura", null);

    db.prepare("INSERT INTO settings (key,value) VALUES (?,?)").run("iva_default","19");
    db.prepare("INSERT INTO settings (key,value) VALUES (?,?)").run("allow_credit","1");
  }
}

module.exports = { db, init };
module.exports.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);