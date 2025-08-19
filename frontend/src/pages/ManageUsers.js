import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { LoadingSpinner } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import axios from 'axios';

const ManageUsers = () => {
  const { user } = useAuth();
  const { notifications, showSuccess, showError } = useNotification();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, Student, Manager, Admin, inactive
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    mem_name: '',
    mem_email: '',
    mem_password: '',
    mem_card_id: '',
    mem_addr: '',
    mem_tel: '',
    role: 'Student'
  });

  useEffect(() => {
    if (user && user.role === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      showError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await axios.post('http://localhost:5000/api/users', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      showSuccess('เพิ่มผู้ใช้สำเร็จ');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      showError(error.response?.data?.message || 'ไม่สามารถเพิ่มผู้ใช้ได้');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const updateData = { ...formData };
      if (!updateData.mem_password) {
        delete updateData.mem_password; // Don't update password if empty
      }
      
      await axios.put(`http://localhost:5000/api/users/${selectedUser.mem_id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      showSuccess('อัปเดตผู้ใช้สำเร็จ');
      setShowEditModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      showError(error.response?.data?.message || 'ไม่สามารถอัปเดตผู้ใช้ได้');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`ต้องการลบผู้ใช้ "${userName}" หรือไม่?`)) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      showSuccess('ลบผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      showError(error.response?.data?.message || 'ไม่สามารถลบผู้ใช้ได้');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus === '1' ? 'deactivate' : 'activate';
    const actionText = currentStatus === '1' ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน';
    
    if (!window.confirm(`ต้องการ${actionText}ผู้ใช้นี้หรือไม่?`)) return;
    
    try {
      await axios.patch(`http://localhost:5000/api/users/${userId}/${action}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      showSuccess(`${actionText}ผู้ใช้สำเร็จ`);
      fetchUsers();
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      showError(`ไม่สามารถ${actionText}ผู้ใช้ได้`);
    }
  };

  const resetForm = () => {
    setFormData({
      mem_name: '',
      mem_email: '',
      mem_password: '',
      mem_card_id: '',
      mem_addr: '',
      mem_tel: '',
      role: 'Student'
    });
    setSelectedUser(null);
  };

  const openEditModal = (userData) => {
    setSelectedUser(userData);
    setFormData({
      mem_name: userData.mem_name,
      mem_email: userData.mem_email,
      mem_password: '', // Don't prefill password
      mem_card_id: userData.mem_card_id,
      mem_addr: userData.mem_addr,
      mem_tel: userData.mem_tel,
      role: userData.role
    });
    setShowEditModal(true);
  };

  const getRoleColor = (role) => {
    const colors = {
      'Student': 'bg-blue-100 text-blue-800',
      'Manager': 'bg-purple-100 text-purple-800',
      'Admin': 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleText = (role) => {
    const texts = {
      'Student': '👨‍🎓 นักศึกษา',
      'Manager': '👨‍💼 ผู้จัดการ',
      'Admin': '👑 แอดมิน'
    };
    return texts[role] || role;
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'inactive') return user.mem_status === '0';
    return user.role === filter && user.mem_status === '1';
  });

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

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
          <div className="max-w-7xl mx-auto px-4">
            
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                👥 จัดการผู้ใช้
              </h1>
              <p className="text-gray-600 mt-2">
                จัดการข้อมูลผู้ใช้ระบบ นักศึกษา และผู้จัดการ
              </p>
            </div>

            {/* Actions & Filters */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ทั้งหมด ({users.filter(u => u.mem_status === '1').length})
                </button>
                <button
                  onClick={() => setFilter('Student')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'Student' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  นักศึกษา ({users.filter(u => u.role === 'Student' && u.mem_status === '1').length})
                </button>
                <button
                  onClick={() => setFilter('Manager')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'Manager' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ผู้จัดการ ({users.filter(u => u.role === 'Manager' && u.mem_status === '1').length})
                </button>
                <button
                  onClick={() => setFilter('Admin')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'Admin' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  แอดมิน ({users.filter(u => u.role === 'Admin' && u.mem_status === '1').length})
                </button>
                <button
                  onClick={() => setFilter('inactive')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'inactive' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ปิดใช้งาน ({users.filter(u => u.mem_status === '0').length})
                </button>
              </div>

              {/* Add User Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                ➕ เพิ่มผู้ใช้ใหม่
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้ใช้
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ติดต่อ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        บทบาท
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((userData) => (
                      <tr key={userData.mem_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {userData.mem_img ? (
                              <img
                                src={`http://localhost:5000/uploads/profiles/${userData.mem_img}`}
                                alt="profile"
                                className="w-10 h-10 rounded-full object-cover mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <span className="text-gray-600 font-medium">
                                  {userData.mem_name?.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {userData.mem_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {userData.mem_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{userData.mem_email}</div>
                          <div className="text-sm text-gray-500">{userData.mem_tel}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userData.role)}`}>
                            {getRoleText(userData.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.mem_status === '1' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userData.mem_status === '1' ? '✅ ใช้งาน' : '❌ ปิดใช้งาน'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(userData)}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                            >
                              ✏️ แก้ไข
                            </button>
                            <button
                              onClick={() => handleToggleStatus(userData.mem_id, userData.mem_status)}
                              className={`px-2 py-1 rounded text-xs ${
                                userData.mem_status === '1'
                                  ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                                  : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              }`}
                            >
                              {userData.mem_status === '1' ? '🔒 ปิดใช้งาน' : '🔓 เปิดใช้งาน'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(userData.mem_id, userData.mem_name)}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                            >
                              🗑️ ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีผู้ใช้</h3>
                    <p className="text-gray-600">ไม่มีผู้ใช้ที่ตรงกับตัวกรองที่เลือก</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    ➕ เพิ่มผู้ใช้ใหม่
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                      <input
                        type="text"
                        value={formData.mem_name}
                        onChange={(e) => setFormData({...formData, mem_name: e.target.value})}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                      <input
                        type="email"
                        value={formData.mem_email}
                        onChange={(e) => setFormData({...formData, mem_email: e.target.value})}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
                      <input
                        type="password"
                        value={formData.mem_password}
                        onChange={(e) => setFormData({...formData, mem_password: e.target.value})}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">เลขบัตรประชาชน</label>
                      <input
                        type="text"
                        value={formData.mem_card_id}
                        onChange={(e) => setFormData({...formData, mem_card_id: e.target.value})}
                        className="input-field"
                        maxLength="13"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                      <textarea
                        value={formData.mem_addr}
                        onChange={(e) => setFormData({...formData, mem_addr: e.target.value})}
                        className="input-field"
                        rows="3"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                      <input
                        type="tel"
                        value={formData.mem_tel}
                        onChange={(e) => setFormData({...formData, mem_tel: e.target.value})}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">บทบาท</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="input-field"
                      >
                        <option value="Student">นักศึกษา</option>
                        <option value="Manager">ผู้จัดการ</option>
                        <option value="Admin">แอดมิน</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={handleCreateUser}
                    className="btn-primary w-full sm:w-auto"
                  >
                    เพิ่มผู้ใช้
                  </button>
                  <button
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    ✏️ แก้ไขผู้ใช้: {selectedUser?.mem_name}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                      <input
                        type="text"
                        value={formData.mem_name}
                        onChange={(e) => setFormData({...formData, mem_name: e.target.value})}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                      <input
                        type="email"
                        value={formData.mem_email}
                        onChange={(e) => setFormData({...formData, mem_email: e.target.value})}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)</label>
                      <input
                        type="password"
                        value={formData.mem_password}
                        onChange={(e) => setFormData({...formData, mem_password: e.target.value})}
                        className="input-field"
                        placeholder="ใส่รหัสผ่านใหม่หากต้องการเปลี่ยน"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">เลขบัตรประชาชน</label>
                      <input
                        type="text"
                        value={formData.mem_card_id}
                        onChange={(e) => setFormData({...formData, mem_card_id: e.target.value})}
                        className="input-field"
                        maxLength="13"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                      <textarea
                        value={formData.mem_addr}
                        onChange={(e) => setFormData({...formData, mem_addr: e.target.value})}
                        className="input-field"
                        rows="3"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                      <input
                        type="tel"
                        value={formData.mem_tel}
                        onChange={(e) => setFormData({...formData, mem_tel: e.target.value})}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">บทบาท</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="input-field"
                      >
                        <option value="Student">นักศึกษา</option>
                        <option value="Manager">ผู้จัดการ</option>
                        <option value="Admin">แอดมิน</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={handleUpdateUser}
                    className="btn-primary w-full sm:w-auto"
                  >
                    บันทึกการแก้ไข
                  </button>
                  <button
                    onClick={() => { setShowEditModal(false); resetForm(); }}
                    className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
      
      <ToastContainer notifications={notifications} />
    </div>
  );
};

export default ManageUsers;
