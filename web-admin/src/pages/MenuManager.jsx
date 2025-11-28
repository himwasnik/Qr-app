import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';

const MenuManager = () => {
  const { API_URL } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_cents: '',
    currency: 'INR',
    category_id: '',
    is_available: true,
    is_vegetarian: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/menu/items`),
        axios.get(`${API_URL}/menu/categories`),
      ]);
      setItems(itemsRes.data.items);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error('Failed to load menu:', error);
      alert('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API_URL}/menu/items/${editingItem.id}`, formData);
      } else {
        await axios.post(`${API_URL}/menu/items`, formData);
      }
      loadData();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await axios.delete(`${API_URL}/menu/items/${id}`);
      loadData();
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  const handleUploadPhoto = async (itemId, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    try {
      await axios.post(`${API_URL}/menu/items/${itemId}/upload-photo`, formData);
      loadData();
    } catch (error) {
      alert('Failed to upload photo');
    }
  };

  const handleUploadMenuCard = async (file) => {
    if (!file) {
      alert('Please select a file');
      return;
    }
    
    const formData = new FormData();
    formData.append('menuPhoto', file);
    try {
      const response = await axios.post(`${API_URL}/restaurants/me/upload-menu-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Menu card photo uploaded successfully');
      loadData();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || 'Failed to upload menu card photo');
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price_cents: item.price_cents,
        currency: item.currency,
        category_id: item.category_id || '',
        is_available: item.is_available,
        is_vegetarian: item.is_vegetarian,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price_cents: '',
        currency: 'INR',
        category_id: '',
        is_available: true,
        is_vegetarian: false,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
            {item.photo_url && (
              <img
                src={item.photo_url}
                alt={item.name}
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
            )}
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            <p className="text-lg font-bold text-blue-600 mt-2">
              {item.currency} {(item.price_cents / 100).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">{item.category_name || 'No category'}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => openModal(item)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer">
                <Upload className="w-4 h-4" />
                Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleUploadPhoto(item.id, e.target.files[0])}
                />
              </label>
              <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Menu Card Photo</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleUploadMenuCard(e.target.files[0])}
          className="px-3 py-2 border rounded-lg w-full max-w-md"
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit' : 'Add'} Menu Item</h2>
              <button onClick={closeModal}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (cents) *</label>
                  <input
                    type="number"
                    value={formData.price_cents}
                    onChange={(e) => setFormData({ ...formData, price_cents: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  />
                  Available
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_vegetarian}
                    onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                  />
                  Vegetarian
                </label>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingItem ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
