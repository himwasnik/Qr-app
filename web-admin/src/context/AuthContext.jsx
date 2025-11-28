import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup axios defaults
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedRestaurant = localStorage.getItem('restaurant');

    if (token && savedUser && savedRestaurant) {
      setUser(JSON.parse(savedUser));
      setRestaurant(JSON.parse(savedRestaurant));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user, restaurant } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('restaurant', JSON.stringify(restaurant));

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setRestaurant(restaurant);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const register = async (restaurantName, email, password, phone, address) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        restaurantName,
        email,
        password,
        phone,
        address,
      });

      const { token, user, restaurant, checkoutUrl } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('restaurant', JSON.stringify(restaurant));

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setRestaurant(restaurant);

      return { success: true, checkoutUrl };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('restaurant');

    delete axios.defaults.headers.common['Authorization'];

    setUser(null);
    setRestaurant(null);
  };

  const updateRestaurant = (updatedRestaurant) => {
    setRestaurant(updatedRestaurant);
    localStorage.setItem('restaurant', JSON.stringify(updatedRestaurant));
  };

  const value = {
    user,
    restaurant,
    loading,
    login,
    register,
    logout,
    updateRestaurant,
    isAuthenticated: !!user,
    API_URL,
    token: localStorage.getItem('token'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
