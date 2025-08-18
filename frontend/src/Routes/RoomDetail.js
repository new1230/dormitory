import Navbar from '../components/Navbar';
import RoomDetail from "../pages/RoomDetail";

const RoomDetailArea = () => {
  return (
    <>
      <Navbar />
      <main className="main-area fix">
        <RoomDetail />
      </main>
    </>
  );
};

export default RoomDetailArea;