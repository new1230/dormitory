import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { LoadingSpinner, CardSkeleton } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import {
  FaHome, FaHourglassHalf, FaFileInvoiceDollar, FaExclamationTriangle, 
  FaChartPie, FaDollarSign, FaFileContract, FaArrowRight, FaEye,
  FaUsers, FaUserCheck, FaChartLine, FaCog, FaFileAlt,
  FaBell, FaWarning, FaBuilding, FaPercentage
} from 'react-icons/fa';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { notifications, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    fetchAdminDashboardData();
  }, []);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // ดึงข้อมูล Manager Dashboard ที่มีอยู่แล้ว
      const managerResponse = await axios.get('/api/dashboard/manager', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // ดึงสถิติเพิ่มเติมสำหรับ Admin
      const [usersResponse, revenueResponse, systemResponse, activityResponse] = await Promise.all([
        // สถิติผู้ใช้งาน
        axios.get('/api/admin/user-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { students: 0, managers: 0, admins: 0, activeUsers: 0 } })),
        
        // รายได้ 6 เดือนย้อนหลัง
        axios.get('/api/admin/revenue-chart', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        
        // สถิติระบบโดยรวม
        axios.get('/api/admin/system-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { totalUsers: 0, totalRevenue: 0, occupancyRate: 0 } })),
        
        // Activity logs
        axios.get('/api/admin/activity-logs', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      setDashboardData(managerResponse.data);
      setAdminStats({
        userStats: usersResponse.data,
        revenueChart: revenueResponse.data,
        systemStats: systemResponse.data,
        activityLogs: activityResponse.data
      });

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      showError('ไม่สามารถโหลดข้อมูล Admin Dashboard ได้');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('th-TH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <PageTransition>
          <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <CardSkeleton rows={2} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, index) => (
                  <CardSkeleton key={index} rows={4} />
                ))}
              </div>
            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div>
        <Navbar />
        <PageTransition>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-gray-600">ไม่สามารถโหลดข้อมูล Dashboard ได้</p>
            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  const {
    roomStats,
    pendingBookings,
    pendingBills,
    overdueAmount,
    monthlyRevenue,
    expiringContracts
  } = dashboardData;

  const pieColors = ['#10B981', '#F59E0B', '#EF4444'];
  const roomData = [
    { name: 'ว่าง', value: roomStats.available, color: '#10B981' },
    { name: 'มีผู้พัก', value: roomStats.occupied, color: '#F59E0B' },
    { name: 'ซ่อมแซม', value: roomStats.maintenance, color: '#EF4444' }
  ];

  // คำนวณ occupancy rate
  const totalRooms = roomStats.available + roomStats.occupied + roomStats.maintenance;
  const occupancyRate = totalRooms > 0 ? ((roomStats.occupied / totalRooms) * 100) : 0;

  const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick, isClickable = false, alert = false }) => (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 transition-all duration-200 ${
        isClickable ? 'hover:shadow-lg cursor-pointer transform hover:scale-105' : ''
      } ${alert ? 'ring-2 ring-red-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${color || 'text-gray-900'}`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && <Icon className={`h-8 w-8 ${color || 'text-gray-400'}`} />}
      </div>
    </div>
  );

  const ListCard = ({ title, items, emptyMessage, onViewAll, renderItem, icon: Icon }) => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {Icon && <Icon className="h-5 w-5 text-blue-600 mr-2" />}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {onViewAll && (
            <button 
              onClick={onViewAll}
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ดูทั้งหมด <FaArrowRight className="ml-1 h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index}>
                {renderItem(item)}
                {index < items.length - 1 && <div className="border-t border-gray-100 my-4"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color = "blue" }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-105 border-l-4 border-${color}-500`}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100 mr-4`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">ภาพรวมการจัดการระบบและสถิติทั้งหมด</p>
            </div>

            {/* Critical Alerts */}
            {(overdueAmount.count > 10 || occupancyRate > 90) && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaBell className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-lg font-semibold text-red-800">เตือนเรื่องสำคัญ</h3>
                </div>
                <div className="space-y-2">
                  {overdueAmount.count > 10 && (
                    <p className="text-red-700">
                      <FaExclamationTriangle className="inline h-4 w-4 mr-1" />
                      บิลค้างชำระมาก: {overdueAmount.count} บิล ({formatCurrency(overdueAmount.total)})
                    </p>
                  )}
                  {occupancyRate > 90 && (
                    <p className="text-red-700">
                      <FaWarning className="inline h-4 w-4 mr-1" />
                      ห้องเต็มเกือบหมด: อัตราการเข้าพัก {occupancyRate.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Admin Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="จำนวนผู้ใช้ทั้งหมด"
                value={adminStats?.systemStats?.totalUsers || (adminStats?.userStats?.students + adminStats?.userStats?.managers + adminStats?.userStats?.admins) || 0}
                subtitle="คน"
                icon={FaUsers}
                color="text-blue-600"
              />
              <StatCard
                title="อัตราการเข้าพัก"
                value={`${occupancyRate.toFixed(1)}%`}
                subtitle={`${roomStats.occupied}/${totalRooms} ห้อง`}
                icon={FaPercentage}
                color="text-green-600"
              />
              <StatCard
                title="รายได้สะสม"
                value={formatCurrency(adminStats?.systemStats?.totalRevenue || monthlyRevenue * 6)}
                subtitle="ทั้งหมด"
                icon={FaDollarSign}
                color="text-purple-600"
              />
              <StatCard
                title="ผู้ใช้งานออนไลน์"
                value={adminStats?.userStats?.activeUsers || 0}
                subtitle="24 ชม. ล่าสุด"
                icon={FaUserCheck}
                color="text-indigo-600"
              />
            </div>

            {/* Manager Dashboard Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="การจองรออนุมัติ"
                value={pendingBookings.count}
                subtitle="รายการ"
                icon={FaHourglassHalf}
                color="text-orange-600"
                onClick={() => navigate('/manage-bookings')}
                isClickable={true}
              />
              <StatCard
                title="บิลรออนุมัติ"
                value={pendingBills.count}
                subtitle="รายการ"
                icon={FaFileInvoiceDollar}
                color="text-blue-600"
                onClick={() => navigate('/bill-approval')}
                isClickable={true}
              />
              <StatCard
                title="ยอดค้างชำระ"
                value={formatCurrency(overdueAmount.total)}
                subtitle={`${overdueAmount.count} บิล`}
                icon={FaExclamationTriangle}
                color="text-red-600"
                alert={overdueAmount.count > 10}
              />
              <StatCard
                title="รายได้เดือนนี้"
                value={formatCurrency(monthlyRevenue)}
                subtitle="ที่ชำระแล้ว"
                icon={FaDollarSign}
                color="text-green-600"
              />
            </div>

            {/* User Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <FaUsers className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">สถิติผู้ใช้งาน</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">นักศึกษา</span>
                    <span className="font-semibold text-blue-600">{adminStats?.userStats?.students || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ผู้จัดการ</span>
                    <span className="font-semibold text-green-600">{adminStats?.userStats?.managers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">แอดมิน</span>
                    <span className="font-semibold text-purple-600">{adminStats?.userStats?.admins || 0}</span>
                  </div>
                </div>
              </div>

              {/* Room Statistics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-6">
                  <FaChartPie className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">สถิติห้องพัก</h3>
                </div>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roomData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {roomData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'ห้อง']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <FaChartLine className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">รายได้ 6 เดือน</h3>
                </div>
                <div className="h-48">
                  {adminStats?.revenueChart?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={adminStats.revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(value), 'รายได้']} />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          dot={{ fill: '#10B981' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>ไม่มีข้อมูลรายได้</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <QuickActionCard
                title="จัดการผู้ใช้"
                description="เพิ่ม แก้ไข ลบผู้ใช้งาน"
                icon={FaUsers}
                onClick={() => navigate('/admin/users')}
                color="blue"
              />
              <QuickActionCard
                title="รายงานระบบ"
                description="ดูรายงานและสถิติ"
                icon={FaFileAlt}
                onClick={() => navigate('/admin/reports')}
                color="green"
              />
              <QuickActionCard
                title="ตั้งค่าระบบ"
                description="กำหนดค่าและการตั้งค่า"
                icon={FaCog}
                onClick={() => navigate('/admin/system')}
                color="purple"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Activity Logs */}
              <ListCard
                title="การใช้งานล่าสุด"
                icon={FaUserCheck}
                items={adminStats?.activityLogs?.slice(0, 5) || []}
                emptyMessage="ไม่มีข้อมูลการใช้งาน"
                renderItem={(activity) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{activity.user_name || 'ไม่ระบุ'}</p>
                      <p className="text-sm text-gray-600">{activity.action || 'เข้าสู่ระบบ'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDateTime(activity.created_at || new Date())}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        activity.role === 'Manager' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.role || 'User'}
                      </span>
                    </div>
                  </div>
                )}
              />

              {/* Pending Bookings */}
              <ListCard
                title="การจองรออนุมัติล่าสุด"
                icon={FaHourglassHalf}
                items={pendingBookings.data}
                emptyMessage="ไม่มีการจองรออนุมัติ"
                onViewAll={() => navigate('/manage-bookings')}
                renderItem={(booking) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        ห้อง {booking.room_number} - {booking.room_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.student_name} · {formatDate(booking.requested_date)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/manage-bookings/${booking.booking_id}`)}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Bills */}
              <ListCard
                title="บิลรออนุมัติล่าสุด"
                icon={FaFileInvoiceDollar}
                items={pendingBills.data}
                emptyMessage="ไม่มีบิลรออนุมัติ"
                onViewAll={() => navigate('/bill-approval')}
                renderItem={(bill) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        ห้อง {bill.room_number} - {bill.bill_month}/{bill.bill_year}
                      </p>
                      <p className="text-sm text-gray-600">
                        {bill.student_name} · {formatCurrency(bill.total_amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/bill-approval/${bill.bill_id}`)}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />

              {/* Expiring Contracts */}
              <ListCard
                title="สัญญาใกล้หมดอายุ (30 วัน)"
                icon={FaFileContract}
                items={expiringContracts}
                emptyMessage="ไม่มีสัญญาที่ใกล้หมดอายุ"
                onViewAll={() => navigate('/admin/contracts')}
                renderItem={(contract) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        ห้อง {contract.room_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        {contract.student_name} · หมดอายุ {formatDate(contract.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contract.days_remaining <= 7 
                          ? 'bg-red-100 text-red-800'
                          : contract.days_remaining <= 14
                          ? 'bg-yellow-100 text-yellow-800'  
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {contract.days_remaining} วัน
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
          <ToastContainer notifications={notifications} />
        </div>
      </PageTransition>
    </div>
  );
};

export default AdminDashboard;
