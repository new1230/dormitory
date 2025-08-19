import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, rememberMe);
      navigate('/dormitories');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-4 sm:mt-10 p-4 sm:p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl mb-4">เข้าสู่ระบบ</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            className="input-field mb-3"
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
            className="input-field mb-3"
            type="password"
            name="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="รหัสผ่าน"
            required
          />
        </div>



        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="rememberMe" className="text-sm text-gray-600">
            จดจำการเข้าสู่ระบบ
          </label>
        </div>
        
        <button
          className="btn-primary w-full"
          type="submit"
        >
          เข้าสู่ระบบ
        </button>
      </form>
      
      <div className="text-center mt-6 space-y-2">
        <p className="text-gray-600">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700">
            ลงทะเบียน
          </Link>
        </p>
        <p className="text-gray-600">
          <Link to="/forgot-password" className="text-red-600 hover:text-red-700 text-sm">
            ลืมรหัสผ่าน?
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;