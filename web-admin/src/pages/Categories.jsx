import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const Categories = () => {
  const { API_URL } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', sort_order: 0 });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/menu/categories`);
      setCategories(res.data.categories);
    } catch (error) {
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API_URL}/menu/categories/${editing.id}`, formData);
      } else {
        await axios.post(`${API_URL}/menu/categories`, formData);
      }
      loadCategories();
      closeModal();
    } catch (error) {
      alert('Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API_URL}/menu/categories/${id}`);
      loadCategories();
    } catch (error) {
      alert('Failed to delete category');
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditing(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        sort_order: category.sort_order,
      });
    } else {
      setEditing(null);
      setFormData({ name: '', description: '', sort_order: 0 });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Categories</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      <div className="grid gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-lg shadow-sm border p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">{cat.name}</h3>
              <p className="text-sm text-gray-600">{cat.description}</p>
              <p className="text-xs text-gray-500 mt-1">Sort order: {cat.sort_order}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openModal(cat)} className="p-2 bg-gray-100 rounded hover:bg-gray-200">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editing ? 'Edit' : 'Add'} Category</h2>
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
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editing ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
