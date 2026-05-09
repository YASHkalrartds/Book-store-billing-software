import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Plus, Minus, Trash2, CreditCard, DollarSign, Search } from 'lucide-react';

const SellBooks = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [cashReceived, setCashReceived] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  const scannerRef = useRef(null);

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

  const editPrice = (barcode, newPrice) => {
    setCart(cart.map(item =>
      item.barcode === barcode
        ? { ...item, selling_price: parseFloat(newPrice) }
        : item
    ));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.selling_price * item.quantity), 0);
  };

  const getTotalBooks = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            barcode: item.barcode,
            name: item.name,
            price: item.selling_price,
            quantity: item.quantity
          })),
          payment_method: paymentMethod,
          cash_received: paymentMethod === 'Cash' ? parseFloat(cashReceived) : null
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Sale completed! Invoice: ${result.invoice_number}`);
        setCart([]);
        setShowCheckout(false);
        navigate('/');
      } else {
        alert('Error processing sale');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Error during checkout');
    }
  };

  const changeAmount = paymentMethod === 'Cash' && cashReceived
    ? parseFloat(cashReceived) - getTotal()
    : 0;

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate('/')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Sell Books</h1>
      </div>

      {!showCheckout ? (
        <>
          {/* Scan/Manual Entry */}
          <div className="mb-4">
            {!scanning ? (
              <div className="space-y-2">
                <button
                  onClick={startScanning}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg"
                >
                  Scan Barcode
                </button>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter barcode manually"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    onClick={() => {
                      if (manualBarcode) {
                        addToCart(manualBarcode);
                        setManualBarcode('');
                      }
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div id="reader" ref={scannerRef} className="mb-4"></div>
                <button
                  onClick={stopScanning}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Stop Scanning
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-4">
            <h2 className="text-lg font-semibold mb-4">Cart ({getTotalBooks()} books)</h2>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center">No items in cart</p>
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
                            className="bg-red-500 text-white px-2 py-1 rounded"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="mx-3">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.barcode, item.quantity + 1)}
                            className="bg-green-500 text-white px-2 py-1 rounded"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <input
                          type="number"
                          value={item.selling_price}
                          onChange={(e) => editPrice(item.barcode, e.target.value)}
                          className="mt-2 w-20 p-1 border rounded text-sm"
                          step="0.01"
                        />
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{(item.selling_price * item.quantity).toFixed(2)}</p>
                        <button
                          onClick={() => removeFromCart(item.barcode)}
                          className="text-red-500 mt-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{getTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg"
            >
              Checkout
            </button>
          )}
        </>
      ) : (
        /* Checkout */
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <h2 className="text-lg font-semibold mb-4">Checkout</h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Payment Method</p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`flex-1 py-2 px-4 rounded ${paymentMethod === 'UPI' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                <CreditCard size={16} className="inline mr-2" />
                UPI
              </button>
              <button
                onClick={() => setPaymentMethod('Cash')}
                className={`flex-1 py-2 px-4 rounded ${paymentMethod === 'Cash' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
              >
                <DollarSign size={16} className="inline mr-2" />
                Cash
              </button>
            </div>
          </div>

          {paymentMethod === 'Cash' && (
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Cash Received</label>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full p-2 border rounded"
                step="0.01"
                placeholder="Enter amount received"
              />
              {cashReceived && (
                <p className="text-sm mt-2">
                  Change: ₹{changeAmount.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            {cart.map((item) => (
              <div key={item.barcode} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>₹{(item.selling_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span>₹{getTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowCheckout(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded"
            >
              Back
            </button>
            <button
              onClick={handleCheckout}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded"
            >
              Complete Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellBooks;