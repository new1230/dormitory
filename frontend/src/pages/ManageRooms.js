import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { LoadingSpinner, LoadingButton } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import RoomImageManager from '../components/RoomImageManager';
import axios from 'axios';

const ManageRooms = () => {
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

  // States
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isRoomDetailModalOpen, setIsRoomDetailModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [viewingRoom, setViewingRoom] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [selectedRoomForImages, setSelectedRoomForImages] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // Form states - รวมประเภทห้องและห้องในฟอร์มเดียว
  const [roomForm, setRoomForm] = useState({
    // ข้อมูลประเภทห้อง
    room_type_name: '',
    room_type_description: '',
    capacity: '',
    // ข้อมูลราคาและอัตรา
    price_per_month: '',
    price_per_semester: '',
    water_rate: '',
    electricity_rate: '',
    payment_due_day: '5',
    // ข้อมูลห้อง
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
    },
    // ข้อมูลห้อง
    room_number: '',
    room_description: '',
    status: '1'
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
      fetchRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`http://localhost:5000/api/rooms?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      setRooms(response.data || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      showError('ไม่สามารถโหลดข้อมูลห้องได้');
    } finally {
      setLoading(false);
    }
  };

  // Room Functions - รวมการสร้างประเภทห้องและห้อง
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!roomForm.room_type_name.trim() || !roomForm.capacity || !roomForm.price_per_month || !roomForm.room_number.trim()) {
      showWarning('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      console.log('Form validation failed:', {
        room_type_name: roomForm.room_type_name,
        capacity: roomForm.capacity,
        price_per_month: roomForm.price_per_month,
        room_number: roomForm.room_number
      });
      return;
    }

    setSubmitting(true);

    try {
      if (editingRoom) {
        // แก้ไขห้อง (ไม่สามารถเปลี่ยนประเภทห้องได้)
        await axios.put(`http://localhost:5000/api/rooms/${editingRoom.room_id}`, {
          room_type_id: editingRoom.room_type_id, // ใช้ room_type_id เดิม
          room_number: roomForm.room_number,
          description: roomForm.room_description,
          status: roomForm.status
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        showSuccess('อัปเดตห้องสำเร็จ');
      } else {
        // สร้างห้องใหม่พร้อมประเภทห้อง
        // 1. สร้างประเภทห้องก่อน
        const roomTypeData = {
          room_type_name: roomForm.room_type_name,
          description: roomForm.room_type_description,
          capacity: parseInt(roomForm.capacity),
          price_per_month: parseFloat(roomForm.price_per_month),
          price_per_semester: roomForm.price_per_semester ? parseFloat(roomForm.price_per_semester) : null,
          water_rate: roomForm.water_rate ? parseFloat(roomForm.water_rate) : 0,
          electricity_rate: roomForm.electricity_rate ? parseFloat(roomForm.electricity_rate) : 0,
          payment_due_day: parseInt(roomForm.payment_due_day),
          room_style: roomForm.room_style,
          gender_allowed: roomForm.gender_allowed,
          air_condition: roomForm.air_condition,
          fan: roomForm.fan,
          furnished: roomForm.furnished,
          room_category: roomForm.room_category,
          room_size: roomForm.room_size ? parseFloat(roomForm.room_size) : null,
          facilities: roomForm.facilities
        };

        const roomTypeResponse = await axios.post('http://localhost:5000/api/room-types', roomTypeData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Room Type Response:', roomTypeResponse.data);
        const newRoomTypeId = roomTypeResponse.data.roomType?.room_type_id || roomTypeResponse.data.room_type_id;
        console.log('New Room Type ID:', newRoomTypeId);
        
        // ตรวจสอบว่าได้ room_type_id หรือไม่
        if (!newRoomTypeId) {
          throw new Error('ไม่สามารถสร้างประเภทห้องได้ - ไม่ได้รับ room_type_id');
        }
        
        // 2. สร้างห้องด้วยประเภทห้องใหม่
        const roomData = {
          room_type_id: newRoomTypeId,
          room_number: roomForm.room_number,
          description: roomForm.room_description,
          status: roomForm.status
        };
        
        console.log('Room Data to send:', roomData);

        await axios.post('http://localhost:5000/api/rooms', roomData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        showSuccess('สร้างประเภทห้องและห้องใหม่สำเร็จ');
      }

      await fetchRooms();
      closeRoomModal();
    } catch (error) {
      console.error('Submit room error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoomEdit = (room) => {
    setEditingRoom(room);
    setRoomForm({
      // ข้อมูลประเภทห้อง
      room_type_name: room.roomType?.room_type_name || '',
      room_type_description: room.roomType?.description || '',
      capacity: room.roomType?.capacity?.toString() || '',
      // ข้อมูลราคาและอัตรา (จาก roomType)
      price_per_month: room.roomType?.price_per_month?.toString() || '',
      price_per_semester: room.roomType?.price_per_semester?.toString() || '',
      water_rate: room.roomType?.water_rate?.toString() || '0',
      electricity_rate: room.roomType?.electricity_rate?.toString() || '0',
      payment_due_day: room.roomType?.payment_due_day?.toString() || '5',
      // ข้อมูลห้อง (จาก roomType)
      room_style: room.roomType?.room_style || 'single',
      gender_allowed: room.roomType?.gender_allowed || 'mixed',
      air_condition: room.roomType?.air_condition || false,
      fan: room.roomType?.fan !== false,
      furnished: room.roomType?.furnished || 'partial',
      room_category: room.roomType?.room_category || 'standard',
      room_size: room.roomType?.room_size?.toString() || '',
      facilities: room.roomType?.facilities || {
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
      },
      // ข้อมูลห้อง
      room_number: room.room_number,
      room_description: room.description || '',
      status: room.status
    });
    setIsRoomModalOpen(true);
  };

  const handleRoomStatusChange = async (room, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/rooms/${room.room_id}/status`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      showSuccess('เปลี่ยนสถานะห้องสำเร็จ');
      await fetchRooms();
    } catch (error) {
      console.error('Update room status error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const handleRoomDelete = async (room) => {
    if (!window.confirm(`คุณต้องการลบห้อง "${room.room_number}" หรือไม่?\n\n⚠️ การลบจะไม่สามารถกู้คืนได้`)) {
      return;
    }

    try {
      console.log('Deleting room:', room.room_id);
      await axios.delete(`http://localhost:5000/api/rooms/${room.room_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      showSuccess(`ลบห้อง "${room.room_number}" สำเร็จ`);
      await fetchRooms();
    } catch (error) {
      console.error('Delete room error:', error);
      console.error('Error response:', error.response?.data);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบห้อง');
    }
  };

  // Modal Functions
  const openCreateRoomModal = () => {
    setEditingRoom(null);
    setRoomForm({
      // ข้อมูลประเภทห้อง
      room_type_name: '',
      room_type_description: '',
      capacity: '',
      // ข้อมูลราคาและอัตรา
      price_per_month: '',
      price_per_semester: '',
      water_rate: '',
      electricity_rate: '',
      payment_due_day: '5',
      // ข้อมูลห้อง
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
      },
      // ข้อมูลห้อง
      room_number: '',
      room_description: '',
      status: '1'
    });
    setIsRoomModalOpen(true);
  };

  const closeRoomModal = () => {
    setIsRoomModalOpen(false);
    setEditingRoom(null);
  };

  const openRoomDetailModal = (room) => {
    setViewingRoom(room);
    setIsRoomDetailModalOpen(true);
  };

  const closeRoomDetailModal = () => {
    setIsRoomDetailModalOpen(false);
    setViewingRoom(null);
  };

  const openImageManager = (room) => {
    setSelectedRoomForImages(room);
    setShowImageManager(true);
  };

  const closeImageManager = () => {
    setSelectedRoomForImages(null);
    setShowImageManager(false);
  };

  // Helper Functions
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  const getStatusColor = (status) => {
    const colors = {
      '1': 'bg-green-100 text-green-800', // ว่าง
      '2': 'bg-yellow-100 text-yellow-800', // จองแล้ว
      '3': 'bg-blue-100 text-blue-800', // มีผู้เช่า
      '4': 'bg-red-100 text-red-800' // ซ่อมแซม
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      '1': 'ว่าง',
      '2': 'จองแล้ว',
      '3': 'มีผู้เช่า',
      '4': 'ซ่อมแซม'
    };
    return statusTexts[status] || 'ไม่ทราบ';
  };

  if (authLoading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="large" />
        </div>
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-xl p-8 text-white mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-2 flex items-center">
                    <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    จัดการห้องพัก
                  </h1>
                  <p className="text-blue-100 text-lg">จัดการข้อมูลห้องพักและประเภทห้องทั้งหมด</p>
                </div>
                <button
                  onClick={openCreateRoomModal}
                  className="bg-white hover:bg-gray-50 text-blue-600 px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  เพิ่มห้องพัก
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="medium" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* ห้องพัก */}
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">ห้องพัก ({rooms.length})</h2>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                    </div>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-gray-300 text-8xl mb-6">🏠</div>
                    <h3 className="text-2xl font-semibold text-gray-700 mb-3">ไม่มีห้องในระบบ</h3>
                    <p className="text-gray-500 mb-6">เริ่มต้นด้วยการเพิ่มห้องใหม่</p>
                    <button
                      onClick={openCreateRoomModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                      เพิ่มห้องใหม่
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {rooms.map((room) => (
                      <div key={room.room_id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                        {/* Header with Status */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                              ห้อง {room.room_number}
                            </h3>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(room.status)} shadow-sm`}>
                              {getStatusText(room.status)}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          {/* Room Type Info */}
                          <div className="mb-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="text-sm font-medium text-gray-600">ประเภทห้อง</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-800 ml-6">{room.roomType?.room_type_name || 'ไม่ระบุ'}</p>
                            {room.description && (
                              <p className="text-sm text-gray-600 mt-1 ml-6">{room.description}</p>
                            )}
                          </div>

                          {/* Room Details Grid */}
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-xs text-gray-500">จำนวนคน</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-700">{room.roomType?.capacity || 'ไม่ระบุ'} คน</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 text-yellow-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span className="text-xs text-gray-500">ราคา/เดือน</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-700">{formatPrice(room.roomType?.price_per_month || 0)}</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                <span className="text-xs text-gray-500">ค่าน้ำ</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-700">฿{room.roomType?.water_rate || 0}/หน่วย</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-xs text-gray-500">ค่าไฟ</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-700">฿{room.roomType?.electricity_rate || 0}/หน่วย</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleRoomEdit(room)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              แก้ไข
                            </button>
                            <button
                              onClick={() => openRoomDetailModal(room)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              ดู
                            </button>
                            <button
                              onClick={() => openImageManager(room)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              รูปภาพ
                            </button>
                            <button
                              onClick={() => handleRoomDelete(room)}
                              disabled={room.status === '3' || room.current_tenant_id}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center ${
                                room.status === '3' || room.current_tenant_id
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-50 hover:bg-red-100 text-red-700'
                              }`}
                              title={
                                room.status === '3' || room.current_tenant_id
                                  ? 'ไม่สามารถลบได้ เนื่องจากมีผู้เช่าอยู่'
                                  : 'ลบห้อง'
                              }
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Filters */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                      ตัวกรองและค้นหา
                    </h3>
                    <button
                      onClick={() => setFilters({ status: '', search: '' })}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      ล้างตัวกรอง
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">สถานะห้อง</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                      >
                        <option value="">ทุกสถานะ</option>
                        <option value="1">🟢 ว่าง</option>
                        <option value="2">🟡 จองแล้ว</option>
                        <option value="3">🔴 มีผู้เช่า</option>
                        <option value="4">🔧 ซ่อมแซม</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">ค้นหาห้อง</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="หมายเลขห้อง, ประเภทห้อง..."
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        />
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">เรียงตาม</label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white">
                        <option value="room_number">หมายเลขห้อง</option>
                        <option value="price">ราคา</option>
                        <option value="status">สถานะ</option>
                        <option value="created">วันที่สร้าง</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">แสดงผล</label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white">
                        <option value="grid">แบบตาราง</option>
                        <option value="list">แบบรายการ</option>
                        <option value="card">แบบการ์ด</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      {/* Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRoom ? 'แก้ไขห้องพัก' : 'เพิ่มห้องพักใหม่'}
              </h3>
              
              <form onSubmit={handleRoomSubmit} className="space-y-6">
                {/* ข้อมูลประเภทห้อง */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-blue-900 mb-3">ข้อมูลประเภทห้อง</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อประเภทห้อง *
                      </label>
                      <input
                        type="text"
                        value={roomForm.room_type_name}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, room_type_name: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        placeholder="เช่น ห้องเดี่ยวแอร์"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        จำนวนคน *
                      </label>
                      <input
                        type="number"
                        value={roomForm.capacity}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, capacity: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        placeholder="1"
                        min="1"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คำอธิบายประเภทห้อง
                      </label>
                      <textarea
                        value={roomForm.room_type_description}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, room_type_description: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        rows="2"
                        placeholder="อธิบายประเภทห้อง..."
                      />
                    </div>
                  </div>
                </div>

                {/* ข้อมูลราคาและอัตรา */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-green-900 mb-3">ข้อมูลราคาและอัตรา</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ราคา/เดือน (บาท) *
                      </label>
                      <input
                        type="number"
                        value={roomForm.price_per_month}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, price_per_month: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        placeholder="3000"
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ราคา/เทอม (บาท)
                      </label>
                      <input
                        type="number"
                        value={roomForm.price_per_semester}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, price_per_semester: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        placeholder="15000"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ค่าน้ำ/หน่วย (บาท)
                      </label>
                      <input
                        type="number"
                        value={roomForm.water_rate}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, water_rate: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        placeholder="15"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ค่าไฟ/หน่วย (บาท)
                      </label>
                      <input
                        type="number"
                        value={roomForm.electricity_rate}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, electricity_rate: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        placeholder="8.5"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วันที่ครบกำหนดชำระ
                      </label>
                      <input
                        type="number"
                        value={roomForm.payment_due_day}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, payment_due_day: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        placeholder="5"
                        min="1"
                        max="31"
                      />
                    </div>
                  </div>
                </div>

                {/* ข้อมูลห้อง */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-purple-900 mb-3">ข้อมูลห้อง</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รูปแบบห้อง
                      </label>
                      <select
                        value={roomForm.room_style}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, room_style: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                      >
                        <option value="single">เดี่ยว</option>
                        <option value="double">คู่</option>
                        <option value="triple">สาม</option>
                        <option value="quad">สี่</option>
                        <option value="dormitory">หอพัก</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เพศที่อนุญาต
                      </label>
                      <select
                        value={roomForm.gender_allowed}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, gender_allowed: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                      >
                        <option value="mixed">ผสม</option>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ระดับห้อง
                      </label>
                      <select
                        value={roomForm.room_category}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, room_category: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                      >
                        <option value="standard">มาตรฐาน</option>
                        <option value="premium">พรีเมียม</option>
                        <option value="deluxe">ดีลักซ์</option>
                        <option value="vip">VIP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เฟอร์นิเจอร์
                      </label>
                      <select
                        value={roomForm.furnished}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, furnished: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                      >
                        <option value="partial">บางส่วน</option>
                        <option value="fully">ครบ</option>
                        <option value="unfurnished">ไม่มี</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ขนาดห้อง (ตร.ม.)
                      </label>
                      <input
                        type="text"
                        value={roomForm.room_size}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, room_size: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        placeholder="25 ตร.ม."
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={roomForm.air_condition}
                          onChange={(e) => setRoomForm(prev => ({ ...prev, air_condition: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">มีแอร์</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={roomForm.fan}
                          onChange={(e) => setRoomForm(prev => ({ ...prev, fan: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">มีพัดลม</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* ข้อมูลห้องเฉพาะ */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-orange-900 mb-3">ข้อมูลห้องเฉพาะ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หมายเลขห้อง *
                      </label>
                      <input
                        type="text"
                        value={roomForm.room_number}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, room_number: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        placeholder="A101"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        สถานะ
                      </label>
                      <select
                        value={roomForm.status}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                      >
                        <option value="1">ว่าง</option>
                        <option value="2">จองแล้ว</option>
                        <option value="3">มีผู้เช่า</option>
                        <option value="4">ซ่อมแซม</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คำอธิบายห้อง
                      </label>
                      <textarea
                        value={roomForm.room_description}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, room_description: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2"
                        rows="2"
                        placeholder="อธิบายห้องเฉพาะ..."
                      />
                    </div>
                  </div>
                </div>

                {/* สิ่งอำนวยความสะดวก */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-yellow-900 mb-3">สิ่งอำนวยความสะดวก</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(roomForm.facilities).map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setRoomForm(prev => ({
                            ...prev,
                            facilities: { ...prev.facilities, [key]: e.target.checked }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{getFacilityLabel(key)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ปุ่ม */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeRoomModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <LoadingButton
                    type="submit"
                    loading={submitting}
                    className="btn-primary"
                  >
                    {editingRoom ? 'อัปเดตห้อง' : 'สร้างห้องใหม่'}
                  </LoadingButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Room Detail Modal */}
      {isRoomDetailModalOpen && viewingRoom && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                รายละเอียดห้อง {viewingRoom.room_number}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(viewingRoom.status)}`}>
                      {getStatusText(viewingRoom.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ประเภท</label>
                    <p className="text-sm text-gray-900">{viewingRoom.roomType?.room_type_name || 'ไม่ระบุ'}</p>
                  </div>
                </div>

                {viewingRoom.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">คำอธิบาย</label>
                    <p className="text-sm text-gray-900">{viewingRoom.description}</p>
                  </div>
                )}

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700">จำนวนคน</label>
                     <p className="text-sm text-gray-900">{viewingRoom.roomType?.capacity || 'ไม่ระบุ'} คน</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700">ราคา/เดือน</label>
                     <p className="text-sm text-gray-900">{formatPrice(viewingRoom.roomType?.price_per_month || 0)}</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700">ค่าน้ำ/หน่วย</label>
                     <p className="text-sm text-gray-900">฿{viewingRoom.roomType?.water_rate || 0}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700">ค่าไฟ/หน่วย</label>
                     <p className="text-sm text-gray-900">฿{viewingRoom.roomType?.electricity_rate || 0}</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700">ครบกำหนดชำระ</label>
                     <p className="text-sm text-gray-900">วันที่ {viewingRoom.roomType?.payment_due_day || 'ไม่ระบุ'} ของเดือน</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700">ขนาดห้อง</label>
                     <p className="text-sm text-gray-900">{viewingRoom.roomType?.room_size || 'ไม่ระบุ'}</p>
                   </div>
                 </div>

                 {viewingRoom.roomType?.facilities && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">สิ่งอำนวยความสะดวก</label>
                     <div className="flex flex-wrap gap-2">
                       {Object.entries(viewingRoom.roomType.facilities).map(([key, value]) => (
                         value && (
                           <span key={key} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                             {getFacilityLabel(key)}
                           </span>
                         )
                       ))}
                     </div>
                   </div>
                 )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={closeRoomDetailModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Manager Modal */}
      {showImageManager && selectedRoomForImages && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  จัดการรูปภาพ - ห้อง {selectedRoomForImages.room_number}
                </h3>
                <button
                  onClick={closeImageManager}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <RoomImageManager 
                roomId={selectedRoomForImages.room_id}
                onImagesChange={() => {
                  // Refresh room data if needed
                  fetchRooms();
                }}
              />
            </div>
          </div>
        </div>
      )}

      <ToastContainer notifications={notifications} />
    </div>
  );
};

export default ManageRooms;
