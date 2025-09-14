import Navbar from '../components/Navbar';
import ProfilePage from "../pages/Profile";

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