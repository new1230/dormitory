import Navbar from '../components/Navbar';
import Room from "../pages/Room";

const RoomArea = () => {
  return (
    <>
      <Navbar />
      <main className="main-area fix">
        <Room />
      </main>
    </>
  );
};

export default RoomArea;