import Navbar from '../components/Navbar';
import Dormitories from "../pages/Dormitories";

const DormitoriesArea = () => {
  return (
    <>
      <Navbar />
      <main className="main-area fix">
        <Dormitories />
      </main>
    </>
  );
};

export default DormitoriesArea;