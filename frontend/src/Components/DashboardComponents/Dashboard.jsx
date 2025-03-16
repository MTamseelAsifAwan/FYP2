import React, { useState, useRef, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import Sidebar from './Sidebar';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import heroimage from '../Ladingpagecomponents/assets/hero/hero-background.jpg';
import Tasks from './Tasks.jsx';
const Chatroom = lazy(() => import('./Setting.jsx'));
import UserProvider from './context/context.jsx';
const Projecthome = lazy(() => import('./Projecthome'));
import axios from 'axios';
import Reports from './Reports'; // Import the Reports component

function Dashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showDropdown, setShowDropdown] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [projectData, setProjectData] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const dropdownMenuRef = useRef();
  const btnref = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totaltodo, settodo] = useState(0);
  const [totalinprogress, setinprogress] = useState(0);
  const [totaldone, setotaldone] = useState(0);
  const [taskSummary, setTaskSummary] = useState({});
  const [graphLoading, setGraphLoading] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const processIssuesData = useCallback((issues) => {
    const categoryCounts = {
      toDo: 0,
      inProgress: 0,
      done: 0,
    };

    const processedData = issues.map((issue) => {
      const statusCategory = issue.fields.status?.statusCategory?.name || 'Unknown';

      if (statusCategory.trim().toLowerCase() === 'to do') {
        categoryCounts.toDo += 1;
        settodo(categoryCounts.toDo);
      } else if (statusCategory.trim().toLowerCase() === 'in progress') {
        categoryCounts.inProgress += 1;
        setinprogress(categoryCounts.inProgress);
      } else if (statusCategory.trim().toLowerCase() === 'done') {
        categoryCounts.done += 1;
        setotaldone(categoryCounts.done);
      }

      return {
        name: issue.fields.summary || 'Unknown',
        statusCategory,
      };
    });

    setTaskSummary(categoryCounts);

    return processedData;
  }, []);

  const fetchTasks = useCallback(async (projectId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/api/tasks?projectId=${projectId}`);
      const issues = response.data.issues;
      const processedData = processIssuesData(issues);
      setProjectTasks(processedData);
      setTotalTasks(response.data.total);
      setLoading(false);
      setGraphLoading(false);
    } catch (err) {
      setError('Error fetching data');
      console.error('Error fetching data:', err);
      setLoading(false);
      setGraphLoading(false);
    }
  }, [processIssuesData]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/api/projects');
      setProjectData(response.data);
      console.log(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownMenuRef.current && !dropdownMenuRef.current.contains(e.target) &&
        btnref.current && !btnref.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchProjects();
    }
  }, [activeSection, fetchProjects]);

  const handleSelectSection = (section) => {
    if (section !== activeSection) {
      setActiveSection(section);
    }
  };

  const handleProjectSelect = useCallback((project) => {
    setSelectedProject(project);
    setProjectId(project.id);
    setShowDropdown(false);
    setGraphLoading(true);
    fetchTasks(project.id);

    setTimeout(() => {
      setGraphLoading(false);
    }, 1000);
  }, [fetchTasks]);


  const projectHomeComponent = useMemo(() => (
    <Suspense fallback={<p>Loading...</p>}>
      <UserProvider>
        {graphLoading ? (
          <div className="loader">Loading graphs...</div>
        ) : (
          <Projecthome projectid={projectId} onSlectedProject={handleProjectSelect} graphLoading={graphLoading} />
        )}
      </UserProvider>
    </Suspense>
  ), [graphLoading, projectId, handleProjectSelect]);

  return (
    <>
      <div className="flex min-h-screen h-screen bg-cover bg-center lg:bg-cover md:bg-cover sm:bg-cover overflow-auto"
          style={{ backgroundImage: `url(${heroimage})` }}
      >
        <Sidebar className="w-1/4" onSelect={handleSelectSection} activeSection={activeSection} />

        <div className="w-9/12 flex-grow pl-3 pr-3 shadow-2xl rounded-3xl h-screen mr-2 ml-1 overflow-auto">
          {activeSection === 'dashboard' && projectHomeComponent}
          
          {activeSection === 'reports' && (
            <Reports /> // Use the Reports component
          )}
          {activeSection === 'taks-report' && (
            <div>
              <h1 className="text-3xl font-bold text-white">Tasks</h1>
              <UserProvider>
                <Tasks />
              </UserProvider>
            </div>
          )}
          {activeSection === 'setting' && (
            <div className="overflow-auto h-3/4">
              <Suspense fallback={<p>Loading setting...</p>}>
                <Chatroom />
              </Suspense>
            </div>
          )}
        </div>
      </div>      
    </>
  );
}

export default Dashboard;