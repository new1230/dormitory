import React from 'react';
import { BrowserRouter as Router, Routes, Route,  } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from "./contexts/ProfileContext";
import PageTransition from './components/PageTransition';
import ProtectedRoute from './components/ProtectedRoute';
//import Navbar from './components/Navbar';
import Home from './Routes/Home';
import Login from './Routes/Login';
import Register from './Routes/Register';
import ForgotPassword from './Routes/ForgotPassword';
import Dormitories from './Routes/Dormitories';
import Profile from "./pages/Profile";
import ActivityLog from "./pages/ActivityLog";
import ManageRoomTypes from "./pages/ManageRoomTypes";
import ManageRooms from "./pages/ManageRooms";
import RoomTypesGallery from "./pages/RoomTypesGallery";
import RoomDetailBooking from "./pages/RoomDetailBooking";
import BookingContract from "./pages/BookingContract";
import BookingDetails from "./pages/BookingDetails";
import Payment from "./pages/Payment";
import MyBookings from "./pages/MyBookings";
import ManageBookings from "./pages/ManageBookings";
import ManageUsers from "./pages/ManageUsers";
import RoomDetail from "./Routes/RoomDetail";
import Room from "./Routes/Room";
import MeterReading from "./pages/MeterReading";


function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
           
            <main className="container mx-auto px-4 py-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={
                  <ProtectedRoute requireAuth={false}>
                    <Home />
                  </ProtectedRoute>
                } />
                
                <Route path="/login" element={
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                } />
                
                <Route path="/register" element={
                  <ProtectedRoute requireAuth={false}>
                    <Register />
                  </ProtectedRoute>
                } />
                
                <Route path="/forgot-password" element={
                  <ProtectedRoute requireAuth={false}>
                    <ForgotPassword />
                  </ProtectedRoute>
                } />

                {/* Protected Routes - All logged-in users */}

                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                <Route path="/activity-log" element={
                  <ProtectedRoute>
                    <ActivityLog />
                  </ProtectedRoute>
                } />
                

                
                <Route path="/room" element={
                  <ProtectedRoute>
                    <Room />
                  </ProtectedRoute>
                } />
                
                <Route path="/room-types" element={
                  <ProtectedRoute>
                    <RoomTypesGallery />
                  </ProtectedRoute>
                } />
                
                <Route path="/dormitories" element={<Dormitories />} />
                
                <Route path="/room-detail/:roomId" element={<RoomDetailBooking />} />
                
                {/* Booking Flow Routes */}
                <Route path="/booking-contract" element={
                  <ProtectedRoute>
                    <BookingContract />
                  </ProtectedRoute>
                } />
                
                <Route path="/booking-details" element={
                  <ProtectedRoute>
                    <BookingDetails />
                  </ProtectedRoute>
                } />
                
                <Route path="/payment" element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                } />

                {/* Student Routes */}
                <Route path="/bookings" element={
                  <ProtectedRoute allowedRoles={['Student']}>
                    <MyBookings />
                  </ProtectedRoute>
                } />
                
                <Route path="/payments" element={
                  <ProtectedRoute allowedRoles={['Student']}>
                    <div>บิลค่าใช้จ่าย (Student Only)</div>
                  </ProtectedRoute>
                } />

                {/* Manager Routes */}
                <Route path="/manage-rooms" element={
                  <ProtectedRoute allowedRoles={['Manager', 'Admin']}>
                    <ManageRooms />
                  </ProtectedRoute>
                } />
                
                <Route path="/manage-bookings" element={
                  <ProtectedRoute allowedRoles={['Manager', 'Admin']}>
                    <ManageBookings />
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute allowedRoles={['Manager', 'Admin']}>
                    <div>รายงาน (Manager/Admin)</div>
                  </ProtectedRoute>
                } />
                
                <Route path="/meter-reading" element={
                  <ProtectedRoute allowedRoles={['Manager', 'Admin']}>
                    <MeterReading />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <div>แดชบอร์ดแอดมิน (Admin Only)</div>
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <ManageUsers />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/system" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <div>ตั้งค่าระบบ (Admin Only)</div>
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/reports" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <div>รายงานทั้งหมด (Admin Only)</div>
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </Router>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
