import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import {  LoadingButton, CardSkeleton } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const BillApproval = () => {
  const { notifications, showSuccess, showError } = useNotification();
  
  const [pendingBills, setPendingBills] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // pending, all, reports
  const [selectedBill, setSelectedBill] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // สำหรับรายงาน
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  const months = [
    { value: 1, label: 'มกราคม' }, { value: 2, label: 'กุมภาพันธ์' },
    { value: 3, label: 'มีนาคม' }, { value: 4, label: 'เมษายน' },
    { value: 5, label: 'พฤษภาคม' }, { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' }, { value: 8, label: 'สิงหาคม' },
    { value: 9, label: 'กันยายน' }, { value: 10, label: 'ตุลาคม' },
    { value: 11, label: 'พฤศจิกายน' }, { value: 12, label: 'ธันวาคม' }
  ];

  const statusLabels = {
    draft: { label: 'แบบร่าง', color: 'bg-gray-100 text-gray-800' },
    issued: { label: 'ออกบิลแล้ว', color: 'bg-yellow-100 text-yellow-800' },
    pending_approval: { label: 'รออนุมัติ', color: 'bg-blue-100 text-blue-800' },
    paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-800' },
    overdue: { label: 'เลยกำหนด', color: 'bg-red-100 text-red-800' },
    cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-800' }
  };

  const years = [];
  for (let year = new Date().getFullYear() - 2; year <= new Date().getFullYear(); year++) {
    years.push(year);
  }

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingBills();
    } else if (activeTab === 'all') {
      fetchAllBills();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchPendingBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bills/pending-approvals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingBills(response.data);
    } catch (error) {
      console.error('Failed to fetch pending bills:', error);
      showError('ไม่สามารถโหลดบิลรออนุมัติได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bills/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      });
      setAllBills(response.data.bills);
    } catch (error) {
      console.error('Failed to fetch all bills:', error);
      showError('ไม่สามารถโหลดรายการบิลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (billId) => {
    setProcessing(billId);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/bills/${billId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('อนุมัติการชำระสำเร็จ');
      fetchPendingBills();
      if (activeTab === 'all') fetchAllBills();

    } catch (error) {
      console.error('Failed to approve bill:', error);
      showError('ไม่สามารถอนุมัติการชำระได้');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBill || !rejectionReason.trim()) {
      showError('กรุณาระบุเหตุผลการปฏิเสธ');
      return;
    }

    setProcessing(selectedBill.bill_id);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/bills/${selectedBill.bill_id}/reject`, {
        rejection_reason: rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('ปฏิเสธการชำระสำเร็จ');
      setShowRejectModal(false);
      setSelectedBill(null);
      setRejectionReason('');
      fetchPendingBills();
      if (activeTab === 'all') fetchAllBills();

    } catch (error) {
      console.error('Failed to reject bill:', error);
      showError('ไม่สามารถปฏิเสธการชำระได้');
    } finally {
      setProcessing(null);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/bills/export-excel', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          month: reportMonth,
          year: reportYear
        },
        responseType: 'blob'
      });

      // สร้าง URL สำหรับดาวน์โหลด
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `รายงานบิล_${reportMonth}-${reportYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccess('ดาวน์โหลดรายงานสำเร็จ');

    } catch (error) {
      console.error('Failed to export Excel:', error);
      showError('ไม่สามารถออกรายงาน Excel ได้');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  const BillCard = ({ bill, showActions = true }) => (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                ห้อง {bill.room.room_number}
              </h3>
              <p className="text-sm text-gray-600">
                {bill.tenant.mem_name} • {bill.tenant.mem_tel}
              </p>
              <p className="text-sm text-gray-600">
                {months[bill.bill_month - 1].label} {bill.bill_year + 543}
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
            {bill.payment_slip_uploaded_at && (
              <div className="text-xs text-blue-600">
                อัปโหลดสลิป: {formatDate(bill.payment_slip_uploaded_at)}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-sm mb-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="font-medium text-blue-900">ค่าเช่า</div>
            <div className="text-lg font-bold text-blue-600">{formatCurrency(bill.room_rent)}</div>
          </div>
          <div className="text-center p-3 bg-cyan-50 rounded">
            <div className="font-medium text-cyan-900">ค่าน้ำ</div>
            <div className="text-lg font-bold text-cyan-600">{formatCurrency(bill.water_cost)}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="font-medium text-green-900">ค่าไฟ</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(bill.electricity_cost)}</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded">
            <div className="font-medium text-purple-900">อื่นๆ + ปรับ</div>
            <div className="text-lg font-bold text-purple-600">
              {formatCurrency(parseFloat(bill.other_charges) + parseFloat(bill.penalty_amount))}
            </div>
          </div>
        </div>

        {/* สลิปการชำระ */}
        {bill.payment_slip_url && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หลักฐานการโอนเงิน
            </label>
            <div className="max-w-xs">
              <img 
                src={`http://localhost:5000/uploads/payment-slips/${bill.payment_slip_url}`}
                alt="สลิปการชำระ"
                className="w-full rounded border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => window.open(`http://localhost:5000/uploads/payment-slips/${bill.payment_slip_url}`, '_blank')}
              />
            </div>
          </div>
        )}

        {showActions && bill.bill_status === 'pending_approval' && (
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setSelectedBill(bill);
                setShowRejectModal(true);
              }}
              disabled={processing === bill.bill_id}
              className="btn-secondary"
            >
              ❌ ปฏิเสธ
            </button>
            <LoadingButton
              loading={processing === bill.bill_id}
              onClick={() => handleApprove(bill.bill_id)}
              className="btn-primary"
            >
              ✅ อนุมัติ
            </LoadingButton>
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">ห้อง {bill.room.room_number}</h3>
            <p className="text-sm text-gray-600">{bill.tenant.mem_name}</p>
            <p className="text-xs text-gray-500">
              {months[bill.bill_month - 1].label} {bill.bill_year + 543}
            </p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            statusLabels[bill.bill_status]?.color || 'bg-gray-100 text-gray-800'
          }`}>
            {statusLabels[bill.bill_status]?.label || bill.bill_status}
          </span>
        </div>

        <div className="bg-gray-50 rounded p-3 mb-3">
          <div className="text-xl font-bold text-center text-gray-900 mb-2">
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

        {bill.payment_slip_url && (
          <div className="mb-3">
            <img 
              src={`http://localhost:5000/uploads/payment-slips/${bill.payment_slip_url}`}
              alt="สลิปการชำระ"
              className="w-full max-w-xs mx-auto rounded border border-gray-200 cursor-pointer"
              onClick={() => window.open(`http://localhost:5000/uploads/payment-slips/${bill.payment_slip_url}`, '_blank')}
            />
          </div>
        )}

        {showActions && bill.bill_status === 'pending_approval' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setSelectedBill(bill);
                setShowRejectModal(true);
              }}
              disabled={processing === bill.bill_id}
              className="btn-secondary text-sm"
            >
              ❌ ปฏิเสธ
            </button>
            <LoadingButton
              loading={processing === bill.bill_id}
              onClick={() => handleApprove(bill.bill_id)}
              className="btn-primary text-sm"
            >
              ✅ อนุมัติ
            </LoadingButton>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
          <div className="max-w-6xl mx-auto px-4">
            
            {/* หัวข้อ */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                ✅ อนุมัติการชำระเงิน
              </h1>
              <p className="text-gray-600">
                ตรวจสอบและอนุมัติการชำระเงินจากนักศึกษา
              </p>
            </div>

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
                รออนุมัติ ({pendingBills.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'all' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'reports' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                รายงาน
              </button>
            </div>

            {/* เนื้อหาตามแท็บ */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <CardSkeleton key={i} rows={4} />
                ))}
              </div>
            ) : activeTab === 'reports' ? (
              /* แท็บรายงาน */
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📊 ออกรายงาน Excel
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">เดือน</label>
                    <select
                      value={reportMonth}
                      onChange={(e) => setReportMonth(parseInt(e.target.value))}
                      className="input-field"
                    >
                      {months.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ปี</label>
                    <select
                      value={reportYear}
                      onChange={(e) => setReportYear(parseInt(e.target.value))}
                      className="input-field"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year + 543}
                        </option>
                      ))}
                    </select>
                  </div>
                  <LoadingButton
                    loading={exporting}
                    onClick={exportToExcel}
                    className="btn-primary"
                  >
                    📥 ดาวน์โหลด Excel
                  </LoadingButton>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm text-blue-700">
                    รายงานจะรวมข้อมูล: ห้อง, ผู้เช่า, การจดมิเตอร์, ค่าใช้จ่าย, และสถานะการชำระ
                  </div>
                </div>
              </div>
            ) : (
              /* แท็บบิล */
              <div className="space-y-4">
                {(activeTab === 'pending' ? pendingBills : allBills).length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="text-gray-400 text-6xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeTab === 'pending' ? 'ไม่มีบิลรออนุมัติ' : 'ไม่พบรายการบิล'}
                    </h3>
                    <p className="text-gray-600">
                      {activeTab === 'pending' 
                        ? 'ไม่มีบิลที่รอการอนุมัติในขณะนี้' 
                        : 'ยังไม่มีข้อมูลบิลในระบบ'}
                    </p>
                  </div>
                ) : (
                  (activeTab === 'pending' ? pendingBills : allBills).map((bill) => (
                    <BillCard 
                      key={bill.bill_id} 
                      bill={bill} 
                      showActions={activeTab === 'pending'} 
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal ปฏิเสธ */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ❌ ปฏิเสธการชำระ
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เหตุผลการปฏิเสธ
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input-field w-full h-24 resize-none"
                  placeholder="ระบุเหตุผลที่ปฏิเสธการชำระ เช่น สลิปไม่ชัดเจน จำนวนเงินไม่ตรง..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedBill(null);
                    setRejectionReason('');
                  }}
                  className="btn-secondary flex-1"
                >
                  ยกเลิก
                </button>
                <LoadingButton
                  loading={processing === selectedBill?.bill_id}
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  ยืนยันปฏิเสธ
                </LoadingButton>
              </div>
            </div>
          </div>
        )}

        <ToastContainer notifications={notifications} />
      </PageTransition>
    </div>
  );
};

export default BillApproval;
