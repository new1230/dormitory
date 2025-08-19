// Role-Based Access Control Middleware

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // ตรวจสอบว่ามี user ใน req หรือไม่ (จาก authenticateToken middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
    }

    // ถ้าไม่ได้กำหนด allowedRoles หมายถึงอนุญาตทุก role
    if (!allowedRoles || allowedRoles.length === 0) {
      return next();
    }

    // ตรวจสอบว่า role ของ user อยู่ใน allowedRoles หรือไม่
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Access denied for role: ${req.user.role}, required: [${allowedRoles.join(', ')}]`);
      return res.status(403).json({ 
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
        required_roles: allowedRoles,
        user_role: req.user.role
      });
    }

    console.log(`✅ Access granted for role: ${req.user.role}`);
    next();
  };
};

// Convenience middleware functions
export const requireAdmin = requireRole(['Admin']);
export const requireManager = requireRole(['Manager']);
export const requireStudent = requireRole(['Student']);

export const requireManagerOrAdmin = requireRole(['Manager', 'Admin']);
export const requireStudentOrManager = requireRole(['Student', 'Manager']);
export const requireAnyRole = requireRole(['Student', 'Manager', 'Admin']);

// Permission checking functions
export const canAccessUserData = (currentUser, targetUserId) => {
  // Admin สามารถเข้าถึงข้อมูลของทุกคนได้
  if (currentUser.role === 'Admin') {
    return true;
  }
  
  // Manager สามารถเข้าถึงข้อมูลของ Student ได้
  if (currentUser.role === 'Manager') {
    return true; // จะต้องเพิ่มการตรวจสอบเพิ่มเติมว่า targetUser เป็น Student หรือไม่
  }
  
  // Student สามารถเข้าถึงข้อมูลของตัวเองได้
  if (currentUser.role === 'Student') {
    return currentUser.id === parseInt(targetUserId);
  }
  
  return false;
};

export const canManageRooms = (userRole) => {
  return ['Manager', 'Admin'].includes(userRole);
};

export const canManageUsers = (userRole) => {
  return userRole === 'Admin';
};

export const canViewReports = (userRole) => {
  return ['Manager', 'Admin'].includes(userRole);
};

export const canManageBookings = (userRole) => {
  return ['Manager', 'Admin'].includes(userRole);
};

// Resource-based access control
export const checkResourceAccess = (resource, action) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
    }

    const permissions = getResourcePermissions(resource, userRole);
    
    if (!permissions.includes(action)) {
      return res.status(403).json({ 
        message: `ไม่มีสิทธิ์ในการ ${action} ข้อมูล ${resource}`,
        resource,
        action,
        user_role: userRole
      });
    }

    next();
  };
};

// กำหนด permissions สำหรับแต่ละ resource และ role
const getResourcePermissions = (resource, role) => {
  const permissions = {
    'users': {
      'Admin': ['create', 'read', 'update', 'delete'],
      'Manager': ['read'],
      'Student': []
    },
    'rooms': {
      'Admin': ['create', 'read', 'update', 'delete'],
      'Manager': ['create', 'read', 'update', 'delete'],
      'Student': ['read']
    },
    'bookings': {
      'Admin': ['create', 'read', 'update', 'delete'],
      'Manager': ['create', 'read', 'update', 'delete'],
      'Student': ['create', 'read', 'update'] // Student ไม่สามารถลบการจองของคนอื่นได้
    },
    'reports': {
      'Admin': ['create', 'read', 'update', 'delete'],
      'Manager': ['read'],
      'Student': []
    },
    'payments': {
      'Admin': ['create', 'read', 'update', 'delete'],
      'Manager': ['create', 'read', 'update', 'delete'],
      'Student': ['read', 'update'] // Student สามารถดูและอัพเดทการชำระเงินของตัวเองได้
    }
  };

  return permissions[resource]?.[role] || [];
};

export default requireRole;
