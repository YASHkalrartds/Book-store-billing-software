import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, BookOpen, CreditCard, DollarSign, Heart, Download, Database } from 'lucide-react';

const DailySummary = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    totalSales: 0,
    booksSold: 0,
    upiCollection: 0,
    cashCollection: 0,
    charityBooks: 0,
    transactions: 0
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const salesRes = await fetch('/api/sales/today');
      const salesData = await salesRes.json();

      const charityRes = await fetch('/api/charity/today');
      const charityData = await charityRes.json();

      // Get transaction count
      const today = new Date().toISOString().split('T')[0];
      const salesResponse = await fetch('/api/sales');
      const allSales = await salesResponse.json();
      const todaySales = allSales.filter(sale => sale.created_at.startsWith(today));

      setSummary({
        ...salesData,
        charityBooks: charityData.charityBooks,
        transactions: todaySales.length
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleExport = () => {
    window.open('/api/export', '_blank');
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/backup');
      const result = await response.json();
      alert(`Backup created: ${result.path}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate('/')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Daily Summary</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp size={20} className="mr-2" />
          Today's Performance
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded">
            <div className="text-2xl font-bold text-blue-600">₹{summary.totalSales.toFixed(2)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sales</div>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded">
            <div className="text-2xl font-bold text-green-600">{summary.booksSold}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Books Sold</div>
          </div>

          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900 rounded">
            <div className="text-2xl font-bold text-purple-600">₹{summary.upiCollection.toFixed(2)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">UPI Collection</div>
          </div>

          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900 rounded">
            <div className="text-2xl font-bold text-orange-600">₹{summary.cashCollection.toFixed(2)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cash Collection</div>
          </div>

          <div className="text-center p-3 bg-red-50 dark:bg-red-900 rounded">
            <div className="text-2xl font-bold text-red-600">{summary.charityBooks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Charity Books</div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
            <div className="text-2xl font-bold text-gray-600">{summary.transactions}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Transactions</div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center"
          >
            <Download size={20} className="mr-2" />
            Export All Data to Excel
          </button>

          <button
            onClick={handleBackup}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center"
          >
            <Database size={20} className="mr-2" />
            Create Database Backup
          </button>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <h3 className="font-semibold mb-3">Payment Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>UPI Payments:</span>
            <span className="font-medium">₹{summary.upiCollection.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cash Payments:</span>
            <span className="font-medium">₹{summary.cashCollection.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total Revenue:</span>
            <span>₹{summary.totalSales.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummary;