import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { LoadingSpinner } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const Dormitories = () => {
  const navigate = useNavigate();
  const { notifications, showError } = useNotification();

  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1=เลือกประเภท, 2=เลือกห้อง, 3=ผลการกรอง
  const [showFilters, setShowFilters] = useState(false);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [filters, setFilters] = useState({
    room_style: '',
    gender_allowed: '',
    furnished: '',
    room_category: '',
    air_condition: '',
    min_price: '',
    max_price: '',
    capacity: ''
  });

  useEffect(() => {
    fetchRoomTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRoomTypes = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching room types...');
      const response = await axios.get('http://localhost:5000/api/room-types/availability');
      console.log('✅ Room types response:', response.data);
      setRoomTypes(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch room types:', error);
      showError('ไม่สามารถโหลดข้อมูลประเภทห้องได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async (roomTypeId) => {
    setLoadingRooms(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/rooms/available/${roomTypeId}`);
      setAvailableRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch available rooms:', error);
      showError('ไม่สามารถโหลดข้อมูลห้องว่างได้');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSelectRoomType = (roomType) => {
    if (!roomType.stats.has_available) return;
    
    setSelectedRoomType(roomType);
    setCurrentStep(2);
    fetchAvailableRooms(roomType.room_type_id);
  };

  const handleSelectRoom = (room) => {
    navigate(`/room-detail/${room.room_id}`);
  };

  const handleBackToRoomTypes = () => {
    setCurrentStep(1);
    setSelectedRoomType(null);
    setAvailableRooms([]);
    setFilteredRooms([]);
    setShowFilters(false);
  };

  const handleApplyFilters = async () => {
    setLoadingFiltered(true);
    setCurrentStep(3);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await axios.get(`http://localhost:5000/api/rooms/filtered?${queryParams}`);
      setFilteredRooms(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch filtered rooms:', error);
      showError('ไม่สามารถกรองห้องได้');
    } finally {
      setLoadingFiltered(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      room_style: '',
      gender_allowed: '',
      furnished: '',
      room_category: '',
      air_condition: '',
      min_price: '',
      max_price: '',
      capacity: ''
    });
    setCurrentStep(1);
    setFilteredRooms([]);
    setShowFilters(false);
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
      'fully': 'ครบครัน',
      'partial': 'พื้นฐาน',
      'unfurnished': 'ห้องเปล่า'
    };
    return furnished_types[furnished] || furnished;
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="large" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
          <div className="max-w-7xl mx-auto px-4">
            
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <button 
                onClick={() => {
                  if (currentStep !== 1) {
                    handleBackToRoomTypes();
                  }
                }}
                className={`${currentStep === 1 ? 'text-blue-600 font-medium' : 'hover:text-blue-600 cursor-pointer'}`}
              >
                🏠 เลือกประเภทห้อง
              </button>
              {currentStep === 2 && (
                <>
                  <span className="mx-2">›</span>
                  <span className="text-blue-600 font-medium">🔍 เลือกห้อง</span>
                </>
              )}
              {currentStep === 3 && (
                <>
                  <span className="mx-2">›</span>
                  <span className="text-blue-600 font-medium">🔍 ผลการกรอง</span>
                </>
              )}
            </div>

            {/* หัวข้อ */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {currentStep === 1 ? 'เลือกประเภทห้องพัก' : 
                     currentStep === 2 ? `ห้องว่าง - ${selectedRoomType?.room_type_name}` :
                     'ผลการกรองห้อง'}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {currentStep === 1 
                      ? 'เลือกประเภทห้องที่ต้องการ และดูจำนวนห้องว่าง หรือใช้ตัวกรองขั้นสูง'
                      : currentStep === 2 
                      ? `มีห้องว่าง ${selectedRoomType?.stats.available} ห้อง จากทั้งหมด ${selectedRoomType?.stats.total} ห้อง`
                      : `พบห้องที่ตรงเงื่อนไข ${filteredRooms.length} ห้อง`
                    }
                  </p>
                </div>
                
                {/* Filter Toggle Button */}
                {currentStep === 1 && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      🔍 ตัวกรองขั้นสูง
                      <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>⌄</span>
                    </button>
                    {(showFilters || currentStep === 3) && (
                      <button
                        onClick={handleBackToRoomTypes}
                        className="btn-secondary"
                      >
                        รีเซ็ต
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* Filter Panel */}
            {showFilters && currentStep === 1 && (
              <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 ตัวกรองขั้นสูง</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* ประเภทห้อง */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทห้อง</label>
                    <select 
                      value={filters.room_style} 
                      onChange={(e) => setFilters(prev => ({...prev, room_style: e.target.value}))}
                      className="input-field"
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="single">ห้องเดี่ยว</option>
                      <option value="double">ห้องคู่</option>
                      <option value="triple">ห้อง 3 คน</option>
                      <option value="quadruple">ห้อง 4 คน</option>
                      <option value="dormitory">ห้องรวม</option>
                    </select>
                  </div>

                  {/* เพศที่อนุญาต */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เพศที่อนุญาต</label>
                    <select 
                      value={filters.gender_allowed} 
                      onChange={(e) => setFilters(prev => ({...prev, gender_allowed: e.target.value}))}
                      className="input-field"
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="male">ชายเท่านั้น</option>
                      <option value="female">หญิงเท่านั้น</option>
                      <option value="mixed">ชาย-หญิง</option>
                    </select>
                  </div>

                  {/* เฟอร์นิเจอร์ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เฟอร์นิเจอร์</label>
                    <select 
                      value={filters.furnished} 
                      onChange={(e) => setFilters(prev => ({...prev, furnished: e.target.value}))}
                      className="input-field"
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="fully">ครบครัน</option>
                      <option value="partial">พื้นฐาน</option>
                      <option value="unfurnished">ห้องเปล่า</option>
                    </select>
                  </div>

                  {/* ประเภทตามรูปแบบ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ระดับห้อง</label>
                    <select 
                      value={filters.room_category} 
                      onChange={(e) => setFilters(prev => ({...prev, room_category: e.target.value}))}
                      className="input-field"
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="standard">มาตรฐาน</option>
                      <option value="deluxe">ดีลักซ์</option>
                      <option value="suite">สวีท</option>
                      <option value="hostel">โฮสเทล</option>
                    </select>
                  </div>

                  {/* แอร์ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เครื่องปรับอากาศ</label>
                    <select 
                      value={filters.air_condition} 
                      onChange={(e) => setFilters(prev => ({...prev, air_condition: e.target.value}))}
                      className="input-field"
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="1">มีแอร์</option>
                      <option value="0">ไม่มีแอร์</option>
                    </select>
                  </div>

                  {/* จำนวนคน */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนคน</label>
                    <select 
                      value={filters.capacity} 
                      onChange={(e) => setFilters(prev => ({...prev, capacity: e.target.value}))}
                      className="input-field"
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="1">1 คน</option>
                      <option value="2">2 คน</option>
                      <option value="3">3 คน</option>
                      <option value="4">4 คน</option>
                    </select>
                  </div>

                  {/* ราคาต่ำสุด */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ราคาขั้นต่ำ (บาท)</label>
                    <input
                      type="number"
                      value={filters.min_price}
                      onChange={(e) => setFilters(prev => ({...prev, min_price: e.target.value}))}
                      className="input-field"
                      placeholder="เช่น 1000"
                    />
                  </div>

                  {/* ราคาสูงสุด */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ราคาสูงสุด (บาท)</label>
                    <input
                      type="number"
                      value={filters.max_price}
                      onChange={(e) => setFilters(prev => ({...prev, max_price: e.target.value}))}
                      className="input-field"
                      placeholder="เช่น 5000"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleApplyFilters}
                    className="btn-primary flex items-center gap-2"
                  >
                    🔍 ค้นหาห้อง
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="btn-secondary"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: เลือกประเภทห้อง */}
            {currentStep === 1 && !showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomTypes.map((roomType) => {
                  const isAvailable = roomType.stats.has_available;
                  
                  return (
                    <div
                      key={roomType.room_type_id}
                      onClick={() => handleSelectRoomType(roomType)}
                      className={`
                        relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform
                        ${isAvailable 
                          ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' 
                          : 'opacity-60 cursor-not-allowed bg-gray-100'
                        }
                      `}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200">
                        {roomType.thumbnail ? (
                        <img
                        src={`http://localhost:5000/uploads/room-types/${roomType.thumbnail}`}
                        alt={roomType.room_type_name}
                        className={`w-full h-full object-cover transition-all duration-300 ${!isAvailable ? 'filter grayscale' : ''}`}
                          onError={(e) => {
                              e.target.style.display = 'none';
                             }}
                           />
                         ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-500">
                              <div className="text-6xl mb-2">{getStyleIcon(roomType.room_style)}</div>
                              <p className="text-sm">{roomType.room_type_name}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Availability Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isAvailable 
                              ? 'bg-green-500 text-white' 
                              : 'bg-red-500 text-white'
                          }`}>
                            {isAvailable ? `${roomType.stats.available} ห้องว่าง` : 'เต็ม'}
                          </span>
                        </div>

                        {/* Not Available Overlay */}
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="text-2xl mb-2">🚫</div>
                              <p className="text-sm font-medium">ไม่มีห้องว่าง</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {roomType.room_type_name}
                        </h3>
                        
                        {roomType.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {roomType.description}
                          </p>
                        )}

                        {/* Info */}
                        <div className="flex items-center justify-between mb-4 text-sm">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              👥 {roomType.capacity} คน
                            </span>
                            {roomType.room_size && (
                              <span className="flex items-center gap-1">
                                📐 {roomType.room_size} ตร.ม.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {getGenderText(roomType.gender_allowed)}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {getFurnishedText(roomType.furnished)}
                          </span>
                          {roomType.air_condition && (
                            <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-xs">
                              ❄️ แอร์
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-lg font-bold text-green-600">
                                ฿{Number(roomType.price_per_month).toLocaleString()}
                              </span>
                              <span className="text-gray-500 text-sm">/เดือน</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              ครบกำหนด {roomType.payment_due_day}/เดือน
                            </div>
                          </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-3 gap-2 text-xs text-center">
                            <div className="text-green-600">
                              <div className="font-semibold">{roomType.stats.available}</div>
                              <div>ว่าง</div>
                            </div>
                            <div className="text-red-600">
                              <div className="font-semibold">{roomType.stats.occupied}</div>
                              <div>มีผู้พัก</div>
                            </div>
                            <div className="text-blue-600">
                              <div className="font-semibold">{roomType.stats.booked}</div>
                              <div>จองแล้ว</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 3: ผลการกรอง */}
            {currentStep === 3 && (
              <div>
                {loadingFiltered ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="medium" />
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบห้องที่ตรงเงื่อนไข</h3>
                    <p className="text-gray-600 mb-4">ลองปรับเงื่อนไขการค้นหาใหม่</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => {
                          setCurrentStep(1);
                          setShowFilters(true);
                        }}
                        className="btn-primary"
                      >
                        ปรับเงื่อนไขใหม่
                      </button>
                      <button
                        onClick={handleBackToRoomTypes}
                        className="btn-secondary"
                      >
                        กลับหน้าแรก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRooms.map((room) => (
                      <div
                        key={room.room_id}
                        onClick={() => handleSelectRoom(room)}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg cursor-pointer transition-all duration-200 transform hover:-translate-y-1"
                      >
                        {/* Room Image */}
                        <div className="relative h-48 bg-gradient-to-br from-green-100 to-green-200">
                          {room.primary_room_image ? (
                            <img
                              src={`http://localhost:5000/uploads/rooms/${room.primary_room_image}`}
                              alt={`ห้อง ${room.room_number}`}
                              className="w-full h-full object-cover"
                            />
                          ) : room.room_type_thumbnail ? (
                            <img
                              src={`http://localhost:5000/uploads/room-types/${room.room_type_thumbnail}`}
                              alt={room.room_type_name}
                              className="w-full h-full object-cover opacity-80"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-gray-500">
                                <div className="text-4xl mb-2">{getStyleIcon(room.room_style)}</div>
                                <p className="text-sm">{room.room_number}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Available Badge */}
                          <div className="absolute top-3 right-3">
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ว่าง
                            </span>
                          </div>
                        </div>

                        {/* Room Info */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              ห้อง {room.room_number}
                            </h4>
                            <span className="text-green-600 text-sm">✅ ว่าง</span>
                          </div>
                          
                          <p className="text-md font-medium text-blue-600 mb-2">{room.room_type_name}</p>
                          
                          {room.room_description && (
                            <p className="text-sm text-gray-600 mb-3">{room.room_description}</p>
                          )}

                          <div className="space-y-1 text-xs text-gray-600 mb-3">
                            <div>👥 {room.capacity} คน</div>
                            <div>💰 ฿{Number(room.price_per_month).toLocaleString()}/เดือน</div>
                            <div>🏷️ {getGenderText(room.gender_allowed)}</div>
                            <div>🛏️ {getFurnishedText(room.furnished)}</div>
                            {room.air_condition && <div>❄️ แอร์</div>}
                            {room.fan && !room.air_condition && <div>🌀 พัดลม</div>}
                          </div>

                          <button className="w-full btn-primary text-sm">
                            ดูรายละเอียด
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: เลือกห้อง */}
            {currentStep === 2 && (
              <div>
                {loadingRooms ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="medium" />
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🏠</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีห้องว่าง</h3>
                    <p className="text-gray-600 mb-4">ประเภทห้องนี้ไม่มีห้องว่างในขณะนี้</p>
                    <button
                      onClick={handleBackToRoomTypes}
                      className="btn-primary"
                    >
                      กลับเลือกประเภทอื่น
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {availableRooms.map((room) => (
                      <div
                        key={room.room_id}
                        onClick={() => handleSelectRoom(room)}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg cursor-pointer transition-all duration-200 transform hover:-translate-y-1"
                      >
                        {/* Room Image */}
                        <div className="relative h-32 bg-gradient-to-br from-green-100 to-green-200">
                          {room.primary_room_image ? (
                            <img
                              src={`http://localhost:5000/uploads/rooms/${room.primary_room_image}`}
                              alt={`ห้อง ${room.room_number}`}
                              className="w-full h-full object-cover"
                            />
                          ) : room.room_type_thumbnail ? (
                            <img
                              src={`http://localhost:5000/uploads/room-types/${room.room_type_thumbnail}`}
                              alt={room.room_type_name}
                              className="w-full h-full object-cover opacity-80"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-gray-500">
                                <div className="text-3xl mb-1">{getStyleIcon(room.room_style)}</div>
                                <p className="text-xs">{room.room_number}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Available Badge */}
                          <div className="absolute top-2 right-2">
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ว่าง
                            </span>
                          </div>
                        </div>

                        {/* Room Info */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              ห้อง {room.room_number}
                            </h4>
                            <span className="text-green-600 text-sm">✅ ว่าง</span>
                          </div>
                          
                          {room.room_description && (
                            <p className="text-sm text-gray-600 mb-3">{room.room_description}</p>
                          )}

                          <div className="space-y-1 text-xs text-gray-600 mb-3">
                            <div>👥 {room.capacity} คน</div>
                            <div>💰 ฿{Number(room.price_per_month).toLocaleString()}/เดือน</div>
                            {room.air_condition && <div>❄️ แอร์</div>}
                            {room.fan && !room.air_condition && <div>🌀 พัดลม</div>}
                          </div>

                          <button className="w-full btn-primary text-sm">
                            ดูรายละเอียด
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {currentStep === 1 && roomTypes.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏠</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีห้องพัก</h3>
                <p className="text-gray-600">กรุณาติดต่อผู้ดูแลเพื่อเพิ่มห้องพัก</p>
              </div>
            )}
          </div>
        </div>
        
        <ToastContainer notifications={notifications} />
      </PageTransition>
  );
};

export default Dormitories;
