import Navbar from '../components/Navbar';
import Login from "../pages/Login";

const LoginArea = () => {
  return (
    <>
      <Navbar />
      <main className="main-area fix">
        <Login />
      </main>
    </>
  );
};

export default LoginArea;