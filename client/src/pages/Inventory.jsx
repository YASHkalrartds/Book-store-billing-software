import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Search, Save, Edit, Trash2, AlertTriangle } from 'lucide-react';

const Inventory = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    quantity: '',
    selling_price: ''
  });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchBooks();
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanner]);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books');
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const startScanning = () => {
    setScanning(true);
    const qrScanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    setScanner(qrScanner);

    qrScanner.render(onScanSuccess, onScanError);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
    setScanning(false);
  };

  const onScanSuccess = (decodedText) => {
    stopScanning();
    setFormData({ ...formData, barcode: decodedText });
  };

  const onScanError = (error) => {
    console.warn(`Code scan error = ${error}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editing ? `/api/books/${editing}` : '/api/books';
      const method = editing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(editing ? 'Book updated!' : 'Book added!');
        setFormData({ barcode: '', name: '', quantity: '', selling_price: '' });
        setEditing(null);
        fetchBooks();
      } else {
        alert('Error saving book');
      }
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Error saving book');
    }
  };

  const handleEdit = (book) => {
    setFormData({
      barcode: book.barcode,
      name: book.name,
      quantity: book.quantity,
      selling_price: book.selling_price
    });
    setEditing(book.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const response = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Book deleted!');
        fetchBooks();
      } else {
        alert('Error deleting book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Error deleting book');
    }
  };

  const filteredBooks = books.filter(book =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockBooks = books.filter(book => book.quantity <= 5);

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate('/')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Inventory Management</h1>
      </div>

      {/* Low Stock Warning */}
      {lowStockBooks.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
          <div className="flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            <span className="font-bold">Low Stock Alert</span>
          </div>
          <p className="mt-1">{lowStockBooks.length} books have low stock (≤5)</p>
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-4">
        <h2 className="text-lg font-semibold mb-4">
          {editing ? 'Edit Book' : 'Add New Book'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Barcode</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="flex-1 p-2 border rounded"
                required
                disabled={editing}
              />
              {!editing && (
                <button
                  type="button"
                  onClick={scanning ? stopScanning : startScanning}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
                >
                  {scanning ? 'Stop' : 'Scan'}
                </button>
              )}
            </div>
            {scanning && <div id="reader" className="mt-2"></div>}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Book Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full p-2 border rounded"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Selling Price (₹)</label>
            <input
              type="number"
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              className="w-full p-2 border rounded"
              required
              step="0.01"
              min="0"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
            >
              <Save size={16} className="mr-2" />
              {editing ? 'Update' : 'Save'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormData({ barcode: '', name: '', quantity: '', selling_price: '' });
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded"
          />
        </div>
      </div>

      {/* Books List */}
      <div className="space-y-2">
        {filteredBooks.map((book) => (
          <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold">{book.name}</h3>
                <p className="text-sm text-gray-600">Barcode: {book.barcode}</p>
                <p className="text-sm text-gray-600">Price: ₹{book.selling_price}</p>
                <p className={`text-sm font-medium ${book.quantity <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                  Stock: {book.quantity}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(book)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;