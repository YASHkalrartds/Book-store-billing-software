# Bookstore Billing and Inventory Management Software

A modern, mobile-first bookstore billing and inventory management software designed for small bookstore owners. Built with React, Node.js, and SQLite for fast, offline-friendly operations.

## Features

### Main Dashboard
- Quick access to Sell Books, Add Inventory, and Charity Mode
- Real-time display of today's sales, books sold, and payment collections

### Sell Books Module
- Fast barcode scanning using mobile camera
- Manual barcode entry option
- Dynamic cart management with quantity controls
- Price editing capability
- UPI and Cash payment options
- Automatic receipt generation with invoice numbers (INV-2026-XXX)
- Thermal printer support for receipts

### Inventory Management
- Add books via barcode scan or manual entry
- Automatic duplicate detection and stock updates
- Search functionality by book name or barcode
- Low stock warnings
- Edit and delete book records

### Charity Mode
- Scan books for donation
- Automatic ₹0 pricing
- Donation receipt generation with numbers (DON-2026-XXX)
- Inventory updates for donated books

### Daily Summary
- Comprehensive sales and transaction reports
- Payment method breakdowns
- Charity donation tracking
- Excel export functionality
- Database backup options

## Tech Stack

### Frontend
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- html5-qrcode (barcode scanning)
- jsPDF (PDF generation)
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- SQLite (database)
- ExcelJS (Excel export)
- CORS support

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Book-store-billing-software
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Start the servers**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm start

   # Terminal 2: Start frontend
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Database

The application uses SQLite for local data storage. The database file is created automatically at `database/bookstore.db` with the following tables:

- `books`: Inventory management
- `sales`: Transaction records
- `charity`: Donation records
- `settings`: Application settings and counters

## API Endpoints

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:barcode` - Get book by barcode
- `POST /api/books` - Add/update book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `GET /api/books/search/:query` - Search books

### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales/today` - Get today's sales summary

### Charity
- `POST /api/charity` - Create donation
- `GET /api/charity/today` - Get today's charity summary

### Data Management
- `GET /api/export` - Export all data to Excel
- `GET /api/backup` - Create database backup

## Usage Workflow

1. **Daily Operations**
   - Open app on mobile/tablet
   - Use "Sell Books" for customer transactions
   - Use "Add Inventory" to manage stock
   - Use "Charity Mode" for donations

2. **Billing Process**
   - Scan book barcodes or enter manually
   - Adjust quantities and prices if needed
   - Select payment method (UPI/Cash)
   - Generate and print receipt

3. **Inventory Management**
   - Scan or enter book details
   - System detects duplicates and updates stock
   - Monitor low stock alerts

4. **Reporting**
   - View daily summaries
   - Export data to Excel
   - Create database backups

## Mobile Optimization

- Touch-friendly large buttons
- Responsive design for phones and tablets
- Fast animations and transitions
- One-handed operation support
- Offline functionality

## Offline Support

The application works completely offline:
- All data stored locally in SQLite
- No internet required for core operations
- Sync when connection available (future enhancement)

## Printing Support

- Thermal printer integration ready
- Professional receipt formatting
- PDF download option
- Share receipt functionality

## Security & Backup

- Local SQLite database
- Automatic daily backups
- Excel export for data portability
- No cloud dependencies

## Development

### Project Structure
```
bookstore-billing-software/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── server.js          # Express server
│   └── package.json
├── database/               # SQLite database
└── README.md
```

### Building for Production

```bash
# Build frontend
cd client
npm run build

# The built files will be in client/dist/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.