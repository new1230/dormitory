import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { CardSkeleton } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const StudentBills = () => {
  const { notifications, showError } = useNotification();
  
  const [allBills, setAllBills] = useState([]); // เก็บบิลทั้งหมด
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, all
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0
  });

  const statusLabels = {
    draft: { label: 'แบบร่าง', color: 'bg-gray-100 text-gray-800' },
    issued: { label: 'ออกบิลแล้ว', color: 'bg-yellow-100 text-yellow-800' },
    pending_approval: { label: 'รออนุมัติ', color: 'bg-blue-100 text-blue-800' },
    paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-800' },
    overdue: { label: 'เลยกำหนด', color: 'bg-red-100 text-red-800' },
    cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-800' }
  };

  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  useEffect(() => {
    fetchBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.offset]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`http://localhost:5000/api/bills/my-bills`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 50, // เอาทั้งหมดมาก่อน
          offset: 0   // เอาทั้งหมด
        }
      });

      // เก็บข้อมูลทั้งหมด
      setAllBills(response.data.bills);
      setPagination(prev => ({
        ...prev,
        total: response.data.total
      }));

    } catch (error) {
      console.error('Failed to fetch bills:', error);
      showError('ไม่สามารถโหลดข้อมูลบิลได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handlePayment = (billId) => {
    // นำไปหน้าชำระเงิน
    window.location.href = `/payment/${billId}`;
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  // คำนวณบิลค้างชำระจากข้อมูลทั้งหมด
  const pendingBills = allBills.filter(bill => 
    ['issued', 'pending_approval', 'overdue'].includes(bill.bill_status)
  );

  const totalPendingAmount = pendingBills.reduce((sum, bill) => sum + bill.total_amount, 0);

  // กรองบิลสำหรับแสดงผลตาม activeTab
  const displayBills = activeTab === 'pending' ? pendingBills : allBills;

  if (loading) {
    return (
      <div>
        <Navbar />
        <PageTransition>
          <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-6xl mx-auto px-4">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <CardSkeleton key={i} rows={4} />
                ))}
              </div>
            </div>
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
            
            {/* หัวข้อ */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                🧾 บิลค่าใช้จ่าย
              </h1>
              <p className="text-gray-600">
                ดูบิลค้างชำระและประวัติการชำระเงิน
              </p>
            </div>

            {/* สรุปบิลค้างชำระ */}
            {pendingBills.length > 0 && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 sm:p-6 mb-6 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold mb-1">
                      ⚠️ มีบิลค้างชำระ
                    </h2>
                    <p className="text-red-100 text-sm">
                      คุณมีบิลที่ยังไม่ได้ชำระ {pendingBills.length} บิล
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0 text-right">
                    <div className="text-2xl sm:text-3xl font-bold">
                      {formatCurrency(totalPendingAmount)}
                    </div>
                    <div className="text-red-100 text-sm">ยอดค้างชำระทั้งหมด</div>
                  </div>
                </div>
              </div>
            )}

            {/* แท็บ */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'pending' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                บิลค้างชำระ ({pendingBills.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'all' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ประวัติทั้งหมด ({allBills.length})
              </button>
            </div>

            {/* รายการบิล */}
            <div className="space-y-4">
              {displayBills.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="text-gray-400 text-6xl mb-4">📄</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'pending' ? 'ไม่มีบิลค้างชำระ' : 'ไม่พบประวัติบิล'}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'pending' 
                      ? 'คุณไม่มีบิลที่ต้องชำระในขณะนี้' 
                      : 'ยังไม่มีข้อมูลบิลในระบบ'}
                  </p>
                </div>
              ) : (
                displayBills.map((bill) => (
                  <div key={bill.bill_id} 
                       className={`bg-white rounded-lg shadow-md overflow-hidden ${
                         isOverdue(bill.due_date) ? 'border-l-4 border-red-500' : ''
                       }`}>
                    
                    {/* Desktop View */}
                    <div className="hidden lg:block">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                ห้อง {bill.room.room_number}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {bill.room.roomType.room_type_name} • {months[bill.bill_month - 1]} {bill.bill_year + 543}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              statusLabels[bill.bill_status]?.color || 'bg-gray-100 text-gray-800'
                            }`}>
                              {statusLabels[bill.bill_status]?.label || bill.bill_status}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatCurrency(bill.total_amount)}
                            </div>
                            <div className="text-sm text-gray-600">
                              ครบกำหนด: {formatDate(bill.due_date)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <div className="font-medium text-blue-900">ค่าเช่าห้อง</div>
                            <div className="text-lg font-bold text-blue-600">
                              {formatCurrency(bill.room_rent)}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-cyan-50 rounded">
                            <div className="font-medium text-cyan-900">ค่าน้ำ</div>
                            <div className="text-lg font-bold text-cyan-600">
                              {formatCurrency(bill.water_cost)}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded">
                            <div className="font-medium text-green-900">ค่าไฟ</div>
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(bill.electricity_cost)}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded">
                            <div className="font-medium text-purple-900">อื่นๆ + ค่าปรับ</div>
                            <div className="text-lg font-bold text-purple-600">
                              {formatCurrency(parseFloat(bill.other_charges) + parseFloat(bill.penalty_amount))}
                            </div>
                          </div>
                        </div>

                        {/* ข้อมูลเพิ่มเติม */}
                        {(bill.other_charges_reason || bill.penalty_amount > 0) && (
                          <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                            {bill.other_charges_reason && (
                              <div className="mb-2">
                                <strong>ค่าใช้จ่ายอื่น:</strong> {bill.other_charges_reason}
                              </div>
                            )}
                            {bill.penalty_amount > 0 && (
                              <div className="text-red-600">
                                <strong>ค่าปรับ:</strong> เลยกำหนดชำระ {bill.penalty_days} วัน 
                                = {formatCurrency(bill.penalty_amount)}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ปุ่มจัดการ */}
                        <div className="mt-4 flex justify-end space-x-3">
                          {bill.bill_status === 'issued' && (
                            <button
                              onClick={() => handlePayment(bill.bill_id)}
                              className="btn-primary"
                            >
                              💳 ชำระเงิน
                            </button>
                          )}
                          {bill.bill_status === 'pending_approval' && (
                            <div className="text-blue-600 font-medium">
                              รอการอนุมัติการชำระ
                            </div>
                          )}
                          {bill.bill_status === 'paid' && (
                            <div className="text-green-600 font-medium">
                              ชำระเสร็จสิ้น ({formatDate(bill.paid_date)})
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="block lg:hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              ห้อง {bill.room.room_number}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {months[bill.bill_month - 1]} {bill.bill_year + 543}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            statusLabels[bill.bill_status]?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            {statusLabels[bill.bill_status]?.label || bill.bill_status}
                          </span>
                        </div>

                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <div className="text-2xl font-bold text-center text-gray-900 mb-2">
                            {formatCurrency(bill.total_amount)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-gray-600">ค่าเช่า</div>
                              <div className="font-medium">{formatCurrency(bill.room_rent)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-600">ค่าน้ำ</div>
                              <div className="font-medium">{formatCurrency(bill.water_cost)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-600">ค่าไฟ</div>
                              <div className="font-medium">{formatCurrency(bill.electricity_cost)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-600">อื่นๆ/ปรับ</div>
                              <div className="font-medium">
                                {formatCurrency(parseFloat(bill.other_charges) + parseFloat(bill.penalty_amount))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                          <div>ครบกำหนด: {formatDate(bill.due_date)}</div>
                          {isOverdue(bill.due_date) && bill.bill_status !== 'paid' && (
                            <div className="text-red-600 font-medium">
                              เลยกำหนด {bill.penalty_days} วัน
                            </div>
                          )}
                        </div>

                        {/* ปุ่มจัดการ Mobile */}
                        <div className="space-y-2">
                          {bill.bill_status === 'issued' && (
                            <button
                              onClick={() => handlePayment(bill.bill_id)}
                              className="btn-primary w-full text-sm"
                            >
                              💳 ชำระเงิน
                            </button>
                          )}
                          {bill.bill_status === 'pending_approval' && (
                            <div className="text-center text-blue-600 font-medium text-sm py-2">
                              รอการอนุมัติการชำระ
                            </div>
                          )}
                          {bill.bill_status === 'paid' && (
                            <div className="text-center text-green-600 font-medium text-sm py-2">
                              ชำระเสร็จสิ้น ({formatDate(bill.paid_date)})
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="mt-6 flex justify-center items-center space-x-4">
                <button
                  onClick={() => setPagination(prev => ({ 
                    ...prev, 
                    offset: Math.max(0, prev.offset - prev.limit) 
                  }))}
                  disabled={pagination.offset === 0}
                  className="btn-secondary disabled:opacity-50"
                >
                  ก่อนหน้า
                </button>
                <span className="text-sm text-gray-600">
                  {Math.floor(pagination.offset / pagination.limit) + 1} / {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ 
                    ...prev, 
                    offset: prev.offset + prev.limit 
                  }))}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  className="btn-secondary disabled:opacity-50"
                >
                  ถัดไป
                </button>
              </div>
            )}

            {/* คำแนะนำ */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 ข้อมูลการชำระเงิน</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ค่าปรับชำระล่าช้า 10 บาทต่อวัน</li>
                <li>• สามารถชำระผ่านการอัปโหลดสลิปการโอนเงิน</li>
                <li>• สลิปจะต้องผ่านการอนุมัติจากผู้จัดการหอพัก</li>
                <li>• หากสลิปไม่ถูกต้อง จะต้องอัปโหลดใหม่</li>
              </ul>
            </div>
          </div>
        </div>

        <ToastContainer notifications={notifications} />
      </PageTransition>
    </div>
  );
};

export default StudentBills;
