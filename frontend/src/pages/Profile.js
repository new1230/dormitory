import  { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { LoadingSpinner, LoadingButton } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const Profile = () => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { notifications, showSuccess, showError, showWarning } = useNotification();

  const [formData, setFormData] = useState({
    mem_name: '',
    mem_email: '',
    mem_tel: '',
    mem_addr: '',
    student_id: '',
    faculty: '',
    major: '',
    year: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        mem_name: user.mem_name || '',
        mem_email: user.mem_email || '',
        mem_tel: user.mem_tel || '',
        mem_addr: user.mem_addr || '',
        student_id: user.student_id || '',
        faculty: user.faculty || '',
        major: user.major || '',
        year: user.year || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      if (user.mem_img) {
        const imageUrl = `http://localhost:5000/uploads/profiles/${user.mem_img}`;
        setImagePreview(imageUrl);
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('รูปภาพต้องมีขนาดไม่เกิน 5 MB');
        return;
      }

      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showError('รองรับเฉพาะไฟล์ JPG, PNG, GIF');
        return;
      }

      setProfileImage(file);
      
      // สร้าง preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        mem_name: formData.mem_name,
        mem_tel: formData.mem_tel,
        mem_addr: formData.mem_addr,
        student_id: formData.student_id,
        faculty: formData.faculty,
        major: formData.major,
        year: formData.year
      };

      await axios.put('http://localhost:5000/api/profile/update', updateData);
      showSuccess('อัปเดตข้อมูลโปรไฟล์สำเร็จ');
      setIsEditing(false);

      // รีเฟรช user context
      await refreshUser();

      // อัปเดต formData ทันที เพื่อให้แสดงผลใหม่
      setFormData(prev => ({
        ...prev,
        ...updateData
      }));

    } catch (error) {
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!formData.currentPassword) {
      showWarning('กรุณาใส่รหัสผ่านปัจจุบัน');
      return;
    }
    
    if (!formData.newPassword || formData.newPassword.length < 6) {
      showWarning('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      showWarning('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    setLoading(true);

    try {
      await axios.put('http://localhost:5000/api/profile/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      showSuccess('เปลี่ยนรหัสผ่านสำเร็จ');
      
      // ล้างฟอร์มรหัสผ่าน
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (error) {
      console.error('Password change error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!profileImage) {
      showWarning('กรุณาเลือกรูปภาพก่อน');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('profileImage', profileImage);

    try {
      const response = await axios.post('http://localhost:5000/api/profile/upload-image', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log(response)
      showSuccess('อัปโหลดรูปภาพสำเร็จ');
      setProfileImage(null);
      
      // รีเฟรชข้อมูลผู้ใช้และอัปเดตรูป
      await refreshUser();
      
      // อัปเดต imagePreview ด้วยรูปใหม่
      setImagePreview(`http://localhost:5000/uploads/profiles/${response.data.fileName}`);
      
    } catch (error) {
      console.error('Image upload error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div>
        <Navbar />
        <PageTransition>
          <div className="flex justify-center items-center min-h-screen">
            <LoadingSpinner size="large" />
          </div>
        </PageTransition>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
          <div className="max-w-4xl mx-auto px-4">
            {/* หัวข้อ */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
              <p className="text-gray-600 mt-2">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* รูปโปรไฟล์ */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">รูปโปรไฟล์</h3>
                  
                  <div className="text-center">
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || '/default-avatar.svg'}
                        alt="Profile"
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-blue-100"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="profileImageInput"
                      />
                      <label
                        htmlFor="profileImageInput"
                        className="cursor-pointer inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        เลือกรูปใหม่
                      </label>
                    </div>
                    
                    {profileImage && (
                      <div className="mt-3">
                        <LoadingButton
                          onClick={handleImageUpload}
                          loading={uploading}
                          className="btn-primary text-sm"
                        >
                          อัปโหลดรูป
                        </LoadingButton>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 text-center text-sm text-gray-500">
                    <p>รองรับไฟล์ JPG, PNG, GIF</p>
                    <p>ขนาดไม่เกิน 5 MB</p>
                  </div>
                  
                  {/* ลิงก์ไปหน้าประวัติการใช้งาน */}
                  <div className="mt-4 text-center">
                    <Link
                      to="/activity-log"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                    >
                      ดูประวัติการใช้งาน
                    </Link>
                  </div>
                </div>
              </div>

              {/* ข้อมูลโปรไฟล์ */}
              <div className="lg:col-span-2 space-y-6">
                {/* ข้อมูลพื้นฐาน */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">ข้อมูลพื้นฐาน</h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {isEditing ? 'ยกเลิก' : 'แก้ไข'}
                    </button>
                  </div>

                  <form onSubmit={handleProfileUpdate}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ชื่อ-นามสกุล
                        </label>
                        <input
                          type="text"
                          name="mem_name"
                          value={formData.mem_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          อีเมล
                        </label>
                        <input
                          type="email"
                          name="mem_email"
                          value={formData.mem_email}
                          disabled
                          className="input-field bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">ไม่สามารถเปลี่ยนอีเมลได้</p>
                      </div>

                      {/* รหัสนักศึกษา */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          รหัสนักศึกษา
                        </label>
                        <input
                          type="text"
                          name="student_id"
                          value={formData.student_id}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                          pattern="[0-9]{12}"
                          maxLength={12}
                        />
                      </div>

                      {/* คณะ */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          คณะ
                        </label>
                        <input
                          type="text"
                          name="faculty"
                          value={formData.faculty}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                          maxLength={50}
                        />
                      </div>

                      {/* สาขา */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          สาขา
                        </label>
                        <input
                          type="text"
                          name="major"
                          value={formData.major}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                          maxLength={50}
                        />
                      </div>

                      {/* ชั้นปี */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ชั้นปี
                        </label>
                        <input
                          type="number"
                          name="year"
                          value={formData.year}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                          min={1}
                          max={8}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          เบอร์โทรศัพท์
                        </label>
                        <input
                          type="tel"
                          name="mem_tel"
                          value={formData.mem_tel}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                          pattern="[0-9]{10}"
                          maxLength="10"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          บทบาท
                        </label>
                        <input
                          type="text"
                          value={user.role === 'Student' ? 'นักศึกษา' : user.role === 'Manager' ? 'ผู้จัดการหอพัก' : 'แอดมิน'}
                          disabled
                          className="input-field bg-gray-50"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ที่อยู่
                        </label>
                        <textarea
                          name="mem_addr"
                          value={formData.mem_addr}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          rows="3"
                          className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                          required
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          ยกเลิก
                        </button>
                        <LoadingButton
                          type="submit"
                          loading={loading}
                          className="btn-primary"
                        >
                          บันทึก
                        </LoadingButton>
                      </div>
                    )}
                  </form>
                </div>

                {/* เปลี่ยนรหัสผ่าน */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">เปลี่ยนรหัสผ่าน</h3>
                  
                  <form onSubmit={handlePasswordChange}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          รหัสผ่านปัจจุบัน
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="ใส่รหัสผ่านปัจจุบัน"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          รหัสผ่านใหม่
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="ใส่รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                          minLength="6"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ยืนยันรหัสผ่านใหม่
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="ใส่รหัสผ่านใหม่อีกครั้ง"
                          minLength="6"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <LoadingButton
                        type="submit"
                        loading={loading}
                        className="btn-primary"
                      >
                        เปลี่ยนรหัสผ่าน
                      </LoadingButton>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
      <ToastContainer notifications={notifications} />
    </div>
  );
};

export default Profile;
