import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // แสดง loading ขณะตรวจสอบ authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // หากต้องการให้ login และยังไม่ได้ login
  if (requireAuth && !user) {
    // เก็บ path ปัจจุบันใน state เพื่อ redirect กลับมาหลัง login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // หากไม่ต้องการให้ login แต่มี user แล้ว (เช่น หน้า login/register)
  if (!requireAuth && user) {
    // redirect ไปหน้าแรกของ role
    const defaultPage = getDefaultPageForRole(user.role);
    return <Navigate to={defaultPage} replace />;
  }

  // ตรวจสอบ role หากมีการกำหนด allowedRoles
  if (requireAuth && user && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // ไม่มีสิทธิ์เข้าถึง redirect ไปหน้าแรกของ role
      const defaultPage = getDefaultPageForRole(user.role);
      return <Navigate to={defaultPage} replace />;
    }
  }

  return children;
};

// ฟังก์ชันกำหนดหน้าแรกตาม role
const getDefaultPageForRole = (role) => {
  switch (role) {
    case 'Student':
      return '/dormitories';
    case 'Manager':
      return '/manage-rooms';
    case 'Admin':
      return '/admin';
    default:
      return '/';
  }
};

export default ProtectedRoute;
