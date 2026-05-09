import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Heart, Plus } from 'lucide-react';

const Charity = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanner]);

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

  const onScanSuccess = async (decodedText) => {
    stopScanning();
    await addToCart(decodedText);
  };

  const onScanError = (error) => {
    console.warn(`Code scan error = ${error}`);
  };

  const addToCart = async (barcode) => {
    try {
      const response = await fetch(`/api/books/${barcode}`);
      const book = await response.json();

      if (book) {
        const existingItem = cart.find(item => item.barcode === barcode);
        if (existingItem) {
          setCart(cart.map(item =>
            item.barcode === barcode
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ));
        } else {
          setCart([...cart, { ...book, quantity: 1 }]);
        }
      } else {
        alert('Book not found in inventory');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding book to cart');
    }
  };

  const updateQuantity = (barcode, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(barcode);
      return;
    }

    const book = cart.find(item => item.barcode === barcode);
    if (newQuantity > book.quantity) {
      alert('Not enough stock');
      return;
    }

    setCart(cart.map(item =>
      item.barcode === barcode
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (barcode) => {
    setCart(cart.filter(item => item.barcode !== barcode));
  };

  const getTotalBooks = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleFinishDonation = async () => {
    if (cart.length === 0) return;

    try {
      const response = await fetch('/api/charity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            barcode: item.barcode,
            name: item.name,
            quantity: item.quantity
          }))
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Donation completed! Receipt: ${result.donation_number}`);
        printDonationReceipt(result.donation_number);
        setCart([]);
        navigate('/');
      } else {
        alert('Error processing donation');
      }
    } catch (error) {
      console.error('Error during donation:', error);
      alert('Error during donation');
    }
  };

  const printDonationReceipt = (donationNumber) => {
    const receipt = `
DONATION RECEIPT
================

Donation Number: ${donationNumber}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Books Donated:
${cart.map(item => `${item.name} - Quantity: ${item.quantity}`).join('\n')}

Total Books: ${getTotalBooks()}
Total Amount: ₹0.00

Thank you for your generous donation!

================
Bookstore Charity Program
    `;

    // For now, just log to console. In production, integrate with thermal printer
    console.log('Donation Receipt:', receipt);
    alert('Donation receipt printed (check console for details)');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate('/')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center">
          <Heart size={24} className="mr-2 text-red-500" />
          Charity Mode
        </h1>
      </div>

      {/* Scan */}
      <div className="mb-4">
        {!scanning ? (
          <button
            onClick={startScanning}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-4 rounded-lg"
          >
            Scan Book for Donation
          </button>
        ) : (
          <div>
            <div id="reader" className="mb-4"></div>
            <button
              onClick={stopScanning}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Stop Scanning
            </button>
          </div>
        )}
      </div>

      {/* Donation Cart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-4">
        <h2 className="text-lg font-semibold mb-4">Donation Cart ({getTotalBooks()} books)</h2>

        {cart.length === 0 ? (
          <p className="text-gray-500 text-center">No books selected for donation</p>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.barcode} className="border rounded p-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Barcode: {item.barcode}</p>
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() => updateQuantity(item.barcode, item.quantity - 1)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                      >
                        -
                      </button>
                      <span className="mx-3">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.barcode, item.quantity + 1)}
                        className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.barcode)}
                    className="text-red-500 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="text-center text-lg font-bold text-green-600">
            Total Amount: ₹0.00
          </div>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="flex space-x-2">
          <button
            onClick={startScanning}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg"
          >
            <Plus size={20} className="inline mr-2" />
            Add More Books
          </button>
          <button
            onClick={handleFinishDonation}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg"
          >
            <Heart size={20} className="inline mr-2" />
            Finish Donation
          </button>
        </div>
      )}
    </div>
  );
};

export default Charity;