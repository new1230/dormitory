import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { CardSkeleton } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import {
  FaHome, FaFileInvoiceDollar, FaExclamationTriangle, 
  FaChartPie, FaDollarSign, FaArrowRight, FaEye, FaChartBar
} from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { notifications, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📊 Dashboard API Response:', JSON.stringify(response.data, null, 2));
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('ไม่สามารถโหลดข้อมูล Dashboard ได้');
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
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
    financialStats,
    overdueRooms,
    pendingBills,
    monthlyRevenue
  } = dashboardData;

  console.log('🔍 roomStats from dashboardData:', JSON.stringify(roomStats, null, 2));
  
  const roomData = [
    { name: 'ว่าง', value: parseInt(roomStats?.empty_rooms || 0), color: '#10B981' },
    { name: 'มีผู้พัก', value: parseInt(roomStats?.occupied_rooms || 0), color: '#F59E0B' },
    { name: 'จอง', value: parseInt(roomStats?.reserved_rooms || 0), color: '#EF4444' }
  ];
  
  console.log('📊 roomData for chart:', JSON.stringify(roomData, null, 2));

  const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick, isClickable = false }) => (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 transition-all duration-200 ${
        isClickable ? 'hover:shadow-lg cursor-pointer transform hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${color || 'text-gray-900'}`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && <Icon className={`h-8 w-8 ${color || 'text-gray-400'}`} />}
      </div>
    </div>
  );

  const ListCard = ({ title, items, emptyMessage, onViewAll, renderItem }) => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard ผู้จัดการ</h1>
              <p className="text-gray-600">ภาพรวมการจัดการหอพักและข้อมูลสำคัญ</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="ห้องทั้งหมด"
                value={parseInt(roomStats?.total_rooms || 0)}
                subtitle="ห้อง"
                icon={FaHome}
                color="text-blue-600"
              />
              <StatCard
                title="บิลรออนุมัติ"
                value={parseInt(financialStats?.pending_bills || 0)}
                subtitle="รายการ"
                icon={FaFileInvoiceDollar}
                color="text-yellow-600"
                onClick={() => navigate('/bill-approval')}
                isClickable={true}
              />
              <StatCard
                title="ห้องค้างชำระ"
                value={parseInt(financialStats?.overdue_bills || 0)}
                subtitle="ห้อง"
                icon={FaExclamationTriangle}
                color="text-red-600"
              />
              <StatCard
                title="รายได้เดือนนี้"
                value={formatCurrency(parseFloat(financialStats?.total_revenue || 0))}
                subtitle="ที่ชำระแล้ว"
                icon={FaDollarSign}
                color="text-green-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Room Statistics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-6">
                  <FaChartPie className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">สถิติห้องพัก</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roomData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
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
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="w-4 h-4 bg-green-500 mx-auto mb-2 rounded"></div>
                    <p className="text-sm text-gray-600">ว่าง</p>
                    <p className="font-semibold">{parseInt(roomStats?.empty_rooms || 0)}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-yellow-500 mx-auto mb-2 rounded"></div>
                    <p className="text-sm text-gray-600">มีผู้พัก</p>
                    <p className="font-semibold">{parseInt(roomStats?.occupied_rooms || 0)}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-red-500 mx-auto mb-2 rounded"></div>
                    <p className="text-sm text-gray-600">จอง</p>
                    <p className="font-semibold">{parseInt(roomStats?.reserved_rooms || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Overdue Rooms */}
              <ListCard
                title="ห้องค้างชำระล่าสุด"
                items={overdueRooms?.slice(0, 5) || []}
                emptyMessage="ไม่มีห้องค้างชำระ"
                onViewAll={() => navigate('/bill-approval')}
                renderItem={(room) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        ห้อง {room.room_number} - {room.type_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {room.tenant_name} · ค้างชำระ {room.days_overdue} วัน
                      </p>
                      <p className="text-sm text-red-600 font-medium">
                        {formatCurrency(room.total_amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/bill-approval`)}
                      className="flex items-center text-red-600 hover:text-red-800 text-sm"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Pending Bills */}
              <ListCard
                title="บิลรออนุมัติล่าสุด"
                items={pendingBills?.slice(0, 5) || []}
                emptyMessage="ไม่มีบิลรออนุมัติ"
                onViewAll={() => navigate('/bill-approval')}
                renderItem={(bill) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        ห้อง {bill.room_number} - {bill.bill_month}/{bill.bill_year}
                      </p>
                      <p className="text-sm text-gray-600">
                        {bill.tenant_name} · {formatCurrency(bill.total_amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        อัปโหลด: {formatDate(bill.payment_slip_uploaded_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/bill-approval`)}
                      className="flex items-center text-yellow-600 hover:text-yellow-800 text-sm"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />

              {/* Monthly Revenue Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-6">
                  <FaChartBar className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">รายได้ 6 เดือนย้อนหลัง</h3>
                </div>
                {monthlyRevenue && monthlyRevenue.length > 0 ? (
                  <div className="space-y-3">
                    {monthlyRevenue.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          {item.bill_month}/{item.bill_year}
                        </span>
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลรายได้</p>
                )}
              </div>
            </div>
          </div>
          <ToastContainer notifications={notifications} />
        </div>
      </PageTransition>
    </div>
  );
};

export default ManagerDashboard;
