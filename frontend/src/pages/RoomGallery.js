import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { LoadingSpinner } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const RoomGallery = () => {
  const { notifications, showError } = useNotification();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    roomType: 'all',
    priceRange: 'all',
    status: 'available' // only show available rooms
  });

  // Price ranges
  const priceRanges = [
    { value: 'all', label: 'ทุกช่วงราคา' },
    { value: '0-3000', label: 'ต่ำกว่า 3,000 บาท' },
    { value: '3000-5000', label: '3,000 - 5,000 บาท' },
    { value: '5000-8000', label: '5,000 - 8,000 บาท' },
    { value: '8000+', label: 'มากกว่า 8,000 บาท' }
  ];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/rooms', {
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

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    // Only show available rooms
    if (room.status !== '1') return false;
    
    // Search filter
    if (filters.search && !room.room_number.toLowerCase().includes(filters.search.toLowerCase()) &&
        !room.roomType?.room_type_name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Room type filter
    if (filters.roomType !== 'all' && room.room_type_id !== parseInt(filters.roomType)) {
      return false;
    }
    
    // Price range filter
    if (filters.priceRange !== 'all') {
      const price = room.roomType?.price_per_month || 0;
      const [min, max] = filters.priceRange.split('-').map(p => p === '+' ? Infinity : parseInt(p));
      if (price < min || (max !== Infinity && price > max)) {
        return false;
      }
    }
    
    return true;
  });

  // Get unique room types for filter
  const roomTypes = [...new Set(rooms.map(room => room.roomType).filter(Boolean))]
    .map(roomType => ({
      room_type_id: roomType.room_type_id,
      room_type_name: roomType.room_type_name
    }));

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case '1': return 'bg-green-100 text-green-800';
      case '2': return 'bg-yellow-100 text-yellow-800';
      case '3': return 'bg-red-100 text-red-800';
      case '4': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case '1': return 'ว่าง';
      case '2': return 'จองแล้ว';
      case '3': return 'มีผู้เช่า';
      case '4': return 'ซ่อมแซม';
      default: return 'ไม่ทราบ';
    }
  };

  const openRoomDetail = (room) => {
    setSelectedRoom(room);
    setIsDetailModalOpen(true);
  };

  const closeRoomDetail = () => {
    setSelectedRoom(null);
    setIsDetailModalOpen(false);
  };

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                🏠 ห้องพักนักศึกษา
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                ค้นหาห้องพักที่เหมาะกับคุณ พร้อมสิ่งอำนวยความสะดวกครบครัน
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
                <div className="text-2xl font-bold mb-2">
                  {filteredRooms.length} ห้องว่าง
                </div>
                <div className="text-blue-100">
                  พร้อมให้บริการคุณ
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                ค้นหาห้องพัก
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="หมายเลขห้อง, ประเภท..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทห้อง</label>
                  <select
                    value={filters.roomType}
                    onChange={(e) => setFilters(prev => ({ ...prev, roomType: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="all">ทุกประเภท</option>
                    {roomTypes.map(type => (
                      <option key={type.room_type_id} value={type.room_type_id}>
                        {type.room_type_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงราคา</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    {priceRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ search: '', roomType: 'all', priceRange: 'all', status: 'available' })}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              </div>
            </div>

            {/* Room Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-300 text-8xl mb-6">🔍</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">ไม่พบห้องที่ตรงกับเงื่อนไข</h3>
                <p className="text-gray-500 mb-6">ลองเปลี่ยนตัวกรองหรือค้นหาคำอื่น</p>
                <button
                  onClick={() => setFilters({ search: '', roomType: 'all', priceRange: 'all', status: 'available' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRooms.map((room) => (
                  <div key={room.room_id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                    {/* Room Image Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl text-blue-300">🏠</div>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(room.status)} shadow-sm`}>
                          {getStatusText(room.status)}
                        </span>
                      </div>
                    </div>

                    {/* Room Content */}
                    <div className="p-6">
                      {/* Room Number & Type */}
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          ห้อง {room.room_number}
                        </h3>
                        <p className="text-lg text-gray-600 mt-1">
                          {room.roomType?.room_type_name || 'ไม่ระบุประเภท'}
                        </p>
                      </div>

                      {/* Room Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-sm text-gray-600">จำนวนคน</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {room.roomType?.capacity || 'ไม่ระบุ'} คน
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span className="text-sm text-gray-600">ราคา/เดือน</span>
                          </div>
                          <span className="text-lg font-bold text-blue-600">
                            ฿{formatPrice(room.roomType?.price_per_month || 0)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <span className="text-sm text-gray-600">ค่าน้ำ</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            ฿{room.roomType?.water_rate || 0}/หน่วย
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-sm text-gray-600">ค่าไฟ</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            ฿{room.roomType?.electricity_rate || 0}/หน่วย
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => openRoomDetail(room)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      {/* Room Detail Modal */}
      {isDetailModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  ห้อง {selectedRoom.room_number}
                </h3>
                <button
                  onClick={closeRoomDetail}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Room Image */}
                <div className="h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                  <div className="text-8xl text-blue-300">🏠</div>
                </div>

                {/* Room Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลห้อง</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">หมายเลขห้อง:</span>
                        <span className="font-semibold">{selectedRoom.room_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ประเภท:</span>
                        <span className="font-semibold">{selectedRoom.roomType?.room_type_name || 'ไม่ระบุ'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">จำนวนคน:</span>
                        <span className="font-semibold">{selectedRoom.roomType?.capacity || 'ไม่ระบุ'} คน</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">สถานะ:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedRoom.status)}`}>
                          {getStatusText(selectedRoom.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">ราคาและอัตรา</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ราคา/เดือน:</span>
                        <span className="font-bold text-blue-600 text-lg">
                          ฿{formatPrice(selectedRoom.roomType?.price_per_month || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ค่าน้ำ/หน่วย:</span>
                        <span className="font-semibold">฿{selectedRoom.roomType?.water_rate || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ค่าไฟ/หน่วย:</span>
                        <span className="font-semibold">฿{selectedRoom.roomType?.electricity_rate || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ครบกำหนดชำระ:</span>
                        <span className="font-semibold">วันที่ {selectedRoom.roomType?.payment_due_day || 'ไม่ระบุ'} ของเดือน</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedRoom.description && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">คำอธิบาย</h4>
                    <p className="text-gray-600">{selectedRoom.description}</p>
                  </div>
                )}

                {/* Facilities */}
                {selectedRoom.roomType?.facilities && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">สิ่งอำนวยความสะดวก</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedRoom.roomType.facilities).map(([key, value]) => (
                        value && (
                          <span key={key} className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {key.replace('_', ' ')}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t">
                  <button
                    onClick={closeRoomDetail}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    ปิด
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    จองห้องนี้
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer notifications={notifications} />
    </div>
  );
};

export default RoomGallery;
