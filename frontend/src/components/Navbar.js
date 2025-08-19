import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProfileContext } from '../contexts/ProfileContext';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { currentProfile } = useContext(ProfileContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const [pendingBookings, setPendingBookings] = useState([]);
  
  // Fetch booking data for navbar display
  useEffect(() => {
    if (user) {
      if (user.role === 'Student') {
        fetchBookingsForNav();
      } else if (user.role === 'Manager' || user.role === 'Admin') {
        fetchPendingBookingsForManagement();
      }
    }
  }, [user]);

  const fetchBookingsForNav = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // รวมข้อมูลจาก Room และ RoomType
      const bookingsWithDetails = await Promise.all(
        response.data.map(async (booking) => {
          try {
            const roomResponse = await axios.get(`http://localhost:5000/api/rooms/${booking.room_id}`);
            return {
              ...booking,
              roomData: roomResponse.data
            };
          } catch (err) {
            console.error('Failed to fetch room data:', err);
            return booking;
          }
        })
      );
      
      setBookingCount(bookingsWithDetails.length);
      
      // เก็บเฉพาะการจองที่รอดำเนินการ
      const pending = bookingsWithDetails.filter(booking => 
        booking.booking_status === 'pending' || 
        (booking.deposit_status === 'none' && booking.booking_status === 'pending')
      );
      setPendingBookings(pending);
    } catch (error) {
      console.error('Failed to fetch bookings for navbar:', error);
    }
  };

  const fetchPendingBookingsForManagement = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // รวมข้อมูลจาก Room และ RoomType
      const bookingsWithDetails = await Promise.all(
        response.data.map(async (booking) => {
          try {
            const roomResponse = await axios.get(`http://localhost:5000/api/rooms/${booking.room_id}`);
            return {
              ...booking,
              roomData: roomResponse.data
            };
          } catch (err) {
            console.error('Failed to fetch room data:', err);
            return booking;
          }
        })
      );
      
      // เก็บเฉพาะการจองที่รอการอนุมัติ
      const pendingForApproval = bookingsWithDetails.filter(booking => 
        booking.deposit_status === 'pending' || 
        (booking.booking_status === 'pending' && booking.deposit_status === 'paid')
      );
      
      setBookingCount(pendingForApproval.length);
      setPendingBookings(pendingForApproval);
    } catch (error) {
      console.error('Failed to fetch pending bookings for management:', error);
    }
  };
  
  // Navigation items สำหรับแต่ละบทบาท
  const getNavigationItems = () => {
    if (!user) {
      // Guest navigation
      return {
        main: [
          { to: "/dormitories", label: "ห้องพัก" }
        ],
        auth: [
          { to: "/login", label: "เข้าสู่ระบบ", type: "button" },
        ]
      };
    }

    // Base navigation for logged-in users
    const baseNav = {
      main: [
        { to: "/dormitories", label: "หอพัก" }
      ],
      user: []
    };

    switch (user.role) {
      case 'Student':
        return {
          ...baseNav,
          main: [
            ...baseNav.main,
            { 
              to: "/bookings", 
              label: "การจองของฉัน",
              count: bookingCount,
              pendingCount: pendingBookings.length,
              bookingsData: pendingBookings
            },
            { to: "/payments", label: "บิลค่าใช้จ่าย" }
          ],
          user: []
        };

      case 'Manager':
        return {
          ...baseNav,
          main: [
            ...baseNav.main,
            { to: "/manage-rooms", label: "จัดการห้องพัก" },
            { 
              to: "/manage-bookings", 
              label: "อนุมัติการจอง",
              count: bookingCount,
              pendingCount: pendingBookings.length,
              bookingsData: pendingBookings
            },
            { to: "/meter-reading", label: "จดมิเตอร์และบิล" },
            { to: "/reports", label: "รายงาน" }
          ],
          user: []
        };

      case 'Admin':
        return {
          ...baseNav,
          main: [
            ...baseNav.main,
            { to: "/manage-rooms", label: "จัดการห้องพัก" },
            { 
              to: "/manage-bookings", 
              label: "อนุมัติการจอง",
              count: bookingCount,
              pendingCount: pendingBookings.length,
              bookingsData: pendingBookings
            },
            { to: "/meter-reading", label: "จดมิเตอร์และบิล" },
            { to: "/admin/users", label: "จัดการผู้ใช้" },
            { to: "/admin/reports", label: "รายงาน" },
          ],
          user: []
        };

      default:
        return baseNav;
    }
  };

  const navigationItems = getNavigationItems();



  const handleLogout = () => {
    console.log('🚪 Navbar - Starting logout process...');
    console.log('🚪 Navbar - Current user before logout:', user);
    
    logout();
    
    console.log('🚪 Navbar - Logout completed, navigating to home...');
    navigate('/');
    setIsMenuOpen(false);
    
    // Force page refresh to ensure all state is cleared
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-xl sm:text-2xl font-bold text-primary-600">
            หอพักนักศึกษา
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Main Navigation */}
            {navigationItems.main?.map((item) => (
              <div key={item.to} className="relative group">
                <Link 
                  to={item.to} 
                  className={`transition-colors relative flex items-center pb-1 ${
                    location.pathname === item.to 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  {item.label}
                  {item.count !== undefined && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {item.count}
                    </span>
                  )}
                  {item.pendingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {item.pendingCount}
                    </span>
                  )}
                </Link>
                
                {/* Booking Details Dropdown */}
                {item.bookingsData && item.bookingsData.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {user.role === 'Student' ? 'การจองที่รอดำเนินการ' : 'การจองที่รอการอนุมัติ'}
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {item.bookingsData.slice(0, 3).map((booking) => (
                          <div key={booking.booking_id} className="bg-gray-50 p-3 rounded-lg border">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-sm">#{booking.booking_id}</p>
                                <p className="text-xs text-gray-600">ห้อง {booking.roomData?.room_number}</p>
                                {user.role !== 'Student' && (
                                  <p className="text-xs text-gray-500">โดย: {booking.member?.mem_name || 'N/A'}</p>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                booking.deposit_status === 'none' ? 'bg-red-100 text-red-800' :
                                booking.deposit_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {booking.deposit_status === 'none' ? '💳 รอชำระ' :
                                 booking.deposit_status === 'pending' ? '🔍 รอตรวจสอบ' :
                                 '✅ ชำระแล้ว'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              เข้าพัก: {new Date(booking.check_in_date).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                        ))}
                        {item.bookingsData.length > 3 && (
                          <div className="text-center pt-2 border-t">
                            <Link 
                              to={user.role === 'Student' ? "/bookings" : "/manage-bookings"} 
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              ดูทั้งหมด ({item.bookingsData.length} รายการ)
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* User-specific Navigation */}
            {user ? (
              <>
                {/* User Display with Dropdown Menu */}
                <div className="relative group ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-2">
                      {user.mem_img ? (
                        <img
                          src={`http://localhost:5000/uploads/profiles/${user.mem_img}`}
                          alt="profile"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200">
                          <span className="text-primary-600 text-sm font-medium">
                            {user.mem_name?.charAt(0) || user.mem_email?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                          {user.mem_name || 'ผู้ใช้'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user.role === 'Student' && 'นักศึกษา'}
                          {user.role === 'Manager' && 'ผู้จัดการ'}
                          {user.role === 'Admin' && 'แอดมิน'}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* User Dropdown Menu */}
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <span className="w-4 h-4 mr-3 text-center">👤</span>
                        โปรไฟล์
                      </Link>
                      
                      {user.role === 'Admin' && (
                        <Link
                          to="/admin/system"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                          <span className="w-4 h-4 mr-3 text-center">⚙️</span>
                          ตั้งค่าระบบ
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <span className="w-4 h-4 mr-3 text-center">🚪</span>
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Menu Items */}
                {navigationItems.user?.map((item) => (
                  <Link 
                    key={item.to}
                    to={item.to} 
                    className="text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {/* Guest Authentication */}
                {navigationItems.auth?.map((item) => (
                  <Link 
                    key={item.to}
                    to={item.to} 
                    className={item.type === 'button' 
                      ? "btn-secondary text-sm" 
                      : "text-primary-600 hover:text-primary-700 transition-colors text-sm"
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600"
              aria-label="เมนู"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              
              {/* User Info - Mobile - Clickable Profile Link */}
              {user && (
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 mb-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user.mem_img ? (
                    <img
                      src={`http://localhost:5000/uploads/profiles/${user.mem_img}`}
                      alt="profile"
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <span className="text-primary-600 font-medium">
                        {user.mem_name?.charAt(0) || user.mem_email?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.mem_name || 'ผู้ใช้'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.role === 'Student' && 'นักศึกษา'}
                      {user.role === 'Manager' && 'ผู้จัดการ'}
                      {user.role === 'Admin' && 'แอดมิน'}
                    </p>
                  </div>
                </Link>
              )}

              {/* Main Navigation - Mobile */}
              {navigationItems.main?.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                    location.pathname === item.to
                      ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{item.label}</span>
                  <div className="flex items-center gap-1">
                    {item.count !== undefined && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {item.count}
                      </span>
                    )}
                    {item.pendingCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {item.pendingCount}
                      </span>
                    )}
                  </div>
                </Link>
              ))}

              {user ? (
                <>
                  {/* User Menu Items - Mobile */}
                  {navigationItems.user?.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`block px-3 py-2 rounded-md transition-colors ${
                        location.pathname === item.to
                          ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <>
                  {/* Guest Authentication - Mobile */}
                  {navigationItems.auth?.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`block px-3 py-2 rounded-md transition-colors ${
                        location.pathname === item.to
                          ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;