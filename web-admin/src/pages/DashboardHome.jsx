import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Menu, FolderOpen, QrCode, TrendingUp, AlertCircle } from 'lucide-react';

const DashboardHome = () => {
  const { restaurant, API_URL } = useAuth();
  const [stats, setStats] = useState({ items: 0, categories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/menu/items`),
        axios.get(`${API_URL}/menu/categories`),
      ]);

      setStats({
        items: itemsRes.data.items.length,
        categories: categoriesRes.data.categories.length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInactive = restaurant?.subscriptionStatus !== 'active';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back to {restaurant?.name}</p>
      </div>

      {isInactive && (
        <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 text-lg">Subscription Inactive</h3>
            <p className="text-red-700 mt-1">
              Your subscription is currently {restaurant?.subscriptionStatus}. Please update your
              payment method to continue using the service.
            </p>
            <Link
              to="/dashboard/subscription"
              className="inline-block mt-3 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Manage Subscription
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Menu Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.items}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Menu className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Categories</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.categories}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Subscription</p>
              <p className="text-lg font-bold text-gray-900 mt-2 capitalize">
                {restaurant?.subscriptionStatus}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isInactive ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <TrendingUp className={`w-6 h-6 ${isInactive ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
        </div>

        <Link
          to="/dashboard/qr-code"
          className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-sm p-6 text-white hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">QR Code</p>
              <p className="text-lg font-bold mt-2">Download</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/dashboard/menu"
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <p className="font-medium text-gray-900">Manage Menu Items</p>
              <p className="text-sm text-gray-600 mt-1">Add, edit, or remove items from your menu</p>
            </Link>
            <Link
              to="/dashboard/categories"
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <p className="font-medium text-gray-900">Organize Categories</p>
              <p className="text-sm text-gray-600 mt-1">Create and manage menu categories</p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Info</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Restaurant Name</p>
              <p className="font-medium text-gray-900 mt-1">{restaurant?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Menu URL</p>
              <p className="font-medium text-gray-900 mt-1 text-sm">
                {window.location.origin}/menu/{restaurant?.slug}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
