import Navbar from '../components/Navbar';
import Home from "../pages/Home"

const Homearea = () => {
    return (
      <>
        <Navbar />
        <main className="main-area fix">
        <Home />
        </main>
      </>
    )
  }

  export default Homearea