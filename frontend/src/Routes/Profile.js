import Navbar from '../components/Navbar';
import ProfilePage from "../pages/profile";

const ProfileArea = () => {
  return (
    <>
      <Navbar />
      <main className="main-area fix">
        <ProfilePage />
      </main>
    </>
  );
};

export default ProfileArea;