import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import Login from "../pages/Login";

const LoginArea = () => {
  return (
    <div>
      <Navbar />
      <PageTransition>
        <main className="main-area fix">
          <Login />
        </main>
      </PageTransition>
    </div>
  );
};

export default LoginArea;