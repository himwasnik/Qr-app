import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, MapPin, Phone } from 'lucide-react';

const CustomerMenu = () => {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadMenuData();
  }, [slug]);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch restaurant and menu data
      const res = await axios.get(
        `${API_BASE_URL}/restaurants/${slug}/public`
      );

      const { restaurant: restaurantData, categories: categoriesData, items: itemsData } = res.data;
      setRestaurant(restaurantData);
      setCategories(categoriesData);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to load menu:', err);
      setError('Menu not found or restaurant is not active');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Not Found</h1>
          <p className="text-gray-600">{error || 'The menu you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  const itemsByCategory = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Menu Card Photo */}
          {restaurant.menu_photo_url && (
            <div className="mb-6">
              <img
                src={restaurant.menu_photo_url}
                alt={`${restaurant.name} menu card`}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Restaurant Info */}
          <div className="flex items-start gap-6">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-24 h-24 rounded-lg object-cover shadow-md"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
              {restaurant.address && (
                <div className="flex items-start gap-2 mt-3 text-gray-600">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{restaurant.address}</p>
                </div>
              )}
              {restaurant.phone && (
                <div className="flex items-center gap-2 mt-2 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <a href={`tel:${restaurant.phone}`} className="hover:text-blue-600">
                    {restaurant.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {itemsByCategory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No menu items available at this time.</p>
          </div>
        ) : (
          itemsByCategory.map((category) => (
            category.items.length > 0 && (
              <div key={category.id} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-gray-600 mb-4">{category.description}</p>
                )}
                <div className="grid gap-4">
                  {category.items
                    .filter((item) => item.is_available)
                    .map((item) => (
                      <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          {item.photo_url && (
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                )}
                                {/* Dietary info */}
                                <div className="flex gap-2 mt-2">
                                  {item.is_vegetarian && (
                                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                      🌱 Vegetarian
                                    </span>
                                  )}
                                  {item.is_vegan && (
                                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                      🌿 Vegan
                                    </span>
                                  )}
                                  {item.is_gluten_free && (
                                    <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded font-medium">
                                      🌾 Gluten-Free
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xl font-bold text-blue-600">
                                {item.currency} {(item.price_cents / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          ))
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>Powered by QR Menu SaaS</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerMenu;
