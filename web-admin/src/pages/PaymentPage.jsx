import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CreditCard, Smartphone, Building2, CheckCircle, AlertCircle } from 'lucide-react';

const PaymentPage = ({ onPaymentSuccess }) => {
  const { API_URL } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const amountCents = 50000; // ₹500 for 30-day subscription

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        `${API_URL}/payments/initiate`,
        {
          paymentMethod,
          amountCents,
        }
      );

      setPaymentData(res.data);
      setPaymentInitiated(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const handlePaymentComplete = async () => {
    try {
      setLoading(true);
      // Simulate payment confirmation
      // In production, this would be triggered by webhook from payment gateway
      await axios.post(
        `${API_URL}/payments/confirm`,
        {
          paymentId: paymentData.paymentId,
          restaurantId: null, // This would be filled by backend from auth
          paymentStatus: 'success',
          transactionId: `TXN_${Date.now()}`,
        }
      );

      onPaymentSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  if (paymentInitiated && paymentData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Instructions</h2>
              <p className="text-gray-600">{paymentData.instructions?.title}</p>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
            <p className="text-3xl font-bold text-blue-600">{paymentData.amount}</p>
            <p className="text-sm text-gray-600 mt-2">Subscription for 30 days</p>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Steps to Complete Payment:</h3>
            <ol className="space-y-2">
              {paymentData.instructions?.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5 text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* UPI ID Highlight Box */}
          {paymentData.instructions?.upiId && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <p className="text-sm text-gray-600 mb-2 font-semibold">Send Payment To:</p>
              <p className="text-xl font-bold text-yellow-700 text-center break-all">
                {paymentData.instructions.upiId}
              </p>
              <p className="text-xs text-yellow-600 mt-2 text-center">Click to copy and paste in your UPI app</p>
            </div>
          )}

          {/* Note */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{paymentData.instructions?.note}</p>
            </div>
          </div>

          {/* Simulate Payment Completion Button (For Testing) */}
          <button
            onClick={handlePaymentComplete}
            disabled={loading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Processing...' : 'Confirm Payment Completed'}
          </button>

          <p className="text-xs text-gray-600 mt-4 text-center">
            In production, this would be handled automatically by the payment gateway
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Payment Method</h2>

        <div className="space-y-3">
          {/* UPI Option */}
          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                 style={{ borderColor: paymentMethod === 'upi' ? '#2563eb' : '#e5e7eb', 
                          backgroundColor: paymentMethod === 'upi' ? '#eff6ff' : 'transparent' }}>
            <input
              type="radio"
              value="upi"
              checked={paymentMethod === 'upi'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-4 h-4"
            />
            <Smartphone className="w-6 h-6 ml-4 text-blue-600" />
            <div className="ml-4 flex-1">
              <h3 className="font-semibold text-gray-900">UPI Payment</h3>
              <p className="text-sm text-gray-600">Google Pay, PhonePe, Paytm, etc.</p>
            </div>
          </label>

          {/* Net Banking Option */}
          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                 style={{ borderColor: paymentMethod === 'netbanking' ? '#2563eb' : '#e5e7eb',
                          backgroundColor: paymentMethod === 'netbanking' ? '#eff6ff' : 'transparent' }}>
            <input
              type="radio"
              value="netbanking"
              checked={paymentMethod === 'netbanking'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-4 h-4"
            />
            <Building2 className="w-6 h-6 ml-4 text-blue-600" />
            <div className="ml-4 flex-1">
              <h3 className="font-semibold text-gray-900">Net Banking</h3>
              <p className="text-sm text-gray-600">All major banks supported</p>
            </div>
          </label>
        </div>
      </div>

      {/* Price Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-700">30-Day Subscription</span>
          <span className="font-semibold text-gray-900">₹500</span>
        </div>
        <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-blue-600">₹500</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Proceed Button */}
      <button
        onClick={handleInitiatePayment}
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
      >
        <CreditCard className="w-5 h-5" />
        {loading ? 'Processing...' : 'Proceed to Payment'}
      </button>
    </div>
  );
};

export default PaymentPage;
