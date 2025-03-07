import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaTachometerAlt, FaTasks, FaChartBar, FaCog } from 'react-icons/fa'; // Import icons
import Logo from '../../assets/logo1-unscreen.gif';
import { auth } from '../../Auth/Firebase.jsx'; // Adjust the import path to your Firebase config
import { signOut, onAuthStateChanged } from 'firebase/auth';

const Sidebar = ({ onSelect, activeSection }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        console.log('User signed out');
        navigate('/login'); // Redirect to the login page after sign out
      })
      .catch((error) => {
        console.error('Error signing out: ', error);
      });
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar relative border shadow bg-black bg-opacity-30 backdrop-blur-lg rounded-t-xl rounded-b-xl text-white flex flex-col justify-between ${isOpen || isLargeScreen ? 'w-[10rem]' : 'w-20'} md:w-[10rem] `}>
      <button className="md:hidden p-2" onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
      <div className=''>
        <img src={Logo} alt="Logo" width={180} height={100} className={`${isOpen || isLargeScreen ? 'block' : 'hidden'} md:block`} />
      </div>
      <ul className="space-y-2 text-white font-serif font-semibold">
        <li
          onClick={() => onSelect('dashboard')}
          className={`flex items-center border space-x-2 px-5 mr-8 rounded-r-full ease-in-out py-4 cursor-pointer text-sm md:text-base ${
            activeSection === 'dashboard'
              ? 'bg-purple-900 text-white'
              : 'hover:bg-slate-200 hover:text-purple-700'
          }`}
        >
          {isOpen || isLargeScreen ? 'Dashboard' : <FaTachometerAlt />}
        </li>
        <li
          onClick={() => onSelect('taks-report')}
          className={`flex items-center border space-x-2 px-5 mr-8 rounded-r-full ease-in-out py-4 cursor-pointer text-sm md:text-base ${
            activeSection === 'taks-report'
              ? 'bg-purple-900 text-white'
              : 'hover:bg-slate-200 hover:text-purple-950'
          }`}
        >
          {isOpen || isLargeScreen ? 'Tasks' : <FaTasks />}
        </li>
        <li
          onClick={() => onSelect('reports')}
          className={`flex items-center border space-x-2 px-5 mr-8 rounded-r-full ease-in-out py-4 cursor-pointer text-sm md:text-base ${
            activeSection === 'reports'
              ? 'bg-purple-900 text-white'
              : 'hover:bg-slate-200 hover:text-purple-950'
          }`}
        >
          {isOpen || isLargeScreen ? 'Reports' : <FaChartBar />}
        </li>
        <li
          onClick={() => onSelect('setting')}
          className={`flex items-center border space-x-2 px-5 mr-8 rounded-r-full ease-in-out py-4 cursor-pointer text-sm md:text-base ${
            activeSection === 'chatroom'
              ? 'bg-purple-900 text-white'
              : 'hover:bg-slate-200 hover:text-purple-950'
          }`}
        >
          {isOpen || isLargeScreen ? 'Setting' : <FaCog />}
        </li>
        {/* Add more items as needed */}
      </ul>
      <li className="list-none bg-red-700 rounded-r-3xl p-2 mb-3 w-24 cursor-pointer hover:bg-red-600 text-center font-serif text-lg" onClick={handleSignOut}>
        Signout
      </li>
    </div>
  );
};

export default Sidebar;
