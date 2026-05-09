import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, Heart, TrendingUp, BookOpen, CreditCard, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSales: 0,
    booksSold: 0,
    upiCollection: 0,
    cashCollection: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const salesRes = await fetch('/api/sales/today');
      const salesData = await salesRes.json();

      const charityRes = await fetch('/api/charity/today');
      const charityData = await charityRes.json();

      setStats({ ...salesData, charityBooks: charityData.charityBooks });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white">
        Bookstore Billing
      </h1>

      {/* Main Buttons */}
      <div className="space-y-4 mb-8">
        <button
          onClick={() => navigate('/sell')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded-lg text-lg flex items-center justify-center space-x-3 transition-colors"
        >
          <ShoppingCart size={24} />
          <span>Sell Books</span>
        </button>

        <button
          onClick={() => navigate('/inventory')}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-4 rounded-lg text-lg flex items-center justify-center space-x-3 transition-colors"
        >
          <Package size={24} />
          <span>Add Inventory</span>
        </button>

        <button
          onClick={() => navigate('/charity')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-6 px-4 rounded-lg text-lg flex items-center justify-center space-x-3 transition-colors"
        >
          <Heart size={24} />
          <span>Charity Mode</span>
        </button>
      </div>

      {/* Today's Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
          <TrendingUp size={20} className="mr-2" />
          Today's Summary
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">₹{stats.totalSales.toFixed(2)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sales</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.booksSold}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Books Sold</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">₹{stats.upiCollection.toFixed(2)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">UPI Collection</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">₹{stats.cashCollection.toFixed(2)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cash Collection</div>
          </div>
        </div>

        <button
          onClick={() => navigate('/summary')}
          className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors"
        >
          View Full Summary
        </button>
      </div>
    </div>
  );
};

export default Dashboard;