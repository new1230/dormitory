import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import RoomTypeDisplayCard from '../components/RoomTypeDisplayCard';
import { LoadingSpinner } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const RoomTypesGallery = () => {
  const { user, loading: authLoading } = useAuth();
  const { notifications, showSuccess, showError } = useNotification();

  const [roomTypes, setRoomTypes] = useState([]);
  const [roomStats, setRoomStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'stats'

  useEffect(() => {
    fetchRoomTypes();
    fetchRoomStats();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/room-types');
      setRoomTypes(response.data.filter(rt => rt.is_active === '1'));
    } catch (error) {
      console.error('Failed to fetch room types:', error);
      showError('ไม่สามารถโหลดข้อมูลประเภทห้องได้');
    }
  };

  const fetchRoomStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rooms/stats');
      setRoomStats(response.data);
    } catch (error) {
      console.error('Failed to fetch room stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStyleIcon = (style) => {
    const icons = {
      'single': '🏠',
      'double': '🏡', 
      'triple': '🏘️',
      'quadruple': '🏢',
      'dormitory': '🏫'
    };
    return icons[style] || '🏠';
  };

  const getStyleText = (style) => {
    const styles = {
      'single': 'ห้องเดี่ยว',
      'double': 'ห้องคู่',
      'triple': 'ห้องสาม',
      'quadruple': 'ห้องสี่',
      'dormitory': 'ห้องโฮสเทล'
    };
    return styles[style] || style;
  };

  const getCategoryText = (category) => {
    const categories = {
      'standard': 'มาตรฐาน',
      'deluxe': 'พิเศษ',
      'suite': 'สวีท',
      'hostel': 'โฮสเทล'
    };
    return categories[category] || category;
  };

  const getGenderText = (gender) => {
    const genders = {
      'male': 'ชายเท่านั้น',
      'female': 'หญิงเท่านั้น',
      'mixed': 'ชาย-หญิง'
    };
    return genders[gender] || gender;
  };

  const getFurnishedText = (furnished) => {
    const furnished_types = {
      'fully': 'ครบครันทั้งหมด',
      'partial': 'เฟอร์นิเจอร์พื้นฐาน',
      'unfurnished': 'ห้องเปล่า'
    };
    return furnished_types[furnished] || furnished;
  };

  if (authLoading || loading) {
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

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* หัวข้อและ Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ประเภทห้องพัก</h1>
                <p className="text-gray-600 mt-2">เลือกดูประเภทห้องพักที่เปิดให้บริการ</p>
              </div>
              
              <div className="flex bg-white rounded-lg border p-1">
                <button
                  onClick={() => setViewMode('gallery')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'gallery'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🏠 แกลเลอรี่
                </button>
                <button
                  onClick={() => setViewMode('stats')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'stats'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 สถิติห้อง
                </button>
              </div>
            </div>

            {/* Content based on view mode */}
            {viewMode === 'gallery' ? (
              // Gallery View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomTypes.map((roomType) => (
                  <RoomTypeDisplayCard 
                    key={roomType.room_type_id} 
                    roomType={roomType}
                  />
                ))}
              </div>
            ) : (
              // Stats View
              <div className="space-y-6">
                {roomTypes.map((roomType) => {
                  const stats = roomStats[roomType.room_type_id] || {
                    total: 0,
                    available: 0,
                    occupied: 0,
                    booked: 0,
                    maintenance: 0,
                    rooms: []
                  };

                  return (
                    <div key={roomType.room_type_id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getStyleIcon(roomType.room_style)}</span>
                            <div>
                              <h2 className="text-xl font-bold">{roomType.room_type_name}</h2>
                              <p className="text-blue-100 text-sm">
                                {getStyleText(roomType.room_style)} • {getCategoryText(roomType.room_category)} • {getGenderText(roomType.gender_allowed)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 text-sm">
                            {roomType.air_condition && (
                              <span className="bg-blue-400 bg-opacity-50 px-2 py-1 rounded">❄️ แอร์</span>
                            )}
                            {roomType.fan && !roomType.air_condition && (
                              <span className="bg-blue-400 bg-opacity-50 px-2 py-1 rounded">🌀 พัดลม</span>
                            )}
                            <span className="bg-blue-400 bg-opacity-50 px-2 py-1 rounded">
                              👥 {roomType.capacity} คน
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                            <div className="text-sm text-gray-600">ห้องว่าง</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
                            <div className="text-sm text-gray-600">มีผู้พัก</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{stats.booked}</div>
                            <div className="text-sm text-gray-600">จองแล้ว</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
                            <div className="text-sm text-gray-600">ปิดซ่อม</div>
                          </div>
                        </div>

                        {/* Price Information */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h3 className="font-medium text-gray-900 mb-3">💰 ข้อมูลราคา</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">ค่าเช่า/เดือน:</span>
                              <div className="font-semibold text-green-600">
                                ฿{Number(roomType.price_per_month).toLocaleString()}
                              </div>
                            </div>
                            {roomType.price_per_semester && (
                              <div>
                                <span className="text-gray-600">ค่าเช่า/เทอม:</span>
                                <div className="font-semibold text-blue-600">
                                  ฿{Number(roomType.price_per_semester).toLocaleString()}
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">ค่าน้ำ/หน่วย:</span>
                              <div className="font-semibold">฿{Number(roomType.water_rate).toFixed(1)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">ค่าไฟ/หน่วย:</span>
                              <div className="font-semibold">฿{Number(roomType.electricity_rate).toFixed(1)}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            📅 ชำระค่าเช่าทุกวันที่ {roomType.payment_due_day} ของเดือน
                          </div>
                        </div>

                        {/* Occupied Rooms Details */}
                        {stats.occupied > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-medium text-red-800 mb-2">🏠 ห้องที่มีผู้พัก ({stats.occupied} ห้อง)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                              {stats.rooms
                                .filter(room => room.status === '0')
                                .map(room => (
                                  <div key={room.room_id} className="bg-white p-2 rounded border">
                                    <div className="font-medium">ห้อง {room.room_number}</div>
                                    {room.tenant_name && (
                                      <div className="text-gray-600">ผู้เช่า: {room.tenant_name}</div>
                                    )}
                                    {room.contract_end && (
                                      <div className="text-red-600 text-xs">
                                        หมดสัญญา: {new Date(room.contract_end).toLocaleDateString('th-TH')}
                                        {room.days_left_contract && (
                                          <span className="ml-1">
                                            ({room.days_left_contract > 0 ? `อีก ${room.days_left_contract} วัน` : 'หมดแล้ว'})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Booked Rooms Details */}
                        {stats.booked > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <h4 className="font-medium text-blue-800 mb-2">📋 ห้องที่จองแล้ว ({stats.booked} ห้อง)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                              {stats.rooms
                                .filter(room => room.status === '3')
                                .map(room => (
                                  <div key={room.room_id} className="bg-white p-2 rounded border">
                                    <div className="font-medium">ห้อง {room.room_number}</div>
                                    <div className="text-blue-600 text-xs">รอยืนยันการเข้าพัก</div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {roomTypes.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏠</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีประเภทห้องพัก</h3>
                <p className="text-gray-600">กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มประเภทห้องพัก</p>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
      
      <ToastContainer notifications={notifications} />
    </div>
  );
};

export default RoomTypesGallery;
