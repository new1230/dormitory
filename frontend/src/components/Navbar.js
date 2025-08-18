import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProfileContext } from '../contexts/ProfileContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { currentProfile } = useContext(ProfileContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            หอพักนักศึกษา
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/dormitories" className="text-gray-700 hover:text-primary-600">
              หอพัก
            </Link>
            <Link to="/room-detail" className="text-gray-700 hover:text-primary-600">
              รายละเอียดหอพัก
            </Link>
            {user ? (
              <>
                <Link to="/bookings" className="text-gray-700 hover:text-primary-600">
                  การจองของฉัน
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-primary-600">
                  โปรไฟล์
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary-600">
                    จัดการระบบ
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                >
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  เข้าสู่ระบบ
                </Link>
              </>
            )}
          </div>
        </div>
        {currentProfile && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {currentProfile.image && (
              <img
                src={currentProfile.image}
                alt="profile"
                style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 8 }}
              />
            )}
            <span>{currentProfile.name}</span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;