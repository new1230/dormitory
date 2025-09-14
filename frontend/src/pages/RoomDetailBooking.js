import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { LoadingSpinner } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const RoomDetailBooking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, showError, showWarning } = useNotification();

  const [room, setRoom] = useState(null);
  const [roomImages, setRoomImages] = useState([]);
  const [roomTypeImages, setRoomTypeImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [bookingForm, setBookingForm] = useState({
    check_in_date: '',
    check_out_date: '',
    remarks: ''
  });

  useEffect(() => {
    if (roomId) {
      fetchRoomDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const fetchRoomDetail = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลห้อง
      const roomResponse = await axios.get(`http://localhost:5000/api/rooms/${roomId}`);
      setRoom(roomResponse.data);

      // ดึงรูปห้อง
      const roomImagesResponse = await axios.get(`http://localhost:5000/api/rooms/${roomId}/images`);
      setRoomImages(roomImagesResponse.data);

      // ดึงรูปประเภทห้อง
      if (roomResponse.data.room_type_id) {
        const typeImagesResponse = await axios.get(`http://localhost:5000/api/room-types/${roomResponse.data.room_type_id}/images`);
        setRoomTypeImages(typeImagesResponse.data);
      }

    } catch (error) {
      console.error('Failed to fetch room detail:', error);
      showError('ไม่สามารถโหลดข้อมูลห้องได้');
      navigate('/dormitories');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showWarning('กรุณาเข้าสู่ระบบก่อนทำการจอง');
      navigate('/login');
      return;
    }

    if (!bookingForm.check_in_date || !bookingForm.check_out_date) {
      showWarning('กรุณาเลือกวันที่เข้าพักและออก');
      return;
    }

    if (new Date(bookingForm.check_in_date) >= new Date(bookingForm.check_out_date)) {
      showWarning('วันที่ออกต้องหลังจากวันที่เข้าพัก');
      return;
    }

    // ตรวจสอบระยะเวลาขั้นต่ำ 3 เดือน
    const checkInDate = new Date(bookingForm.check_in_date);
    const checkOutDate = new Date(bookingForm.check_out_date);
    const monthsDiff = (checkOutDate.getFullYear() - checkInDate.getFullYear()) * 12 + 
                      (checkOutDate.getMonth() - checkInDate.getMonth());
    
    if (monthsDiff < 3) {
      showWarning('ระยะเวลาจองห้องขั้นต่ำ 3 เดือน');
      return;
    }

    // นำพาไปยังหน้าสัญญาการจอง
    navigate('/booking-contract', {
      state: {
        roomId: roomId,
        roomData: room,
        bookingData: {
          check_in_date: bookingForm.check_in_date,
          check_out_date: bookingForm.check_out_date,
          remarks: bookingForm.remarks
        }
      }
    });
  };

  const getFacilityIcon = (facility, value) => {
    if (!value) return null;
    
    const icons = {
      wifi: '📶',
      hot_water: '🚿',
      refrigerator: '❄️',
      tv: '📺',
      desk: '📝',
      chair: '🪑',
      bed: '🛏️',
      closet: '👔',
      balcony: '🏞️',
      private_bathroom: '🚿'
    };
    
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

    return `${icons[facility]} ${labels[facility]}`;
  };

  // รวมรูปทั้งหมด
  const allImages = [
    ...roomImages.map(img => ({ ...img, type: 'room', url: `http://localhost:5000${img.imageUrl}` })),
    ...roomTypeImages.map(img => ({ ...img, type: 'roomType', url: `http://localhost:5000${img.imageUrl}` }))
  ];

  if (loading) {
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

  if (!room) {
    return (
      <div>
        <Navbar />
        <PageTransition>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">ไม่พบห้องนี้</h3>
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
          <div className="max-w-6xl mx-auto px-4">
            
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <button onClick={() => navigate('/dormitories')} className="hover:text-blue-600">
                🏠 หอพัก
              </button>
              <span className="mx-2">›</span>
              <span className="text-blue-600">{room.roomType?.room_type_name}</span>
              <span className="mx-2">›</span>
              <span className="text-blue-600 font-medium">ห้อง {room.room_number}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* รูปภาพ */}
              <div className="space-y-4">
                {allImages.length > 0 ? (
                  <>
                    {/* รูปหลัก */}
                    <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={allImages[currentImageIndex]?.url}
                        alt={`ห้อง ${room.room_number}`}
                        className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                        key={currentImageIndex}
                      />
                      
                      {/* Navigation */}
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200 hover:scale-110"
                          >
                            ‹
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200 hover:scale-110"
                          >
                            ›
                          </button>
                        </>
                      )}
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </div>

                    {/* Thumbnail Gallery */}
                    {allImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {allImages.map((image, index) => (
                          <img
                            key={index}
                            src={image.url}
                            alt={`รูป ${index + 1}`}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-20 h-20 object-cover rounded cursor-pointer flex-shrink-0 transition-all duration-300 ${
                              index === currentImageIndex ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100 hover:scale-105'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">🏠</div>
                      <p>ไม่มีรูปภาพ</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ข้อมูลห้อง */}
              <div className="space-y-6">
                
                {/* หัวข้อ */}
                <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ห้อง {room.room_number}
                </h1>
                <p className="text-xl text-gray-600">{room.roomType?.room_type_name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                room.status === '1' ? 'bg-green-100 text-green-800' :
                  room.status === '0' ? 'bg-red-100 text-red-800' :
                  room.status === '2' ? 'bg-yellow-100 text-yellow-800' :
                room.status === '3' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {room.status === '1' ? '✅ ห้องว่าง' :
                       room.status === '0' ? '❌ มีผู้พัก' :
                       room.status === '2' ? '🔧 ปิดซ่อม' :
                       room.status === '3' ? '📋 จองแล้ว' : '❓ ไม่ทราบสถานะ'}
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      👥 {room.roomType?.capacity} คน
                    </span>
                    {room.roomType?.room_size && (
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                        📐 {room.roomType.room_size} ตร.ม.
                      </span>
                    )}
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      🏷️ {room.roomType?.room_category === 'standard' ? 'มาตรฐาน' :
                           room.roomType?.room_category === 'deluxe' ? 'ดีลักซ์' :
                           room.roomType?.room_category === 'suite' ? 'สวีท' :
                           room.roomType?.room_category === 'hostel' ? 'โฮสเทล' : room.roomType?.room_category}
                    </span>
                  </div>
                </div>

                {/* รายละเอียด */}
                {room.description && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">📝 รายละเอียดห้อง</h3>
                    <p className="text-gray-700">{room.description}</p>
                  </div>
                )}

                {/* ราคา */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="font-bold text-gray-900 mb-4">💰 ข้อมูลราคา</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        ฿{Number(room.roomType?.price_per_month || 0).toLocaleString()}
                      </span>
                      <span className="text-gray-500 ml-2">/เดือน</span>
                    </div>
                    {room.roomType?.price_per_semester && (
                      <div>
                        <span className="text-xl font-semibold text-blue-600">
                          ฿{Number(room.roomType.price_per_semester).toLocaleString()}
                        </span>
                        <span className="text-gray-500 ml-2">/เทอม</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t text-sm">
                    <div>ค่าน้ำ: <span className="font-medium">฿{Number(room.roomType?.water_rate || 0).toFixed(1)}/หน่วย</span></div>
                    <div>ค่าไฟ: <span className="font-medium">฿{Number(room.roomType?.electricity_rate || 0).toFixed(1)}/หน่วย</span></div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    📅 ชำระค่าเช่าทุกวันที่ {room.roomType?.payment_due_day} ของเดือน
                  </div>
                </div>

                {/* ข้อมูลทั่วไป */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="font-bold text-gray-900 mb-4">🏠 ข้อมูลทั่วไป</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">ประเภทห้อง:</span>
                      <div className="font-medium">{room.roomType?.room_style === 'single' ? 'ห้องเดี่ยว' :
                                                      room.roomType?.room_style === 'double' ? 'ห้องคู่' :
                                                      room.roomType?.room_style === 'triple' ? 'ห้อง 3 คน' :
                                                      room.roomType?.room_style === 'quadruple' ? 'ห้อง 4 คน' :
                                                      room.roomType?.room_style === 'dormitory' ? 'ห้องรวม' : room.roomType?.room_style}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">เพศที่อนุญาต:</span>
                      <div className="font-medium">{room.roomType?.gender_allowed === 'male' ? 'ชายเท่านั้น' :
                                                      room.roomType?.gender_allowed === 'female' ? 'หญิงเท่านั้น' :
                                                      room.roomType?.gender_allowed === 'mixed' ? 'ชาย-หญิง' : room.roomType?.gender_allowed}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">เฟอร์นิเจอร์:</span>
                      <div className="font-medium">{room.roomType?.furnished === 'fully' ? 'ครบครัน' :
                                                     room.roomType?.furnished === 'partial' ? 'พื้นฐาน' :
                                                     room.roomType?.furnished === 'unfurnished' ? 'ห้องเปล่า' : room.roomType?.furnished}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">ห้องเลขที่:</span>
                      <div className="font-medium text-blue-600">{room.room_number}</div>
                    </div>
                  </div>
                </div>

                {/* สิ่งอำนวยความสะดวก */}
               

                {/* ฟอร์มจอง */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="font-bold text-gray-900 mb-4">📅 จองห้องนี้</h3>
                  
                  {room.status !== '1' ? (
                    <div className="text-center py-6">
                      <div className="text-red-500 text-5xl mb-4">⚠️</div>
                      <p className="text-red-600 font-medium mb-2">ห้องนี้ไม่ว่างในขณะนี้</p>
                      <p className="text-gray-600 text-sm">
                        {room.status === '0' ? 'ห้องนี้มีผู้พักอยู่แล้ว' :
                         room.status === '2' ? 'ห้องนี้ปิดซ่อมแซม' :
                         room.status === '3' ? 'ห้องนี้มีการจองแล้ว' : 'ไม่สามารถจองห้องนี้ได้'}
                      </p>
                      <button
                        onClick={() => navigate('/dormitories')}
                        className="mt-4 btn-primary"
                      >
                        ดูห้องอื่น
                      </button>
                    </div>
                  ) : user ? (
                    <div>
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          💡 <strong>หมายเหตุ:</strong> การจองต้องมีระยะเวลาขั้นต่ำ 3 เดือน
                        </p>
                      </div>
                      <form onSubmit={handleBooking} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            วันที่เข้าพัก *
                          </label>
                          <input
                            type="date"
                            value={bookingForm.check_in_date}
                            onChange={(e) => setBookingForm(prev => ({...prev, check_in_date: e.target.value}))}
                            min={new Date().toISOString().split('T')[0]}
                            className="input-field"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            วันที่ออก *
                          </label>
                          <input
                            type="date"
                            value={bookingForm.check_out_date}
                            onChange={(e) => setBookingForm(prev => ({...prev, check_out_date: e.target.value}))}
                            min={bookingForm.check_in_date || new Date().toISOString().split('T')[0]}
                            className="input-field"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          หมายเหตุ
                        </label>
                        <textarea
                          value={bookingForm.remarks}
                          onChange={(e) => setBookingForm(prev => ({...prev, remarks: e.target.value}))}
                          rows="3"
                          className="input-field"
                          placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full btn-primary text-lg py-3"
                      >
                        🏠 จองห้องนี้
                      </button>
                      </form>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-600 mb-4">กรุณาเข้าสู่ระบบเพื่อจองห้อง</p>
                      <button
                        onClick={() => navigate('/login')}
                        className="btn-primary"
                      >
                        เข้าสู่ระบบ
                      </button>
                    </div>
                  )}
                </div>

                {/* ปุ่มกลับ */}
                <button
                  onClick={() => navigate('/dormitories')}
                  className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← กลับไปเลือกห้องอื่น
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
      
      <ToastContainer notifications={notifications} />
    </div>
  );
};

export default RoomDetailBooking;
