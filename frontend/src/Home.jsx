import React, { useRef } from 'react';
import Navbar from './Components/Ladingpagecomponents/Navbar';
import App from './Components/Ladingpagecomponents/App';
import Footer from './Components/Ladingpagecomponents/Footer';
const Home = () => {
  // Define refs for each section
  const Homeref = useRef(null);
  const Featuresref = useRef(null);
  const Pricingref = useRef(null);
  const Aboutusref = useRef(null);

  // Function to scroll to a specific section
  const scrollToSection = (section) => {
    if (section === 'Home') {
      Homeref.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'Feature') {
      Featuresref.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'Pricing') {
      Pricingref.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'About') {
      Aboutusref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      <Navbar scrollToSection={scrollToSection} />  {/* Pass scrollToSection to Navbar */}
      <App
        Homeref={Homeref}
        Featuresref={Featuresref}
        Pricingref={Pricingref}
        Aboutusref={Aboutusref}
      />
      
        {/* <Footer /> */}
      
    </div>
  );
};

export default Home;