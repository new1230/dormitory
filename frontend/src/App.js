import React from 'react';
import { BrowserRouter as Router, Routes, Route,  } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from "./contexts/ProfileContext";
//import Navbar from './components/Navbar';
import Home from './Routes/Home';
import Login from './Routes/Login';
import Dormitories from './Routes/Dormitories';
import ProfilePage from "./Routes/Profile"; // ตรวจสอบชื่อไฟล์และชื่อ component
import RoomDetail from "./Routes/RoomDetail";
import Room from "./Routes/Room";


function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
           
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dormitories" element={<Dormitories />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/room-detail" element={<RoomDetail />} />
                <Route path="/room" element={<Room />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
