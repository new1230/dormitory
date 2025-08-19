import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { LoadingButton } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const BookingContract = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, showSuccess, showError, showWarning } = useNotification();

  const [loading, setLoading] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);

  // รับข้อมูลจาก navigation state
  const { roomId, roomData, bookingData } = location.state || {};

  useEffect(() => {
    // ตรวจสอบว่ามีข้อมูลครบหรือไม่
    if (!roomId || !roomData || !bookingData || !user) {
      showError('ข้อมูลการจองไม่ครบถ้วน');
      navigate('/dormitories');
    }
  }, [roomId, roomData, bookingData, user, navigate, showError]);

  // คำนวณราคารวม
  const calculateTotalPrice = () => {
    if (!bookingData || !roomData) return 0;
    
    const checkInDate = new Date(bookingData.check_in_date);
    const checkOutDate = new Date(bookingData.check_out_date);
    const monthsDiff = (checkOutDate.getFullYear() - checkInDate.getFullYear()) * 12 + 
                      (checkOutDate.getMonth() - checkInDate.getMonth());
    
    return monthsDiff * (roomData.roomType?.price_per_month || 0);
  };

  const handleAcceptContract = async () => {
    if (!contractAccepted) {
      showWarning('กรุณายอมรับข้อตกลงก่อนดำเนินการต่อ');
      return;
    }

    setLoading(true);
    try {
      // สร้างการจองในระบบ
      const response = await axios.post('http://localhost:5000/api/bookings', {
        room_id: roomId,
        check_in_date: bookingData.check_in_date,
        check_out_date: bookingData.check_out_date,
        remarks: bookingData.remarks,
        contract_accepted: true,
        total_price: calculateTotalPrice()
      });

      showSuccess('ยอมรับสัญญาสำเร็จ');
      
      // นำทางไปยังหน้ารายละเอียดการจอง
      navigate('/booking-details', {
        state: {
          bookingId: response.data.id,
          roomData: roomData,
          bookingData: {
            ...bookingData,
            total_price: calculateTotalPrice()
          }
        }
      });
    } catch (error) {
      console.error('Contract acceptance error:', error);
      showError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างการจอง');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectContract = () => {
    navigate('/room-detail/' + roomId);
  };

  if (!roomData || !bookingData) {
    return (
      <div>
        <Navbar />
        <PageTransition>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">ข้อมูลไม่ครบถ้วน</h3>
            <button onClick={() => navigate('/dormitories')} className="mt-4 btn-primary">
              กลับหน้าหลัก
            </button>
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
          <div className="max-w-4xl mx-auto px-4">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 สัญญาการจองห้องพัก</h1>
              <p className="text-gray-600">กรุณาอ่านข้อตกลงให้ครบถ้วนก่อนยินยอม</p>
            </div>

            {/* สรุปการจอง */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="font-bold text-gray-900 mb-4">📝 สรุปการจอง</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ห้อง</p>
                  <p className="font-medium">ห้อง {roomData.room_number} ({roomData.roomType?.room_type_name})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ผู้จอง</p>
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">วันที่เข้าพัก</p>
                  <p className="font-medium">{new Date(bookingData.check_in_date).toLocaleDateString('th-TH')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">วันที่ออก</p>
                  <p className="font-medium">{new Date(bookingData.check_out_date).toLocaleDateString('th-TH')}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">ราคารวม</p>
                  <p className="text-2xl font-bold text-green-600">฿{calculateTotalPrice().toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* PDF Contract */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="font-bold text-gray-900 mb-4">📄 สัญญาการจองห้องพัก</h3>
              
              {/* Contract Content */}
              <div className="border p-6 rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">สัญญาการจองห้องพักนักศึกษา</h2>
                  <p className="text-sm text-gray-600 mt-2">มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี</p>
                </div>

                <div className="space-y-4 text-sm text-gray-800">
                  <div>
                    <strong>ข้อตกลงการจองห้องพัก</strong>
                  </div>
                  
                  <p>
                    สัญญาฉบับนี้ทำขึ้นระหว่าง นาย/นาง/นางสาว <strong>{user?.firstName} {user?.lastName}</strong> 
                    (ผู้เช่า) กับ มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี (ผู้ให้เช่า)
                  </p>

                  <div>
                    <strong>ข้อ 1. ข้อมูลห้องพัก</strong>
                    <ul className="list-disc list-inside ml-4 mt-2">
                      <li>หมายเลขห้อง: <strong>ห้อง {roomData.room_number}</strong></li>
                      <li>ประเภทห้อง: <strong>{roomData.roomType?.room_type_name}</strong></li>
                      <li>จำนวนผู้พัก: <strong>{roomData.roomType?.capacity} คน</strong></li>
                      <li>ค่าเช่า: <strong>฿{Number(roomData.roomType?.price_per_month || 0).toLocaleString()} / เดือน</strong></li>
                    </ul>
                  </div>

                  <div>
                    <strong>ข้อ 2. ระยะเวลาการเช่า</strong>
                    <ul className="list-disc list-inside ml-4 mt-2">
                      <li>วันที่เริ่มเช่า: <strong>{new Date(bookingData.check_in_date).toLocaleDateString('th-TH')}</strong></li>
                      <li>วันที่สิ้นสุด: <strong>{new Date(bookingData.check_out_date).toLocaleDateString('th-TH')}</strong></li>
                      <li>ระยะเวลารวม: <strong>{Math.ceil((new Date(bookingData.check_out_date) - new Date(bookingData.check_in_date)) / (1000 * 60 * 60 * 24 * 30))} เดือน</strong></li>
                    </ul>
                  </div>

                  <div>
                    <strong>ข้อ 3. เงื่อนไขการชำระเงิน</strong>
                    <ul className="list-disc list-inside ml-4 mt-2">
                      <li>ผู้เช่าต้องชำระเงินมัดจำและค่าเช่าล่วงหน้า <strong>ภายใน 60 นาทีหลังจากยอมรับสัญญา</strong></li>
                      <li>หากไม่ชำระเงินภายในเวลาที่กำหนด การจองจะถูกยกเลิกโดยอัตโนมัติ</li>
                      <li>ค่าน้ำ-ไฟ: น้ำ ฿{roomData.roomType?.water_rate}/หน่วย, ไฟ ฿{roomData.roomType?.electricity_rate}/หน่วย</li>
                      <li>วันครบกำหนดชำระ: วันที่ {roomData.roomType?.payment_due_day} ของทุกเดือน</li>
                    </ul>
                  </div>

                  <div>
                    <strong>ข้อ 4. ข้อปฏิบัติ</strong>
                    <ul className="list-disc list-inside ml-4 mt-2">
                      <li>ไม่ก่อกวนผู้อื่น รักษาความสะอาด</li>
                      <li>ไม่นำบุคคลภายนอกเข้าพักโดยไม่ได้รับอนุญาต</li>
                      <li>ไม่สูบบุหรี่ ดื่มสุรา หรือเล่นการพนันในบริเวณหอพัก</li>
                      <li>รักษาทรัพย์สินของหอพัก หากเสียหายต้องชดใช้</li>
                      <li>ปฏิบัติตามระเบียบของหอพักและมหาวิทยาลัย</li>
                    </ul>
                  </div>

                  <div>
                    <strong>ข้อ 5. การยกเลิกสัญญา</strong>
                    <ul className="list-disc list-inside ml-4 mt-2">
                      <li>แจ้งล่วงหน้า 30 วัน กรณีต้องการย้ายออกก่อนครบกำหนด</li>
                      <li>หากผิดข้อปฏิบัติ มหาวิทยาลัยสามารถยกเลิกสัญญาได้ทันทีโดยไม่คืนเงิน</li>
                    </ul>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 font-medium">
                      ⚠️ หลังจากยอมรับสัญญา คุณจะมีเวลา 60 นาที เพื่อชำระเงิน หากไม่ชำระภายในเวลาที่กำหนด การจองจะถูกยกเลิกอัตโนมัติ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox ยอมรับสัญญา */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="acceptContract"
                  checked={contractAccepted}
                  onChange={(e) => setContractAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="acceptContract" className="text-sm text-gray-700">
                  ข้าพเจ้าได้อ่านและเข้าใจข้อตกลงทั้งหมดแล้ว และยอมรับเงื่อนไขการจองห้องพักดังกล่าวข้างต้น 
                  <span className="text-red-500 font-medium"> รวมถึงการชำระเงินภายใน 60 นาที</span>
                </label>
              </div>
            </div>

            {/* ปุ่มดำเนินการ */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRejectContract}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
              >
                ← กลับไปแก้ไขข้อมูล
              </button>
              
              <LoadingButton
                onClick={handleAcceptContract}
                loading={loading}
                disabled={!contractAccepted}
                className={`flex-1 py-3 px-6 rounded-lg transition-colors ${
                  contractAccepted && !loading
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                ✅ ยอมรับสัญญาและดำเนินการต่อ
              </LoadingButton>
            </div>

            {/* คำแนะนำ */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 ข้อมูลสำคัญ</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• หลังยอมรับสัญญา คุณจะมีเวลา 60 นาที ในการชำระเงิน</li>
                <li>• กรุณาเตรียมหลักฐานการโอนเงิน (สลิป) สำหรับอัพโหลด</li>
                <li>• การจองจะสมบูรณ์เมื่อผู้จัดการยืนยันการรับเงิน</li>
                <li>• หากไม่ชำระภายในเวลาที่กำหนด การจองจะถูกยกเลิกโดยอัตโนมัติ</li>
              </ul>
            </div>
          </div>
        </div>
      </PageTransition>
      
      <ToastContainer notifications={notifications} />
    </div>
  );
};

export default BookingContract;
