import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import RoomImageManager from '../components/RoomImageManager';
import RoomTypeImageManager from '../components/RoomTypeImageManager';
import { LoadingSpinner, LoadingButton } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
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
  const [activeTab, setActiveTab] = useState('roomTypes'); // 'roomTypes' | 'rooms'
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isRoomDetailModalOpen, setIsRoomDetailModalOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [viewingRoom, setViewingRoom] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    room_type_id: '',
    status: '',
    search: ''
  });

  // Form states
  const [roomTypeForm, setRoomTypeForm] = useState({
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

  const [roomForm, setRoomForm] = useState({
    room_type_id: '',
    room_number: '',
    description: '',
    status: '1'
  });

  // ตรวจสอบสิทธิ์
  useEffect(() => {
    if (!authLoading && user && !['Manager', 'Admin'].includes(user.role)) {
      navigate('/');
      showError('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && ['Manager', 'Admin'].includes(user.role)) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'rooms') {
      fetchRooms();
    }
  }, [filters, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRoomTypes(),
        fetchRooms()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/room-types');
      setRoomTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch room types:', error);
      showError('ไม่สามารถโหลดข้อมูลประเภทห้องได้');
    }
  };

  const fetchRooms = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.room_type_id) params.append('room_type_id', filters.room_type_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`http://localhost:5000/api/rooms?${params}`);
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      showError('ไม่สามารถโหลดข้อมูลห้องได้');
    }
  };

  // Room Type Functions
  const handleRoomTypeSubmit = async (e) => {
    e.preventDefault();
    
    if (!roomTypeForm.room_type_name.trim() || !roomTypeForm.capacity || !roomTypeForm.price_per_month) {
      showWarning('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setSubmitting(true);

    try {
      if (editingRoomType) {
        await axios.put(`http://localhost:5000/api/room-types/${editingRoomType.room_type_id}`, roomTypeForm);
        showSuccess('อัปเดตประเภทห้องสำเร็จ');
      } else {
        await axios.post('http://localhost:5000/api/room-types', roomTypeForm);
        showSuccess('เพิ่มประเภทห้องสำเร็จ');
      }

      await fetchRoomTypes();
      closeRoomTypeModal();
    } catch (error) {
      console.error('Submit room type error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoomTypeEdit = (roomType) => {
    setEditingRoomType(roomType);
    setRoomTypeForm({
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
    setIsRoomTypeModalOpen(true);
  };

  const handleRoomTypeToggle = async (roomType) => {
    try {
      await axios.patch(`http://localhost:5000/api/room-types/${roomType.room_type_id}/toggle`);
      showSuccess(`${roomType.is_active === '1' ? 'ปิด' : 'เปิด'}ใช้งานประเภทห้องสำเร็จ`);
      await fetchRoomTypes();
    } catch (error) {
      console.error('Toggle status error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const handleRoomTypeDelete = async (roomType) => {
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

  // Room Functions
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    
    if (!roomForm.room_type_id || !roomForm.room_number.trim()) {
      showWarning('กรุณาเลือกประเภทห้องและใส่หมายเลขห้อง');
      return;
    }

    setSubmitting(true);

    try {
      if (editingRoom) {
        await axios.put(`http://localhost:5000/api/rooms/${editingRoom.room_id}`, roomForm);
        showSuccess('อัปเดตห้องสำเร็จ');
      } else {
        await axios.post('http://localhost:5000/api/rooms', roomForm);
        showSuccess('เพิ่มห้องสำเร็จ');
      }

      await fetchRooms();
      closeRoomModal();
    } catch (error) {
      console.error('Submit room error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoomEdit = (room) => {
    setEditingRoom(room);
    setRoomForm({
      room_type_id: room.room_type_id.toString(),
      room_number: room.room_number,
      description: room.description || '',
      status: room.status
    });
    setIsRoomModalOpen(true);
  };

  const handleRoomStatusChange = async (room, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/rooms/${room.room_id}/status`, {
        status: newStatus
      });
      showSuccess('เปลี่ยนสถานะห้องสำเร็จ');
      await fetchRooms();
    } catch (error) {
      console.error('Update room status error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const handleRoomDelete = async (room) => {
    if (!window.confirm(`คุณต้องการลบห้อง "${room.room_number}" หรือไม่?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/rooms/${room.room_id}`);
      showSuccess('ลบห้องสำเร็จ');
      await fetchRooms();
    } catch (error) {
      console.error('Delete room error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบห้อง');
    }
  };

  // Modal Functions
  const openCreateRoomTypeModal = () => {
    setEditingRoomType(null);
    setRoomTypeForm({
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
    setIsRoomTypeModalOpen(true);
  };

  const closeRoomTypeModal = () => {
    setIsRoomTypeModalOpen(false);
    setEditingRoomType(null);
  };

  const openCreateRoomModal = () => {
    setEditingRoom(null);
    setRoomForm({
      room_type_id: '',
      room_number: '',
      description: '',
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
      '0': 'bg-red-100 text-red-800',     // จอง
      '2': 'bg-yellow-100 text-yellow-800' // ซ่อม
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      '1': 'ว่าง',
      '0': 'จอง',
      '2': 'ซ่อม'
    };
    return statusTexts[status] || 'ไม่ทราบ';
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
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">จัดการห้องพัก</h1>
              <p className="text-gray-600 mt-2">จัดการประเภทห้องและห้องพักทั้งหมด</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('roomTypes')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'roomTypes'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📋 ประเภทห้อง ({roomTypes.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('rooms')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'rooms'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🏠 ห้องพัก ({rooms.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="medium" />
              </div>
            ) : (
              <>
                {/* Room Types Tab */}
                {activeTab === 'roomTypes' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium text-gray-900">ประเภทห้อง</h2>
                      <button
                        onClick={openCreateRoomTypeModal}
                        className="btn-primary text-sm"
                      >
                        + เพิ่มประเภทห้อง
                      </button>
                    </div>

                    {roomTypes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>ยังไม่มีประเภทห้อง</p>
                        <button
                          onClick={openCreateRoomTypeModal}
                          className="mt-4 text-blue-600 hover:text-blue-800 underline"
                        >
                          เพิ่มประเภทห้องแรก
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roomTypes.map((roomType) => (
                          <div key={roomType.room_type_id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  {roomType.room_type_name}
                                </h3>
                                {roomType.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {roomType.description}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  roomType.is_active === '1'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {roomType.is_active === '1' ? 'ใช้งาน' : 'ปิดใช้'}
                              </span>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">จำนวนคน:</span>
                                <span className="text-sm font-medium">{roomType.capacity} คน</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">ราคา/เดือน:</span>
                                <span className="text-sm font-medium">{formatPrice(roomType.price_per_month)}</span>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleRoomTypeEdit(roomType)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="แก้ไข"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleRoomTypeToggle(roomType)}
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
                                onClick={() => handleRoomTypeDelete(roomType)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="ลบ"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Rooms Tab */}
                {activeTab === 'rooms' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                      <h2 className="text-lg font-medium text-gray-900">ห้องพัก</h2>
                      
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        {/* Filters */}
                        <div className="flex space-x-2">
                          <select
                            value={filters.room_type_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, room_type_id: e.target.value }))}
                            className="text-sm border rounded-lg px-3 py-2"
                          >
                            <option value="">ทุกประเภท</option>
                            {roomTypes.map(rt => (
                              <option key={rt.room_type_id} value={rt.room_type_id}>
                                {rt.room_type_name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="text-sm border rounded-lg px-3 py-2"
                          >
                            <option value="">ทุกสถานะ</option>
                            <option value="1">ว่าง</option>
                            <option value="0">จอง</option>
                            <option value="2">ซ่อม</option>
                          </select>

                          <input
                            type="text"
                            placeholder="ค้นหาหมายเลขห้อง"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="text-sm border rounded-lg px-3 py-2 w-40"
                          />
                        </div>
                        
                        <button
                          onClick={openCreateRoomModal}
                          className="btn-primary text-sm"
                        >
                          + เพิ่มห้อง
                        </button>
                      </div>
                    </div>

                    {rooms.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>ไม่พบห้องที่ตรงกับเงื่อนไข</p>
                        <button
                          onClick={openCreateRoomModal}
                          className="mt-4 text-blue-600 hover:text-blue-800 underline"
                        >
                          เพิ่มห้องใหม่
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {rooms.map((room) => (
                          <div key={room.room_id} className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  ห้อง {room.room_number}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {room.roomType?.room_type_name}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(room.status)}`}>
                                {getStatusText(room.status)}
                              </span>
                            </div>

                            {room.description && (
                              <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                            )}

                            <div className="space-y-1 mb-4 text-xs text-gray-600">
                              <div>จำนวนคน: {room.roomType?.capacity} คน</div>
                              <div>ราคา: {formatPrice(room.roomType?.price_per_month || 0)}/เดือน</div>
                            </div>

                            <div className="flex flex-col space-y-2">
                              <select
                                value={room.status}
                                onChange={(e) => handleRoomStatusChange(room, e.target.value)}
                                className="text-xs border rounded px-2 py-1"
                              >
                                <option value="1">ว่าง</option>
                                <option value="0">จอง</option>
                                <option value="2">ซ่อม</option>
                              </select>

                              <div className="flex justify-center space-x-1">
                                <button
                                  onClick={() => openRoomDetailModal(room)}
                                  className="text-green-600 hover:text-green-900 transition-colors"
                                  title="ดูรายละเอียด"
                                >
                                  📷
                                </button>
                                <button
                                  onClick={() => handleRoomEdit(room)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                  title="แก้ไข"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleRoomDelete(room)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                  title="ลบ"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PageTransition>

      {/* Room Type Modal */}
      {isRoomTypeModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRoomType ? 'แก้ไขประเภทห้อง' : 'เพิ่มประเภทห้องใหม่'}
              </h3>
              
              <form onSubmit={handleRoomTypeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อประเภทห้อง *
                  </label>
                  <input
                    type="text"
                    name="room_type_name"
                    value={roomTypeForm.room_type_name}
                    onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                    className="input-field"
                    placeholder="เช่น ห้องเดี่ยว, ห้องคู่"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คำอธิบาย
                  </label>
                  <textarea
                    name="description"
                    value={roomTypeForm.description}
                    onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                    rows="3"
                    className="input-field"
                    placeholder="รายละเอียดประเภทห้อง"
                  />
                </div>

                {/* ข้อมูลพื้นฐาน */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      จำนวนคน *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={roomTypeForm.capacity}
                      onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
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
                      value={roomTypeForm.room_size}
                      onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                      className="input-field"
                      placeholder="15.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* ประเภทห้อง */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ประเภทตามจำนวนคน *
                    </label>
                    <select
                      name="room_style"
                      value={roomTypeForm.room_style}
                      onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
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
                      value={roomTypeForm.gender_allowed}
                      onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                      className="input-field"
                      required
                    >
                      <option value="mixed">ชาย-หญิง</option>
                      <option value="male">ชายเท่านั้น</option>
                      <option value="female">หญิงเท่านั้น</option>
                    </select>
                  </div>
                </div>

                {/* หมวดห้องและเฟอร์นิเจอร์ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      หมวดห้อง *
                    </label>
                    <select
                      name="room_category"
                      value={roomTypeForm.room_category}
                      onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                      className="input-field"
                      required
                    >
                      <option value="standard">ห้องมาตรฐาน</option>
                      <option value="deluxe">ห้องพิเศษ</option>
                      <option value="suite">ห้องสวีท</option>
                      <option value="hostel">ห้องโฮสเทล</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ระดับเฟอร์นิเจอร์ *
                    </label>
                    <select
                      name="furnished"
                      value={roomTypeForm.furnished}
                      onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                      className="input-field"
                      required
                    >
                      <option value="partial">เฟอร์นิเจอร์พื้นฐาน</option>
                      <option value="fully">ครบครันทั้งหมด</option>
                      <option value="unfurnished">ห้องเปล่า</option>
                    </select>
                  </div>
                </div>

                {/* สิ่งอำนวยความสะดวกพื้นฐาน */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สิ่งอำนวยความสะดวกพื้นฐาน
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={roomTypeForm.air_condition}
                        onChange={(e) => setRoomTypeForm(prev => ({...prev, air_condition: e.target.checked}))}
                        className="mr-2"
                      />
                      แอร์
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={roomTypeForm.fan}
                        onChange={(e) => setRoomTypeForm(prev => ({...prev, fan: e.target.checked}))}
                        className="mr-2"
                      />
                      พัดลม
                    </label>
                  </div>
                </div>

                {/* ราคาและค่าใช้จ่าย */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800 border-b pb-2">ราคาและค่าใช้จ่าย</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ราคา/เดือน (บาท) *
                      </label>
                      <input
                        type="number"
                        name="price_per_month"
                        value={roomTypeForm.price_per_month}
                        onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
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
                        value={roomTypeForm.price_per_semester}
                        onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                        className="input-field"
                        placeholder="15750"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ค่าน้ำ/หน่วย *
                      </label>
                      <input
                        type="number"
                        name="water_rate"
                        value={roomTypeForm.water_rate}
                        onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                        className="input-field"
                        placeholder="18.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ค่าไฟ/หน่วย *
                      </label>
                      <input
                        type="number"
                        name="electricity_rate"
                        value={roomTypeForm.electricity_rate}
                        onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
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
                        value={roomTypeForm.payment_due_day}
                        onChange={(e) => setRoomTypeForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                        className="input-field"
                        placeholder="5"
                        min="1"
                        max="31"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* สิ่งอำนวยความสะดวกเพิ่มเติม */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สิ่งอำนวยความสะดวกเพิ่มเติม
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.keys(roomTypeForm.facilities).map(facility => (
                      <label key={facility} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={roomTypeForm.facilities[facility]}
                          onChange={(e) => setRoomTypeForm(prev => ({
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

                {/* รูปภาพประเภทห้อง */}
                {editingRoomType && (
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-800 mb-3">📷 รูปภาพประเภทห้อง</h4>
                    <RoomTypeImageManager 
                      roomTypeId={editingRoomType.room_type_id}
                      onImagesChange={() => {
                        // Refresh room types if needed
                        fetchRoomTypes();
                      }}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeRoomTypeModal}
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

      {/* Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRoom ? 'แก้ไขห้อง' : 'เพิ่มห้องใหม่'}
              </h3>
              
              <form onSubmit={handleRoomSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทห้อง *
                  </label>
                  <select
                    name="room_type_id"
                    value={roomForm.room_type_id}
                    onChange={(e) => setRoomForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                    className="input-field"
                    required
                  >
                    <option value="">เลือกประเภทห้อง</option>
                    {roomTypes.filter(rt => rt.is_active === '1').map(rt => (
                      <option key={rt.room_type_id} value={rt.room_type_id}>
                        {rt.room_type_name} ({rt.capacity} คน - {formatPrice(rt.price_per_month)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมายเลขห้อง *
                  </label>
                  <input
                    type="text"
                    name="room_number"
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                    className="input-field"
                    placeholder="เช่น 101, A-201"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คำอธิบาย
                  </label>
                  <textarea
                    name="description"
                    value={roomForm.description}
                    onChange={(e) => setRoomForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                    rows="3"
                    className="input-field"
                    placeholder="รายละเอียดห้อง (ถ้ามี)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะห้อง
                  </label>
                  <select
                    name="status"
                    value={roomForm.status}
                    onChange={(e) => setRoomForm(prev => ({...prev, [e.target.name]: e.target.value}))}
                    className="input-field"
                  >
                    <option value="1">ว่าง</option>
                    <option value="0">จอง</option>
                    <option value="2">ซ่อม</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeRoomModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <LoadingButton
                    type="submit"
                    loading={submitting}
                    className="btn-primary"
                  >
                    {editingRoom ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มห้อง'}
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
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  รายละเอียดห้อง {viewingRoom.room_number}
                </h3>
                <button
                  onClick={closeRoomDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Room Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">ข้อมูลห้อง</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>หมายเลขห้อง:</strong> {viewingRoom.room_number}</div>
                      <div><strong>ประเภท:</strong> {viewingRoom.roomType?.room_type_name}</div>
                      <div><strong>จำนวนคน:</strong> {viewingRoom.roomType?.capacity} คน</div>
                      <div><strong>สถานะ:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(viewingRoom.status)}`}>
                          {getStatusText(viewingRoom.status)}
                        </span>
                      </div>
                      {viewingRoom.description && (
                        <div><strong>คำอธิบาย:</strong> {viewingRoom.description}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">ข้อมูลราคา</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>ค่าเช่า/เดือน:</strong> {formatPrice(viewingRoom.roomType?.price_per_month || 0)}</div>
                      {viewingRoom.roomType?.price_per_semester && (
                        <div><strong>ค่าเช่า/เทอม:</strong> {formatPrice(viewingRoom.roomType.price_per_semester)}</div>
                      )}
                      <div><strong>ค่าน้ำ/หน่วย:</strong> ฿{Number(viewingRoom.roomType?.water_rate || 0).toFixed(1)}</div>
                      <div><strong>ค่าไฟ/หน่วย:</strong> ฿{Number(viewingRoom.roomType?.electricity_rate || 0).toFixed(1)}</div>
                      <div><strong>ครบกำหนดชำระ:</strong> วันที่ {viewingRoom.roomType?.payment_due_day} ของเดือน</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Images */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-3">📷 รูปภาพห้อง</h4>
                <RoomImageManager 
                  roomId={viewingRoom.room_id}
                  onImagesChange={() => {
                    // Refresh room data if needed
                  }}
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={closeRoomDetailModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer notifications={notifications} />
    </div>
  );
};

export default ManageRooms;
