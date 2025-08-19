import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';

const Register = () => {
  const [formData, setFormData] = useState({
    mem_name: '',
    mem_email: '',
    mem_password: '',
    confirmPassword: '',
    mem_card_id: '',
    mem_addr: '',
    mem_tel: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ตรวจสอบรหัสผ่าน
    if (formData.mem_password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    // ตรวจสอบความยาวรหัสผ่าน
    if (formData.mem_password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      setLoading(false);
      return;
    }

    // ตรวจสอบเลขบัตรประชาชน (13 หลัก)
    if (formData.mem_card_id.length !== 13) {
      setError('เลขบัตรประชาชนต้องมี 13 หลัก');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        mem_name: formData.mem_name,
        mem_email: formData.mem_email,
        mem_password: formData.mem_password,
        mem_card_id: formData.mem_card_id,
        mem_addr: formData.mem_addr,
        mem_tel: formData.mem_tel,
        role: 'Student' // กำหนดเป็นนักศึกษาโดยอัตโนมัติ
      };

      const result = await register(userData);
      alert(result.message || 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="max-w-md mx-auto mt-4 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-gray-800">
        สมัครสมาชิก
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ชื่อ-นามสกุล */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อ-นามสกุล *
          </label>
          <input
            type="text"
            name="mem_name"
            value={formData.mem_name}
            onChange={handleChange}
            placeholder="ชื่อ-นามสกุล"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            maxLength={30}
          />
        </div>

        {/* อีเมล */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            อีเมล *
          </label>
          <input
            type="email"
            name="mem_email"
            value={formData.mem_email}
            onChange={handleChange}
            placeholder="example@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            maxLength={50}
          />
        </div>

        {/* รหัสผ่าน */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            รหัสผ่าน *
          </label>
          <input
            type="password"
            name="mem_password"
            value={formData.mem_password}
            onChange={handleChange}
            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            minLength={6}
            maxLength={30}
          />
        </div>

        {/* ยืนยันรหัสผ่าน */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ยืนยันรหัสผ่าน *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="ยืนยันรหัสผ่าน"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            minLength={6}
            maxLength={30}
          />
        </div>

        {/* เลขบัตรประชาชน */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลขบัตรประชาชน *
          </label>
          <input
            type="text"
            name="mem_card_id"
            value={formData.mem_card_id}
            onChange={handleChange}
            placeholder="1234567890123 (13 หลัก)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            pattern="[0-9]{13}"
            maxLength={13}
          />
        </div>

        {/* ที่อยู่ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ที่อยู่ *
          </label>
          <textarea
            name="mem_addr"
            value={formData.mem_addr}
            onChange={handleChange}
            placeholder="ที่อยู่ปัจจุบัน"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
            maxLength={255}
          />
        </div>

        {/* เบอร์โทรศัพท์ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เบอร์โทรศัพท์ *
          </label>
          <input
            type="tel"
            name="mem_tel"
            value={formData.mem_tel}
            onChange={handleChange}
            placeholder="0812345678"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            pattern="[0-9]{10}"
            maxLength={20}
          />
        </div>

        {/* ปุ่มสมัครสมาชิก */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors duration-200 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
        </button>
      </form>

      {/* ลิงก์ไปหน้า Login */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          มีบัญชีอยู่แล้ว?{' '}
          <Link 
            to="/login" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
        </div>
      </PageTransition>
    </div>
  );
};

export default Register;
