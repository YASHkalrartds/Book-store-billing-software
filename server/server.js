const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const dbPath = path.join(__dirname, '../database/bookstore.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Books table
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    selling_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Sales table
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    cash_received REAL,
    change_amount REAL,
    items TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Charity donations table
  db.run(`CREATE TABLE IF NOT EXISTS charity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donation_number TEXT UNIQUE,
    items TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Settings table for counters
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  // Initialize counters
  db.get("SELECT value FROM settings WHERE key = 'invoice_counter'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO settings (key, value) VALUES ('invoice_counter', '0')");
    }
  });

  db.get("SELECT value FROM settings WHERE key = 'donation_counter'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO settings (key, value) VALUES ('donation_counter', '0')");
    }
  });
});

// API Routes

// Get all books
app.get('/api/books', (req, res) => {
  db.all("SELECT * FROM books ORDER BY name", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get book by barcode
app.get('/api/books/:barcode', (req, res) => {
  db.get("SELECT * FROM books WHERE barcode = ?", [req.params.barcode], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// Add or update book
app.post('/api/books', (req, res) => {
  const { barcode, name, quantity, selling_price } = req.body;

  // Check if book exists
  db.get("SELECT * FROM books WHERE barcode = ?", [barcode], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      // Update quantity
      const newQuantity = row.quantity + parseInt(quantity);
      db.run("UPDATE books SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE barcode = ?",
        [newQuantity, barcode], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Stock updated', id: row.id });
      });
    } else {
      // Insert new book
      db.run("INSERT INTO books (barcode, name, quantity, selling_price) VALUES (?, ?, ?, ?)",
        [barcode, name, quantity, selling_price], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Book added', id: this.lastID });
      });
    }
  });
});

// Update book
app.put('/api/books/:id', (req, res) => {
  const { name, quantity, selling_price } = req.body;
  db.run("UPDATE books SET name = ?, quantity = ?, selling_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [name, quantity, selling_price, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Book updated' });
  });
});

// Delete book
app.delete('/api/books/:id', (req, res) => {
  db.run("DELETE FROM books WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Book deleted' });
  });
});

// Search books
app.get('/api/books/search/:query', (req, res) => {
  const query = `%${req.params.query}%`;
  db.all("SELECT * FROM books WHERE name LIKE ? OR barcode LIKE ?", [query, query], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create sale
app.post('/api/sales', (req, res) => {
  const { items, payment_method, cash_received } = req.body;

  // Calculate total
  let total = 0;
  items.forEach(item => {
    total += item.price * item.quantity;
  });

  // Generate invoice number
  const year = new Date().getFullYear();
  db.get("SELECT value FROM settings WHERE key = 'invoice_counter'", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    let counter = parseInt(row.value) + 1;
    const invoiceNumber = `INV-${year}-${counter.toString().padStart(3, '0')}`;

    // Update counter
    db.run("UPDATE settings SET value = ? WHERE key = 'invoice_counter'", [counter]);

    let change_amount = null;
    if (payment_method === 'Cash' && cash_received) {
      change_amount = cash_received - total;
    }

    db.run("INSERT INTO sales (invoice_number, total_amount, payment_method, cash_received, change_amount, items) VALUES (?, ?, ?, ?, ?, ?)",
      [invoiceNumber, total, payment_method, cash_received || null, change_amount, JSON.stringify(items)], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Update inventory
      items.forEach(item => {
        db.run("UPDATE books SET quantity = quantity - ? WHERE barcode = ?", [item.quantity, item.barcode]);
      });

      res.json({ invoice_number: invoiceNumber, total_amount: total, change_amount });
    });
  });
});

// Get today's sales summary
app.get('/api/sales/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.all("SELECT * FROM sales WHERE DATE(created_at) = ?", [today], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    let totalSales = 0;
    let booksSold = 0;
    let upiCollection = 0;
    let cashCollection = 0;

    rows.forEach(sale => {
      totalSales += sale.total_amount;
      const items = JSON.parse(sale.items);
      items.forEach(item => booksSold += item.quantity);
      if (sale.payment_method === 'UPI') upiCollection += sale.total_amount;
      else cashCollection += sale.total_amount;
    });

    res.json({ totalSales, booksSold, upiCollection, cashCollection });
  });
});

// Create charity donation
app.post('/api/charity', (req, res) => {
  const { items } = req.body;

  // Generate donation number
  const year = new Date().getFullYear();
  db.get("SELECT value FROM settings WHERE key = 'donation_counter'", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    let counter = parseInt(row.value) + 1;
    const donationNumber = `DON-${year}-${counter.toString().padStart(3, '0')}`;

    // Update counter
    db.run("UPDATE settings SET value = ? WHERE key = 'donation_counter'", [counter]);

    db.run("INSERT INTO charity (donation_number, items) VALUES (?, ?)",
      [donationNumber, JSON.stringify(items)], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Update inventory
      items.forEach(item => {
        db.run("UPDATE books SET quantity = quantity - ? WHERE barcode = ?", [item.quantity, item.barcode]);
      });

      res.json({ donation_number: donationNumber });
    });
  });
});

// Get today's charity summary
app.get('/api/charity/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.all("SELECT * FROM charity WHERE DATE(created_at) = ?", [today], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    let charityBooks = 0;
    rows.forEach(donation => {
      const items = JSON.parse(donation.items);
      items.forEach(item => charityBooks += item.quantity);
    });

    res.json({ charityBooks });
  });
});

// Export to Excel
app.get('/api/export', (req, res) => {
  const workbook = new ExcelJS.Workbook();

  // Books sheet
  const booksSheet = workbook.addWorksheet('Books');
  booksSheet.columns = [
    { header: 'Barcode', key: 'barcode' },
    { header: 'Name', key: 'name' },
    { header: 'Quantity', key: 'quantity' },
    { header: 'Selling Price', key: 'selling_price' }
  ];

  db.all("SELECT barcode, name, quantity, selling_price FROM books", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    rows.forEach(row => booksSheet.addRow(row));

    // Sales sheet
    const salesSheet = workbook.addWorksheet('Sales');
    salesSheet.columns = [
      { header: 'Invoice Number', key: 'invoice_number' },
      { header: 'Total Amount', key: 'total_amount' },
      { header: 'Payment Method', key: 'payment_method' },
      { header: 'Created At', key: 'created_at' }
    ];

    db.all("SELECT invoice_number, total_amount, payment_method, created_at FROM sales", (err, salesRows) => {
      if (err) return res.status(500).json({ error: err.message });

      salesRows.forEach(row => salesSheet.addRow(row));

      // Charity sheet
      const charitySheet = workbook.addWorksheet('Charity');
      charitySheet.columns = [
        { header: 'Donation Number', key: 'donation_number' },
        { header: 'Items', key: 'items' },
        { header: 'Created At', key: 'created_at' }
      ];

      db.all("SELECT donation_number, items, created_at FROM charity", (err, charityRows) => {
        if (err) return res.status(500).json({ error: err.message });

        charityRows.forEach(row => charitySheet.addRow(row));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=bookstore-data.xlsx');

        workbook.xlsx.write(res).then(() => {
          res.end();
        });
      });
    });
  });
});

// Backup database
app.get('/api/backup', (req, res) => {
  const backupPath = path.join(__dirname, '../database/backup-' + new Date().toISOString().split('T')[0] + '.db');
  fs.copyFile(dbPath, backupPath, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Backup created', path: backupPath });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});