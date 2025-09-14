import React, { useState } from 'react';

import axios from 'axios';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { LoadingSpinner } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import * as XLSX from 'xlsx';
import {
  FaFileExcel,
  FaCalendarAlt,
  FaUsers,
  FaHome,
  FaFileInvoiceDollar,
  FaTachometerAlt,
  FaHistory,
  FaDownload,
  FaEye
} from 'react-icons/fa';

const Reports = () => {

  const { notifications, showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: ''
  });

  const reportTypes = [
    {
      id: 'monthly-revenue',
      name: 'รายงานรายรับรายเดือน',
      description: 'รายรับจากบิลและการจอง',
      icon: FaFileInvoiceDollar,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'overdue-bills',
      name: 'รายงานบิลค้างชำระ',
      description: 'รายการห้องที่ค้างชำระ',
      icon: FaFileInvoiceDollar,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 'room-status',
      name: 'รายงานสถานะห้องพัก',
      description: 'สถานะห้องทั้งหมดและผู้เช่า',
      icon: FaHome,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'members',
      name: 'รายงานสมาชิก',
      description: 'รายชื่อสมาชิกและข้อมูล',
      icon: FaUsers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'bookings',
      name: 'รายงานการจอง',
      description: 'ประวัติการจองทั้งหมด',
      icon: FaCalendarAlt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'meter-readings',
      name: 'รายงานการจดมิเตอร์',
      description: 'ข้อมูลการจดมิเตอร์น้ำและไฟ',
      icon: FaTachometerAlt,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: 'login-history',
      name: 'รายงานประวัติการเข้าสู่ระบบ',
      description: 'ประวัติการ login (Admin เท่านั้น)',
      icon: FaHistory,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      adminOnly: true
    }
  ];

  const fetchReportData = async (reportType) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:5000/api/reports/${reportType}`;
      let params = {};

      // เพิ่ม parameters ตาม report type
      if (reportType === 'monthly-revenue' || reportType === 'bookings' || reportType === 'login-history') {
        if (filters.startDate && filters.endDate) {
          params.startDate = filters.startDate;
          params.endDate = filters.endDate;
        }
      }
      
      if (reportType === 'bookings' && filters.status) {
        params.status = filters.status;
      }

      if (reportType === 'meter-readings') {
        params.month = filters.month;
        params.year = filters.year;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setReportData(response.data);
      showSuccess('โหลดข้อมูลรายงานสำเร็จ');
    } catch (error) {
      console.error('Error fetching report:', error);
      showError('ไม่สามารถโหลดข้อมูลรายงานได้');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (data, filename) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงาน');
      
      // ปรับความกว้างคอลัมน์
      const colWidths = [];
      const headers = Object.keys(data[0] || {});
      headers.forEach(() => colWidths.push({ wch: 20 }));
      worksheet['!cols'] = colWidths;

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      
      XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
      showSuccess('ไฟล์ Excel ถูกดาวน์โหลดเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Export error:', error);
      showError('เกิดข้อผิดพลาดในการส่งออกไฟล์');
    }
  };

  const handleExportReport = (reportType) => {
    if (!reportData || reportData.length === 0) {
      showError('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    let filename = 'รายงาน';
    let processedData = reportData;

    switch (reportType) {
      case 'monthly-revenue':
        filename = 'รายงานรายรับรายเดือน';
        // รวมข้อมูล bills และ bookings
        processedData = [
          ...reportData.billRevenue.map(item => ({
            ประเภท: 'บิลรายเดือน',
            เดือน: item.bill_month,
            ปี: item.bill_year,
            จำนวนรายการ: item.bill_count,
            ค่าเช่าห้อง: item.room_rent_total,
            ค่าน้ำ: item.water_cost_total,
            ค่าไฟ: item.electricity_cost_total,
            อื่นๆ: item.other_charges_total,
            รวม: item.bills_total
          })),
          ...reportData.bookingRevenue.map(item => ({
            ประเภท: 'การจอง',
            เดือน: item.approval_month,
            ปี: item.approval_year,
            จำนวนรายการ: item.booking_count,
            เงินมัดจำ: item.deposit_total,
            ค่าห้อง: item.booking_total,
            รวม: parseFloat(item.deposit_total || 0) + parseFloat(item.booking_total || 0)
          }))
        ];
        break;

      case 'overdue-bills':
        filename = 'รายงานบิลค้างชำระ';
        processedData = reportData.map(item => ({
          รหัสบิล: item.bill_id,
          เดือน: item.bill_month,
          ปี: item.bill_year,
          ห้อง: item.room_number,
          ประเภทห้อง: item.room_type_name,
          ผู้เช่า: item.tenant_name,
          เบอร์ติดต่อ: item.tenant_phone,
          อีเมล: item.tenant_email,
          ค่าเช่า: item.room_rent,
          ค่าน้ำ: item.water_cost,
          ค่าไฟ: item.electricity_cost,
          อื่นๆ: item.other_charges,
          รวม: item.total_amount,
          กำหนดชำระ: item.due_date,
          เลยกำหนด_วัน: item.days_overdue,
          ค่าปรับ: item.penalty_amount,
          สถานะ: item.bill_status
        }));
        break;

      case 'room-status':
        filename = 'รายงานสถานะห้องพัก';
        processedData = reportData.map(item => ({
          รหัสห้อง: item.room_id,
          เลขห้อง: item.room_number,
          ประเภท: item.room_type_name,
          ค่าเช่าต่อเดือน: item.price_per_month,
          สถานะ: item.room_status,
          ผู้เช่าปัจจุบัน: item.current_tenant,
          เบอร์ติดต่อ: item.tenant_phone,
          วันเริ่มสัญญา: item.contract_start,
          วันสิ้นสุดสัญญา: item.contract_end,
          เหลือวันหมดอายุ: item.days_until_expire
        }));
        break;

      case 'members':
        filename = 'รายงานสมาชิก';
        processedData = reportData.map(item => ({
          รหัสสมาชิก: item.mem_id,
          ชื่อ: item.mem_name,
          อีเมล: item.mem_email,
          เบอร์โทร: item.mem_tel,
          เลขบัตรประชาชน: item.mem_card_id,
          บทบาท: item.role,
          สถานะ: item.status,
          ห้องที่พัก: item.room_number,
          ประเภทห้อง: item.room_type_name,
          วันเริ่มสัญญา: item.contract_start,
          วันสิ้นสุดสัญญา: item.contract_end,
          เข้าสู่ระบบล่าสุด: item.last_login
        }));
        break;

      case 'bookings':
        filename = 'รายงานการจอง';
        processedData = reportData.map(item => ({
          รหัสการจอง: item.booking_id,
          วันที่จอง: item.booking_date,
          ชื่อนักศึกษา: item.student_name,
          เบอร์โทร: item.student_phone,
          อีเมล: item.student_email,
          ห้อง: item.room_number,
          ประเภทห้อง: item.room_type_name,
          ค่าเช่าต่อเดือน: item.price_per_month,
          วันเข้าพัก: item.check_in_date,
          วันออก: item.check_out_date,
          สถานะการจอง: item.booking_status,
          สถานะเงินมัดจำ: item.deposit_status,
          เงินมัดจำ: item.deposit_amount,
          ค่าห้องรวม: item.total_price,
          ยอดที่ชำระ: item.total_paid,
          วันที่อนุมัติ: item.manager_approved_at,
          ผู้อนุมัติ: item.approved_by
        }));
        break;

      case 'meter-readings':
        filename = 'รายงานการจดมิเตอร์';
        processedData = reportData.map(item => ({
          รหัส: item.reading_id,
          เดือน: item.reading_month,
          ปี: item.reading_year,
          ห้อง: item.room_number,
          ประเภทห้อง: item.room_type_name,
          ผู้เช่า: item.tenant_name,
          มิเตอร์น้ำเก่า: item.previous_water_reading,
          มิเตอร์น้ำใหม่: item.current_water_reading,
          หน่วยน้ำที่ใช้: item.water_usage,
          มิเตอร์ไฟเก่า: item.previous_electricity_reading,
          มิเตอร์ไฟใหม่: item.current_electricity_reading,
          หน่วยไฟที่ใช้: item.electricity_usage,
          ค่าใช้จ่ายอื่น: item.other_charges,
          เหตุผลอื่น: item.other_charges_reason,
          วันที่จด: item.recorded_date,
          ผู้จด: item.recorded_by_name,
          หมายเหตุ: item.notes
        }));
        break;

      case 'login-history':
        filename = 'รายงานประวัติการเข้าสู่ระบบ';
        processedData = reportData.map(item => ({
          รหัส: item.id,
          วันเวลา: item.login_time,
          ชื่อ: item.mem_name,
          อีเมล: item.mem_email,
          บทบาท: item.role,
          IP_Address: item.ip_address,
          สถานะ: item.login_status,
          เหตุผลล้มเหลว: item.failure_reason,
          User_Agent: item.user_agent
        }));
        break;
        
      default:
        filename = 'รายงาน';
        processedData = reportData;
        break;
    }

    exportToExcel(processedData, filename);
  };

  const handleReportSelect = (reportType) => {
    setSelectedReport(reportType);
    setReportData(null);
    fetchReportData(reportType);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  const getPreviewData = () => {
    if (!reportData) return [];
    
    switch (selectedReport) {
      case 'monthly-revenue':
        return [
          ...reportData.billRevenue.slice(0, 5).map(item => ({
            ประเภท: 'บิลรายเดือน',
            เดือน_ปี: `${item.bill_month}/${item.bill_year}`,
            จำนวน: item.bill_count,
            ยอดรวม: formatCurrency(item.bills_total)
          })),
          ...reportData.bookingRevenue.slice(0, 5).map(item => ({
            ประเภท: 'การจอง',
            เดือน_ปี: `${item.approval_month}/${item.approval_year}`,
            จำนวน: item.booking_count,
            ยอดรวม: formatCurrency(parseFloat(item.deposit_total || 0) + parseFloat(item.booking_total || 0))
          }))
        ];
        
      case 'overdue-bills':
        return reportData.slice(0, 5).map(item => ({
          ห้อง: item.room_number,
          ผู้เช่า: item.tenant_name,
          ยอดค้าง: formatCurrency(item.total_amount),
          เลยกำหนด: `${item.days_overdue} วัน`,
          กำหนดชำระ: formatDate(item.due_date)
        }));

      case 'room-status':
        return reportData.slice(0, 5).map(item => ({
          ห้อง: item.room_number,
          ประเภท: item.room_type_name,
          สถานะ: item.room_status,
          ผู้เช่า: item.current_tenant || '-',
          ค่าเช่า: formatCurrency(item.price_per_month)
        }));

      case 'members':
        return reportData.slice(0, 5).map(item => ({
          ชื่อ: item.mem_name,
          อีเมล: item.mem_email,
          บทบาท: item.role,
          ห้อง: item.room_number || '-',
          สถานะ: item.status
        }));

      case 'bookings':
        return reportData.slice(0, 5).map(item => ({
          วันที่จอง: formatDate(item.booking_date),
          นักศึกษา: item.student_name,
          ห้อง: item.room_number,
          สถานะ: item.booking_status,
          ยอดชำระ: formatCurrency(item.total_paid)
        }));

      case 'meter-readings':
        return reportData.slice(0, 5).map(item => ({
          ห้อง: item.room_number,
          เดือน_ปี: `${item.reading_month}/${item.reading_year}`,
          ผู้เช่า: item.tenant_name || '-',
          หน่วยน้ำ: item.water_usage,
          หน่วยไฟ: item.electricity_usage,
          วันที่จด: formatDate(item.recorded_date)
        }));

      case 'login-history':
        return reportData.slice(0, 5).map(item => ({
          วันเวลา: formatDate(item.login_time),
          ชื่อ: item.mem_name,
          บทบาท: item.role,
          สถานะ: item.login_status,
          IP: item.ip_address
        }));

      default:
        return [];
    }
  };

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">รายงาน</h1>
              <p className="text-gray-600">ส่งออกรายงานต่างๆ เป็นไฟล์ Excel</p>
            </div>

            {/* Report Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {reportTypes.map((report) => {
                if (report.adminOnly && !['Admin'].includes(localStorage.getItem('userRole'))) {
                  return null;
                }
                
                const Icon = report.icon;
                return (
                  <div
                    key={report.id}
                    className={`${report.bgColor} border-2 ${
                      selectedReport === report.id ? 'border-blue-500' : 'border-transparent'
                    } rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200`}
                    onClick={() => handleReportSelect(report.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${report.bgColor}`}>
                        <Icon className={`h-6 w-6 ${report.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {report.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {report.description}
                        </p>
                        {selectedReport === report.id && (
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchReportData(report.id);
                              }}
                              disabled={loading}
                              className="flex items-center space-x-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
                            >
                              <FaEye className="h-3 w-3" />
                              <span>ดูข้อมูล</span>
                            </button>
                            {reportData && reportData.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportReport(report.id);
                                }}
                                className="flex items-center space-x-2 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md transition-colors"
                              >
                                <FaDownload className="h-3 w-3" />
                                <span>Excel</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filters */}
            {selectedReport && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ตัวกรองข้อมูล</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(selectedReport === 'monthly-revenue' || selectedReport === 'bookings' || selectedReport === 'login-history') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
                        <input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                          className="input-field"
                        />
                      </div>
                    </>
                  )}
                  
                  {selectedReport === 'meter-readings' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">เดือน</label>
                        <select
                          value={filters.month}
                          onChange={(e) => setFilters({...filters, month: e.target.value})}
                          className="input-field"
                        >
                          {[...Array(12)].map((_, i) => (
                            <option key={i+1} value={i+1}>{i+1}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ปี</label>
                        <input
                          type="number"
                          value={filters.year}
                          onChange={(e) => setFilters({...filters, year: e.target.value})}
                          className="input-field"
                          min="2020"
                          max="2030"
                        />
                      </div>
                    </>
                  )}

                  {selectedReport === 'bookings' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="input-field"
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="pending">รออนุมัติ</option>
                        <option value="approved">อนุมัติแล้ว</option>
                        <option value="rejected">ปฏิเสธ</option>
                        <option value="cancelled">ยกเลิก</option>
                        <option value="completed">เสร็จสิ้น</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Report Preview */}
            {loading && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
                </div>
              </div>
            )}

            {reportData && !loading && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      ตัวอย่างข้อมูล ({Array.isArray(reportData) ? reportData.length : (reportData.billRevenue?.length || 0) + (reportData.bookingRevenue?.length || 0)} รายการ)
                    </h3>
                    <button
                      onClick={() => handleExportReport(selectedReport)}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      <FaFileExcel className="h-4 w-4" />
                      <span>ส่งออก Excel</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {getPreviewData().length === 0 ? (
                    <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลในรายงานนี้</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto">
                        <thead>
                          <tr className="bg-gray-50">
                            {Object.keys(getPreviewData()[0] || {}).map((key) => (
                              <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {getPreviewData().map((row, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2 text-sm text-gray-600">
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {getPreviewData().length < (Array.isArray(reportData) ? reportData.length : (reportData.billRevenue?.length || 0) + (reportData.bookingRevenue?.length || 0)) && (
                        <div className="text-center pt-4 border-t">
                          <p className="text-sm text-gray-500">
                            แสดง {getPreviewData().length} รายการแรก จากทั้งหมด {Array.isArray(reportData) ? reportData.length : (reportData.billRevenue?.length || 0) + (reportData.bookingRevenue?.length || 0)} รายการ
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <ToastContainer notifications={notifications} />
        </div>
      </PageTransition>
    </div>
  );
};

export default Reports;
