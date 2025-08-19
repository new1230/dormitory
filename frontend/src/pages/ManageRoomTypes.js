import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import RoomTypeImageManager from '../components/RoomTypeImageManager';
import { LoadingSpinner, LoadingButton } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const ManageRoomTypes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { notifications, showSuccess, showError, showWarning } = useNotification();

  // Function สำหรับแปลง facility labels
  const getFacilityLabel = (facility) => {
    const labels = {
      wifi: 'WiFi',
      hot_water: 'น้ำอุ่น',
      refrigerator: 'ตู้เย็น',
      tv: 'ทีวี',
      desk: 'โต๊ะเรียน',
      chair: 'เก้าอี้',
      bed: 'เตียง',
      closet: 'ตู้เสื้อผ้า',
      balcony: 'ระเบียง',
      private_bathroom: 'ห้องน้ำในตัว'
    };
    return labels[facility] || facility;
  };

  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    room_type_name: '',
    description: '',
    capacity: '',
    price_per_month: '',
    price_per_semester: '',
    water_rate: '',
    electricity_rate: '',
    payment_due_day: '5',
    room_style: 'single',
    gender_allowed: 'mixed',
    air_condition: false,
    fan: true,
    furnished: 'partial',
    room_category: 'standard',
    room_size: '',
    facilities: {
      wifi: true,
      hot_water: false,
      refrigerator: false,
      tv: false,
      desk: true,
      chair: true,
      bed: true,
      closet: true,
      balcony: false,
      private_bathroom: true
    }
  });

  // ตรวจสอบสิทธิ์
  useEffect(() => {
    if (!authLoading && user && !['Manager', 'Admin'].includes(user.role)) {
      navigate('/');
      showError('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && ['Manager', 'Admin'].includes(user.role)) {
      fetchRoomTypes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchRoomTypes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/room-types');
      setRoomTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch room types:', error);
      showError('ไม่สามารถโหลดข้อมูลประเภทห้องได้');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.room_type_name.trim() || !formData.capacity || !formData.price_per_month) {
      showWarning('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (parseInt(formData.capacity) < 1) {
      showWarning('จำนวนคนต้องมากกว่า 0');
      return;
    }

    if (parseFloat(formData.price_per_month) < 0) {
      showWarning('ราคาต่อเดือนต้องไม่ติดลบ');
      return;
    }

    setSubmitting(true);

    try {
      if (editingRoomType) {
        // อัปเดต
        await axios.put(`http://localhost:5000/api/room-types/${editingRoomType.room_type_id}`, formData);
        showSuccess('อัปเดตประเภทห้องสำเร็จ');
      } else {
        // เพิ่มใหม่
        await axios.post('http://localhost:5000/api/room-types', formData);
        showSuccess('เพิ่มประเภทห้องสำเร็จ');
      }

      await fetchRoomTypes();
      closeModal();
    } catch (error) {
      console.error('Submit room type error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (roomType) => {
    setEditingRoomType(roomType);
    setFormData({
      room_type_name: roomType.room_type_name,
      description: roomType.description || '',
      capacity: roomType.capacity.toString(),
      price_per_month: roomType.price_per_month?.toString() || '',
      price_per_semester: roomType.price_per_semester?.toString() || '',
      water_rate: roomType.water_rate?.toString() || '',
      electricity_rate: roomType.electricity_rate?.toString() || '',
      payment_due_day: roomType.payment_due_day?.toString() || '5',
      room_style: roomType.room_style || 'single',
      gender_allowed: roomType.gender_allowed || 'mixed',
      air_condition: roomType.air_condition || false,
      fan: roomType.fan !== false,
      furnished: roomType.furnished || 'partial',
      room_category: roomType.room_category || 'standard',
      room_size: roomType.room_size?.toString() || '',
      facilities: roomType.facilities || {
        wifi: true,
        hot_water: false,
        refrigerator: false,
        tv: false,
        desk: true,
        chair: true,
        bed: true,
        closet: true,
        balcony: false,
        private_bathroom: true
      }
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (roomType) => {
    try {
      await axios.patch(`http://localhost:5000/api/room-types/${roomType.room_type_id}/toggle`);
      showSuccess(`${roomType.is_active === '1' ? 'ปิด' : 'เปิด'}ใช้งานประเภทห้องสำเร็จ`);
      await fetchRoomTypes();
    } catch (error) {
      console.error('Toggle status error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const handleDelete = async (roomType) => {
    if (!window.confirm(`คุณต้องการลบประเภทห้อง "${roomType.room_type_name}" หรือไม่?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/room-types/${roomType.room_type_id}`);
      showSuccess('ลบประเภทห้องสำเร็จ');
      await fetchRoomTypes();
    } catch (error) {
      console.error('Delete room type error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบประเภทห้อง');
    }
  };

  const openCreateModal = () => {
    setEditingRoomType(null);
    setFormData({
      room_type_name: '',
      description: '',
      capacity: '',
      price_per_month: '',
      price_per_semester: '',
      water_rate: '',
      electricity_rate: '',
      payment_due_day: '5',
      room_style: 'single',
      gender_allowed: 'mixed',
      air_condition: false,
      fan: true,
      furnished: 'partial',
      room_category: 'standard',
      room_size: '',
      facilities: {
        wifi: true,
        hot_water: false,
        refrigerator: false,
        tv: false,
        desk: true,
        chair: true,
        bed: true,
        closet: true,
        balcony: false,
        private_bathroom: true
      }
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoomType(null);
    setFormData({
      room_type_name: '',
      description: '',
      capacity: '',
      price_per_month: '',
      price_per_semester: '',
      water_rate: '',
      electricity_rate: '',
      payment_due_day: '5',
      room_style: 'single',
      gender_allowed: 'mixed',
      air_condition: false,
      fan: true,
      furnished: 'partial',
      room_category: 'standard',
      room_size: '',
      facilities: {
        wifi: true,
        hot_water: false,
        refrigerator: false,
        tv: false,
        desk: true,
        chair: true,
        bed: true,
        closet: true,
        balcony: false,
        private_bathroom: true
      }
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
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

  if (!user || !['Manager', 'Admin'].includes(user.role)) {
    return null;
  }

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* หัวข้อ */}
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">จัดการประเภทห้อง</h1>
                <p className="text-gray-600 mt-2">จัดการประเภทห้องพัก กำหนดราคา และจำนวนผู้พัก</p>
              </div>
              
              <button
                onClick={openCreateModal}
                className="btn-primary text-sm sm:text-base"
              >
                <span className="hidden sm:inline">+ เพิ่มประเภทห้อง</span>
                <span className="sm:hidden">+ เพิ่ม</span>
              </button>
            </div>

            {/* ตาราง */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="medium" />
                </div>
              ) : roomTypes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>ยังไม่มีประเภทห้อง</p>
                  <button
                    onClick={openCreateModal}
                    className="mt-4 text-blue-600 hover:text-blue-800 underline"
                  >
                    เพิ่มประเภทห้องแรก
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ประเภทห้อง
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          จำนวนคน
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ราคา/เดือน
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          สถานะ
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {roomTypes.map((roomType) => (
                        <tr key={roomType.room_type_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {roomType.room_type_name}
                              </div>
                              {roomType.description && (
                                <div className="text-sm text-gray-500">
                                  {roomType.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {roomType.capacity} คน
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {formatPrice(roomType.price_per_month)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                roomType.is_active === '1'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {roomType.is_active === '1' ? 'ใช้งาน' : 'ปิดใช้งาน'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(roomType)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="แก้ไข"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleToggleStatus(roomType)}
                                className={`transition-colors ${
                                  roomType.is_active === '1'
                                    ? 'text-red-600 hover:text-red-900'
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                                title={roomType.is_active === '1' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                              >
                                {roomType.is_active === '1' ? '🔒' : '🔓'}
                              </button>
                              <button
                                onClick={() => handleDelete(roomType)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="ลบ"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRoomType ? 'แก้ไขประเภทห้อง' : 'เพิ่มประเภทห้องใหม่'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ข้อมูลพื้นฐาน */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อประเภทห้อง *
                    </label>
                    <input
                      type="text"
                      name="room_type_name"
                      value={formData.room_type_name}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="เช่น ห้องเดี่ยว แอร์ พื้นฐาน"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คำอธิบาย
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="input-field"
                      placeholder="รายละเอียดประเภทห้อง เช่น ห้องเดี่ยวปรับอากาศ เฟอร์นิเจอร์พื้นฐาน เหมาะสำหรับนักศึกษาที่ต้องการความเป็นส่วนตัว"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      จำนวนคน *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="1"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ขนาดห้อง (ตร.ม.)
                    </label>
                    <input
                      type="number"
                      name="room_size"
                      value={formData.room_size}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="15.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* ประเภทห้อง */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">ประเภทห้อง</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ประเภทตามจำนวนคน *
                      </label>
                      <select
                        name="room_style"
                        value={formData.room_style}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      >
                        <option value="single">ห้องเดี่ยว</option>
                        <option value="double">ห้องคู่</option>
                        <option value="triple">ห้องสาม</option>
                        <option value="quadruple">ห้องสี่</option>
                        <option value="dormitory">ห้องโฮสเทล</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เพศที่อนุญาต *
                      </label>
                      <select
                        name="gender_allowed"
                        value={formData.gender_allowed}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      >
                        <option value="mixed">ชาย-หญิง</option>
                        <option value="male">ชายเท่านั้น</option>
                        <option value="female">หญิงเท่านั้น</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หมวดห้อง *
                      </label>
                      <select
                        name="room_category"
                        value={formData.room_category}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      >
                        <option value="standard">ห้องมาตรฐาน</option>
                        <option value="deluxe">ห้องพิเศษ</option>
                        <option value="suite">ห้องสวีท</option>
                        <option value="hostel">ห้องโฮสเทล</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* สิ่งอำนวยความสะดวก */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">สิ่งอำนวยความสะดวก</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ระดับเฟอร์นิเจอร์ *
                      </label>
                      <select
                        name="furnished"
                        value={formData.furnished}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      >
                        <option value="partial">เฟอร์นิเจอร์พื้นฐาน</option>
                        <option value="fully">ครบครันทั้งหมด</option>
                        <option value="unfurnished">ห้องเปล่า</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ระบบปรับอากาศ
                      </label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.air_condition}
                            onChange={(e) => setFormData(prev => ({...prev, air_condition: e.target.checked}))}
                            className="mr-2"
                          />
                          แอร์
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.fan}
                            onChange={(e) => setFormData(prev => ({...prev, fan: e.target.checked}))}
                            className="mr-2"
                          />
                          พัดลม
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* สิ่งอำนวยความสะดวกเพิ่มเติม */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สิ่งอำนวยความสะดวกเพิ่มเติม
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {Object.keys(formData.facilities).map(facility => (
                        <label key={facility} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.facilities[facility]}
                            onChange={(e) => setFormData(prev => ({
                              ...prev, 
                              facilities: {
                                ...prev.facilities,
                                [facility]: e.target.checked
                              }
                            }))}
                            className="mr-2"
                          />
                          {getFacilityLabel(facility)}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ราคาและค่าใช้จ่าย */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">💰 ราคาและค่าใช้จ่าย</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ราคา/เดือน (บาท) *
                      </label>
                      <input
                        type="number"
                        name="price_per_month"
                        value={formData.price_per_month}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="3500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ราคา/เทอม (บาท)
                      </label>
                      <input
                        type="number"
                        name="price_per_semester"
                        value={formData.price_per_semester}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="15750"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ค่าน้ำ/หน่วย (บาท) *
                      </label>
                      <input
                        type="number"
                        name="water_rate"
                        value={formData.water_rate}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="18.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ค่าไฟ/หน่วย (บาท) *
                      </label>
                      <input
                        type="number"
                        name="electricity_rate"
                        value={formData.electricity_rate}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="7.50"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ครบกำหนดวันที่ *
                      </label>
                      <input
                        type="number"
                        name="payment_due_day"
                        value={formData.payment_due_day}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="5"
                        min="1"
                        max="31"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">วันที่ของแต่ละเดือน</p>
                    </div>
                  </div>
                </div>

                {/* รูปภาพประเภทห้อง */}
                {editingRoomType && (
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-800 mb-3">📷 รูปภาพประเภทห้อง</h4>
                    <RoomTypeImageManager 
                      roomTypeId={editingRoomType.room_type_id}
                      onImagesChange={() => {
                        fetchRoomTypes();
                      }}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <LoadingButton
                    type="submit"
                    loading={submitting}
                    className="btn-primary"
                  >
                    {editingRoomType ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มประเภทห้อง'}
                  </LoadingButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer notifications={notifications} />
    </div>
  );
};

export default ManageRoomTypes;
