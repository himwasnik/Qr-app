import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CreditCard, Calendar, CheckCircle, XCircle } from 'lucide-react';
import PaymentPage from './PaymentPage';

const SubscriptionPage = () => {
  const { API_URL, token } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [showPaymentPage, setShowPaymentPage] = useState(false);

  // Fetch subscription details on mount
  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const fetchSubscriptionDetails = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_URL}/restaurants/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscriptionData(res.data);
    } catch (error) {
      console.error('Failed to load subscription details:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentPage(false);
    // Refresh subscription details after successful payment
    fetchSubscriptionDetails();
  };

  const restaurant = subscriptionData?.restaurant;
  const isActive = restaurant?.subscription_status === 'active' && !subscriptionData?.isExpired;
  const subscriptionExpiry = subscriptionData?.subscriptionExpiry ? new Date(subscriptionData.subscriptionExpiry) : null;
  const daysRemaining = subscriptionExpiry ? Math.ceil((subscriptionExpiry - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  if (refreshing) {
    return <div className="text-center py-6">Loading subscription details...</div>;
  }

  if (showPaymentPage) {
    return (
      <div>
        <button
          onClick={() => setShowPaymentPage(false)}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back
        </button>
        <PaymentPage onPaymentSuccess={handlePaymentSuccess} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Subscription</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isActive ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isActive ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">Current Status</h2>
              <p className={`text-lg font-medium capitalize ${
                isActive ? 'text-green-600' : 'text-red-600'
              }`}>
                {subscriptionData?.isExpired ? 'Expired' : restaurant?.subscription_status || 'unknown'}
              </p>
            </div>
          </div>

          {!isActive && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Your subscription is {subscriptionData?.isExpired ? 'expired' : 'inactive'}. Please renew your subscription to continue using the service.
              </p>
            </div>
          )}

          {subscriptionExpiry && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {isActive ? 'Expires on' : 'Expired on'}: {subscriptionExpiry.toLocaleDateString()}
                </span>
              </div>
              {isActive && daysRemaining > 0 && (
                <div className="text-sm font-semibold text-blue-900">
                  {daysRemaining} days remaining
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Plan Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Plan</span>
              <span className="font-medium">Monthly Subscription</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Price</span>
              <span className="font-medium">₹500/month or $7/month</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Billing Cycle</span>
              <span className="font-medium">Monthly</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Renew Subscription</h2>
        <p className="text-gray-600 mb-4">
          Renew your subscription to continue using all features. ₹500 for 30 days.
        </p>
        <button
          onClick={() => setShowPaymentPage(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          <CreditCard className="w-5 h-5" />
          {loading ? 'Processing...' : 'Renew Now'}
        </button>
      </div>

      {subscriptionData?.paymentHistory && subscriptionData.paymentHistory.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Amount</th>
                  <th className="text-left py-2 px-2">Method</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionData.paymentHistory.map((payment, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 px-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td className="py-2 px-2">₹{(payment.amount_cents / 100).toFixed(2)}</td>
                    <td className="py-2 px-2 capitalize">{payment.payment_method}</td>
                    <td className="py-2 px-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        payment.payment_status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.payment_status}
                      </span>
                    </td>
                    <td className="py-2 px-2">{new Date(payment.subscription_expiry).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 bg-gray-50 rounded-xl border p-6">
        <h3 className="font-semibold mb-3">What's Included</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Unlimited menu items</li>
          <li>✓ Unlimited categories</li>
          <li>✓ Custom QR code</li>
          <li>✓ Image uploads for menu items</li>
          <li>✓ Public menu page</li>
          <li>✓ Real-time menu updates</li>
          <li>✓ Mobile-friendly menu viewer</li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionPage;
