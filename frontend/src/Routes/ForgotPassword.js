import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: ตรวจสอบตัวตน, 2: ตั้งรหัสใหม่
  const [formData, setFormData] = useState({
    mem_email: '',
    mem_card_id: '',
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  
  const navigate = useNavigate();
  const { notifications, showSuccess, showError } = useNotification();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Step 1: ตรวจสอบตัวตนด้วยอีเมลและเลขบัตรประชาชน
  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-identity', {
        mem_email: formData.mem_email,
        mem_card_id: formData.mem_card_id
      });

      setUserInfo(response.data.user);
      setStep(2);
      showSuccess('ตรวจสอบตัวตนสำเร็จ กรุณาตั้งรหัสผ่านใหม่');
    } catch (err) {
      setError(err.response?.data?.message || 'ไม่พบข้อมูลผู้ใช้ กรุณาตรวจสอบอีเมลและเลขบัตรประชาชน');
      showError('ตรวจสอบตัวตนไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: ตั้งรหัสผ่านใหม่
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ตรวจสอบรหัสผ่าน
    if (formData.new_password !== formData.confirm_password) {
      setError('รหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    if (formData.new_password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      setLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        mem_email: formData.mem_email,
        mem_card_id: formData.mem_card_id,
        new_password: formData.new_password
      });

      showSuccess('เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      showError('เปลี่ยนรหัสผ่านไม่สำเร็จ');
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
            {step === 1 ? 'ลืมรหัสผ่าน' : 'ตั้งรหัสผ่านใหม่'}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            /* Step 1: ตรวจสอบตัวตน */
            <form onSubmit={handleVerifyIdentity} className="space-y-4">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  กรุณากรอกข้อมูลเพื่อยืนยันตัวตน
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล *
                </label>
                <input
                  type="email"
                  name="mem_email"
                  value={formData.mem_email}
                  onChange={handleChange}
                  placeholder="อีเมลที่ใช้สมัครสมาชิก"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลขบัตรประชาชน *
                </label>
                <input
                  type="text"
                  name="mem_card_id"
                  value={formData.mem_card_id}
                  onChange={handleChange}
                  placeholder="เลขบัตรประชาชน 13 หลัก"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  pattern="[0-9]{13}"
                  maxLength={13}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors duration-200 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                {loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบตัวตน'}
              </button>
            </form>
          ) : (
            /* Step 2: ตั้งรหัสผ่านใหม่ */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ ยืนยันตัวตนสำเร็จ: <strong>{userInfo?.mem_name}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านใหม่ *
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยืนยันรหัสผ่านใหม่ *
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 px-4 rounded-md font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                >
                  กลับ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-2/3 py-3 px-4 rounded-md font-medium text-white transition-colors duration-200 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
                  }`}
                >
                  {loading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
                </button>
              </div>
            </form>
          )}

          {/* ลิงก์กลับไปหน้า Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              จำรหัสผ่านได้แล้ว?{' '}
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

      <ToastContainer notifications={notifications} />
    </div>
  );
};

export default ForgotPassword;
