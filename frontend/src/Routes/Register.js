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
    student_id: '',
    faculty: '',
    major: '',
    year: '',
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

    // ตรวจสอบข้อมูลนักศึกษา
    if (!formData.student_id || !formData.faculty || !formData.major || !formData.year) {
      setError('กรุณากรอกข้อมูลนักศึกษาให้ครบถ้วน');
      setLoading(false);
      return;
    }

    // ตรวจสอบรหัสนักศึกษา (8-20 หลัก)
    if (formData.student_id.length < 8 || formData.student_id.length > 20) {
      setError('รหัสนักศึกษาต้องมี 8-20 หลัก');
      setLoading(false);
      return;
    }

    // ตรวจสอบชั้นปี (1-8)
    if (formData.year < 1 || formData.year > 8) {
      setError('ชั้นปีต้องเป็น 1-8');
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
        student_id: formData.student_id,
        faculty: formData.faculty,
        major: formData.major,
        year: parseInt(formData.year),
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                สมัครสมาชิก
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                สมัครสมาชิกเพื่อเข้าพักในหอพักนักศึกษา พร้อมระบบจัดการที่ทันสมัย
              </p>
            </div>

            {/* Main Form Container */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                
                {/* Left Side - Form */}
                <div className="p-8 lg:p-12">
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Section 1: ข้อมูลส่วนตัว */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-600 rounded-full p-2 mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        ข้อมูลส่วนตัว
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ชื่อ-นามสกุล *
                          </label>
                          <input
                            type="text"
                            name="mem_name"
                            value={formData.mem_name}
                            onChange={handleChange}
                            placeholder="ชื่อ-นามสกุล"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                            maxLength={30}
                          />
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
                            placeholder="example@email.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                            maxLength={50}
                          />
                        </div>

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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                            pattern="[0-9]{10}"
                            maxLength={20}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            เลขบัตรประชาชน *
                          </label>
                          <input
                            type="text"
                            name="mem_card_id"
                            value={formData.mem_card_id}
                            onChange={handleChange}
                            placeholder="1234567890123 (13 หลัก)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                            pattern="[0-9]{13}"
                            maxLength={13}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ที่อยู่ *
                          </label>
                          <textarea
                            name="mem_addr"
                            value={formData.mem_addr}
                            onChange={handleChange}
                            placeholder="ที่อยู่ปัจจุบัน"
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                            required
                            maxLength={255}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: ข้อมูลนักศึกษา */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-green-100 text-green-600 rounded-full p-2 mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.083 12.083 0 01.665-6.479L12 14z" />
                          </svg>
                        </span>
                        ข้อมูลนักศึกษา
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            รหัสนักศึกษา *
                          </label>
                          <input
                            type="text"
                            name="student_id"
                            value={formData.student_id || ''}
                            onChange={handleChange}
                            placeholder="123456789012 (8-20 หลัก)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                            pattern="[0-9]{8,20}"
                            maxLength={20}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ชั้นปี *
                          </label>
                          <select
                            name="year"
                            value={formData.year || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                          >
                            <option value="">เลือกชั้นปี</option>
                            <option value="1">ชั้นปีที่ 1</option>
                            <option value="2">ชั้นปีที่ 2</option>
                            <option value="3">ชั้นปีที่ 3</option>
                            <option value="4">ชั้นปีที่ 4</option>
                            <option value="5">ชั้นปีที่ 5</option>
                            <option value="6">ชั้นปีที่ 6</option>
                            <option value="7">ชั้นปีที่ 7</option>
                            <option value="8">ชั้นปีที่ 8</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            คณะ *
                          </label>
                          <input
                            type="text"
                            name="faculty"
                            value={formData.faculty || ''}
                            onChange={handleChange}
                            placeholder="เช่น วิศวกรรมศาสตร์"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                            maxLength={100}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            สาขา *
                          </label>
                          <input
                            type="text"
                            name="major"
                            value={formData.major || ''}
                            onChange={handleChange}
                            placeholder="เช่น วิศวกรรมคอมพิวเตอร์"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                            maxLength={100}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: รหัสผ่าน */}
                    <div className="pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-purple-100 text-purple-600 rounded-full p-2 mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </span>
                        ตั้งรหัสผ่าน
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                            minLength={6}
                            maxLength={30}
                          />
                        </div>

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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                            minLength={6}
                            maxLength={30}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 transform ${
                          loading
                            ? 'bg-gray-400 cursor-not-allowed scale-95'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 hover:scale-105 shadow-lg'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            กำลังสมัครสมาชิก...
                          </div>
                        ) : (
                          'สมัครสมาชิก'
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Login Link */}
                  <div className="mt-6 text-center">
                    <p className="text-gray-600">
                      มีบัญชีอยู่แล้ว?{' '}
                      <Link 
                        to="/login" 
                        className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                      >
                        เข้าสู่ระบบ
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Right Side - Info & Benefits */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-12 text-white">
                  <div className="h-full flex flex-col justify-center">
                    <h2 className="text-2xl font-bold mb-6">ทำไมต้องเลือกเรา?</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold mb-2">ระบบจองออนไลน์</h3>
                          <p className="text-blue-100">จองห้องพักได้ง่ายๆ ผ่านระบบออนไลน์ ไม่ต้องเดินทาง</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold mb-2">ราคาเหมาะสม</h3>
                          <p className="text-blue-100">ราคาเช่าห้องพักที่เหมาะสมกับนักศึกษา</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold mb-2">ปลอดภัย</h3>
                          <p className="text-blue-100">ระบบรักษาความปลอดภัยข้อมูลส่วนตัว</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold mb-2">รวดเร็ว</h3>
                          <p className="text-blue-100">การตอบสนองที่รวดเร็วและทันสมัย</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-white bg-opacity-10 rounded-lg">
                      <p className="text-sm text-blue-100">
                        <strong>หมายเหตุ:</strong> หลังจากสมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบเพื่อใช้งานระบบ
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
};

export default Register;
