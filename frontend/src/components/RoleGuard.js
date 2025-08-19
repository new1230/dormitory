import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const RoleGuard = ({ 
  allowedRoles = [], 
  children, 
  fallback = null,
  showAccessDenied = true 
}) => {
  const { user } = useAuth();

  // ถ้าไม่มี user หรือไม่ได้ระบุ role
  if (!user || !user.role) {
    return fallback;
  }

  // ถ้าไม่ได้กำหนด allowedRoles หมายถึงอนุญาตทุก role
  if (allowedRoles.length === 0) {
    return children;
  }

  // ตรวจสอบว่า role ปัจจุบันอยู่ใน allowedRoles หรือไม่
  if (!allowedRoles.includes(user.role)) {
    if (showAccessDenied) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                ไม่มีสิทธิ์เข้าถึง
              </h3>
              <p className="text-sm text-red-700 mt-1">
                คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้
              </p>
            </div>
          </div>
        </div>
      );
    }
    return fallback;
  }

  return children;
};

// HOC สำหรับ wrap component ด้วย role checking
export const withRoleGuard = (WrappedComponent, allowedRoles = []) => {
  return (props) => (
    <RoleGuard allowedRoles={allowedRoles}>
      <WrappedComponent {...props} />
    </RoleGuard>
  );
};

// Hook สำหรับตรวจสอบ permission ใน component
export const usePermission = () => {
  const { user } = useAuth();

  const hasRole = (role) => user?.role === role;
  
  const hasAnyRole = (roles) => roles.includes(user?.role);
  
  const isStudent = () => hasRole('Student');
  const isManager = () => hasRole('Manager');
  const isAdmin = () => hasRole('Admin');
  
  const canAccess = (allowedRoles) => {
    if (!user || !user.role) return false;
    if (allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    isStudent,
    isManager,
    isAdmin,
    canAccess
  };
};

export default RoleGuard;
