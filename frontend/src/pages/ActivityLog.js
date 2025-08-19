import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { LoadingSpinner } from '../components/LoadingEffect';
import axios from 'axios';

const ActivityLog = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0
  });

  useEffect(() => {
    fetchActivityLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const fetchActivityLog = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/profile/activity-log?page=${pagination.page}&limit=${pagination.limit}`);
      setActivities(response.data.activities);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActivityIcon = (activity) => {
    if (activity.user_agent.includes('LOGIN')) return '🔑';
    if (activity.user_agent.includes('LOGOUT')) return '🚪';
    if (activity.user_agent.includes('UPDATE_PROFILE')) return '✏️';
    if (activity.user_agent.includes('CHANGE_PASSWORD')) return '🔒';
    if (activity.user_agent.includes('UPLOAD')) return '📸';
    if (activity.user_agent.includes('DELETE')) return '🗑️';
    if (activity.user_agent.includes('VIEW')) return '👁️';
    return '📋';
  };

  const getActivityText = (activity) => {
    if (activity.user_agent.includes('LOGIN_SUCCESS')) return 'เข้าสู่ระบบสำเร็จ';
    if (activity.user_agent.includes('LOGOUT')) return 'ออกจากระบบ';
    if (activity.user_agent.includes('UPDATE_PROFILE')) return 'อัปเดตข้อมูลโปรไฟล์';
    if (activity.user_agent.includes('CHANGE_PASSWORD_SUCCESS')) return 'เปลี่ยนรหัสผ่านสำเร็จ';
    if (activity.user_agent.includes('CHANGE_PASSWORD_FAILED')) return 'เปลี่ยนรหัสผ่านไม่สำเร็จ';
    if (activity.user_agent.includes('UPLOAD_PROFILE_IMAGE')) return 'อัปโหลดรูปโปรไฟล์';
    if (activity.user_agent.includes('DELETE_PROFILE_IMAGE')) return 'ลบรูปโปรไฟล์';
    if (activity.user_agent.includes('VIEW_PROFILE')) return 'ดูข้อมูลโปรไฟล์';
    return activity.user_agent.split(':')[0] || 'กิจกรรมไม่ทราบ';
  };

  const getStatusColor = (activity) => {
    if (activity.login_status === 'success') return 'text-green-600 bg-green-50';
    if (activity.login_status === 'failed') return 'text-red-600 bg-red-50';
    if (activity.user_agent.includes('FAILED')) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (!user) {
    return (
      <div>
        <Navbar />
        <PageTransition>
          <div className="text-center py-8">
            <p>กรุณาเข้าสู่ระบบ</p>
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
            {/* หัวข้อ */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ประวัติการใช้งาน</h1>
              <p className="text-gray-600 mt-2">ดูประวัติการเข้าใช้งานและกิจกรรมต่างๆ ของคุณ</p>
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="medium" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>ไม่พบประวัติการใช้งาน</p>
                  </div>
                ) : (
                  <>
                    {/* Activities List */}
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl">
                            {getActivityIcon(activity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {getActivityText(activity)}
                              </p>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity)}`}>
                                {activity.login_status === 'success' ? 'สำเร็จ' : activity.user_agent.includes('FAILED') ? 'ไม่สำเร็จ' : 'สำเร็จ'}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              <p>เวลา: {formatDate(activity.login_time)}</p>
                              <p>IP Address: {activity.ip_address}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="mt-6 flex justify-center space-x-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                        >
                          ก่อนหน้า
                        </button>
                        
                        <div className="flex space-x-1">
                          {[...Array(pagination.totalPages)].map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => handlePageChange(i + 1)}
                              className={`px-3 py-2 text-sm rounded ${
                                pagination.page === i + 1
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                        >
                          ถัดไป
                        </button>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="mt-6 pt-4 border-t text-sm text-gray-500 text-center">
                      <p>แสดง {activities.length} รายการ จากทั้งหมด {pagination.totalItems} รายการ</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
};

export default ActivityLog;
