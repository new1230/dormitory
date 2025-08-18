import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dormitories');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl mb-4">เข้าสู่ระบบ</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            className="block w-full mb-3 p-2 border rounded"
            type="email"
            name="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        
        <div>
          <input
            className="block w-full mb-3 p-2 border rounded"
            type="password"
            name="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        
        <button
          className="w-full bg-blue-500 text-white py-2 rounded"
          type="submit"
        >
          เข้าสู่ระบบ
        </button>
      </form>
      
      <div className="text-center mt-6">
        <p className="text-gray-600">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700">
            ลงทะเบียน
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;