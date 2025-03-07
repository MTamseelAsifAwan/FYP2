import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Home from './Home.jsx';
import SignupForm from './Components/Ladingpagecomponents/Signupform.jsx';
import LoginForm from './Components/Ladingpagecomponents/Loginform.jsx';
import SkeletonLoader from './Components/Loader/DashboardSkeleton.jsx';
import NewProject from './Components/DashboardComponents/NewProject.jsx';
import Tasks from './Components/DashboardComponents/Tasks.jsx';
const Dashboard = lazy(() => import('./Components/DashboardComponents/Dashboard.jsx'));

const Routers = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
   try{
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
      return () => unsubscribe();
    });
   }
   catch(error){
     console.log(error);
   }

    // Cleanup subscription on unmount
  
  }, [auth]);

  if (loading) {
    return <SkeletonLoader />; // Show a loading indicator while checking auth status
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/Tasks" element={<Tasks/>} />
        <Route path="/newproject" element={<NewProject />} />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Suspense fallback={<div><SkeletonLoader/></div>}>
                <Dashboard />
              </Suspense>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        {/* Add your other routes here */}
      </Routes>
    </Router>
  );
};

export default Routers;