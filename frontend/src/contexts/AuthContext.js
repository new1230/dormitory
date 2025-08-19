import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
        rememberMe
      });
      
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      
      // ไม่ต้อง auto login หลังจากสมัครสมาชิก
      // ให้ผู้ใช้ต้อง login เองอีกครั้ง
      console.log('✅ Registration successful:', response.data.message);
      
      return response.data; // ส่งข้อมูลกลับไปให้ component
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    console.log('🚪 AuthContext - Logout called');
    console.log('🚪 AuthContext - Current user before logout:', user);
    console.log('🚪 AuthContext - Current token before logout:', token);
    
    // ลบ token จาก localStorage
    localStorage.removeItem('token');
    console.log('🚪 AuthContext - Token removed from localStorage');
    
    // ล้าง state
    setToken(null);
    setUser(null);
    console.log('🚪 AuthContext - State cleared (token and user set to null)');
    
    // ลบ Authorization header จาก axios
    delete axios.defaults.headers.common['Authorization'];
    console.log('🚪 AuthContext - Authorization header removed from axios');
    
    console.log('🚪 AuthContext - Logout completed');
  };

  const refreshUser = async () => {
    try {
      if (token) {
        const response = await axios.get('http://localhost:5000/api/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};