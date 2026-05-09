import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SellBooks from './pages/SellBooks';
import Inventory from './pages/Inventory';
import Charity from './pages/Charity';
import DailySummary from './pages/DailySummary';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sell" element={<SellBooks />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/charity" element={<Charity />} />
          <Route path="/summary" element={<DailySummary />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;