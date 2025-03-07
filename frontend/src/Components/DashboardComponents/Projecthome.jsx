import React, { useEffect, useState, useRef, useContext, useCallback, useMemo } from 'react';
import { FaTasks, FaClipboardList, FaHourglassStart, FaCheckCircle, FaCaretUp, FaSortDown } from 'react-icons/fa';
import axios from 'axios';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart } from 'recharts';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserContext } from './context/context.jsx';

const COLORS = ['#0088FE', '#00C49F', '#eab308', '#FF8042'];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="black" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const Projecthome = ({ projectid, onSlectedProject, graphLoading }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [projectTasks, setProjectTasks] = useState([]);
  const [error, setError] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [projectData, setProjectData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const { setContextProjectId } = useContext(UserContext);
  const [selectedProjectname, setSelectedProjectname] = useState(null);
  const [selectedProjectmethodology, setSelectedProjectmethodology] = useState(null);
  const dropdownMenuRef = useRef();
  const btnref = useRef();
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [taskSummary, setTaskSummary] = useState({ toDo: 0, inProgress: 0, done: 0, percentages: {} });
  const [assigneeData, setAssigneeData] = useState([]);

  // IndexedDB Utility Functions
  const dbName = 'ProjectTasksDB';
  const storeName = 'tasks';

  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'projectId' });
        }
      };
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  const saveTasksToDB = async (projectId, tasks) => {
    const db = await openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put({ projectId, tasks });
  };

  const getTasksFromDB = async (projectId) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(projectId);
      request.onsuccess = (event) => {
        resolve(event.target.result ? event.target.result.tasks : null);
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  const processIssuesData = useCallback((issues) => {
    const categoryCounts = { toDo: 0, inProgress: 0, done: 0 };
    const assigneeCounts = {};

    const processedData = issues.map((issue) => {
      const statusCategory = issue.fields.status?.statusCategory?.name || 'Unknown';
      let priority = issue.fields.priority?.name || 'None';
      let progressPercentage = 0;
      const assignee = issue.fields.assignee?.displayName || 'Unassigned';

      // Treat "High", "Highest", and "Critical" as the same priority
      if (["High", "Highest", "Critical"].includes(priority)) {
        priority = "High";
      }

      if (statusCategory.trim().toLowerCase() === 'to do') {
        progressPercentage = 15;
        categoryCounts.toDo += 1;
      } else if (statusCategory.trim().toLowerCase() === 'in progress') {
        progressPercentage = 50;
        categoryCounts.inProgress += 1;
      } else if (statusCategory.trim().toLowerCase() === 'done') {
        progressPercentage = 100;
        categoryCounts.done += 1;
      }

      if (!assigneeCounts[assignee]) {
        assigneeCounts[assignee] = 0;
      }
      assigneeCounts[assignee] += 1;

      return {
        name: issue.fields.summary || 'Unknown',
        progress: progressPercentage,
        status: statusCategory,
        priority,
        statusCategory,
        assignee,
      };
    });

    const totalTasks = categoryCounts.toDo + categoryCounts.inProgress + categoryCounts.done;
    const percentages = {
      toDo: ((categoryCounts.toDo / totalTasks) * 100).toFixed(2),
      inProgress: ((categoryCounts.inProgress / totalTasks) * 100).toFixed(2),
      done: ((categoryCounts.done / totalTasks) * 100).toFixed(2),
    };

    setTaskSummary({ ...categoryCounts, percentages });
    setAssigneeData(Object.entries(assigneeCounts).map(([name, count]) => ({ name, value: count })));
    return processedData;
  }, []);

  const fetchTasks = useCallback(async (projectId) => {
    const storedProjectId = localStorage.getItem('selectedProjectId') || projectId;

    if (storedProjectId) {
      try {
        let allIssues = [];
        const maxResults = 50; // Increase the batch size
        const response = await axios.get(`http://localhost:4000/api/tasks?projectId=${storedProjectId}&startAt=0&maxResults=1`);
        const total = response.data.total;
        const batchCount = Math.ceil(total / maxResults);

        // Create an array of promises to fetch batches in parallel
        const fetchPromises = Array.from({ length: batchCount }, (_, index) => {
          const startAt = index * maxResults;
          return axios.get(`http://localhost:4000/api/tasks?projectId=${storedProjectId}&startAt=${startAt}&maxResults=${maxResults}`);
        });

        // Wait for all promises to resolve
        const responses = await Promise.all(fetchPromises);
        responses.forEach(response => {
          allIssues = [...allIssues, ...response.data.issues];
        });

        const processedData = processIssuesData(allIssues);
        console.log(processedData); 
        setProjectTasks(processedData);
        setGraphData(processedData);
        setIsLoading(false);
        localStorage.setItem('projectTasks', JSON.stringify(processedData));
        saveTasksToDB(storedProjectId, processedData); // Save to IndexedDB
        setProjectId(storedProjectId);
        return processedData;
      } catch (err) {
        toast.error('Error fetching data! Please check your internet connection.');
        console.error('Error fetching data:', err);

        const storedData = await getTasksFromDB(storedProjectId); // Get from IndexedDB
        if (storedData) {
          setProjectTasks(storedData);
          setGraphData(storedData);
          setIsLoading(false);
          return storedData;
        }
      }
    } else {
      toast.error('Please select a project to view tasks');
    }
  }, [processIssuesData]);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(e.target) &&
        btnref.current &&
        !btnref.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleProjectSelect = useCallback((project) => {
    setSelectedProject(project);
    setContextProjectId('fg');
    setSelectedProjectname(project.name);
    setSelectedProjectmethodology(project.key);
    setProjectId(project.id);
    setShowDropdown(false);

    setIsGraphLoading(true);
    fetchTasks(project.id).then((data) => {
      setGraphData(data);
      setTimeout(() => {
        setIsGraphLoading(false);
      }, 8000); // Display loader for an additional 8 seconds after data is fetched
    });

    localStorage.setItem('selectedProjectId', project.id);
    localStorage.setItem('selectedProjectname', project.name);
    localStorage.setItem('selectedProjectmethodology', project.key);
  }, [fetchTasks]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/projects');
      setProjectData(response.data);
    } catch (err) {
      toast.error('Failed to fetch projects.');
      console.error('Error fetching projects:', err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    const storedProjectId = localStorage.getItem('selectedProjectId');
    if (storedProjectId) {
      const storedProjectname = localStorage.getItem('selectedProjectname');
      const storedProjectmethodology = localStorage.getItem('selectedProjectmethodology');
      setSelectedProjectname(storedProjectname);
      setSelectedProjectmethodology(storedProjectmethodology);
      fetchTasks(storedProjectId);
    }
  }, [fetchProjects, fetchTasks]);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  const pieChartData = useMemo(() => [
    { name: 'To Do', value: taskSummary.toDo, priority: 'Low' },
    { name: 'In Progress', value: taskSummary.inProgress, priority: 'Medium' },
    { name: 'Done', value: taskSummary.done, priority: 'High' },
  ], [taskSummary]);

  const priorityChartData = useMemo(() => [
    { name: 'Low', value: graphData.filter(task => task.priority === 'Low').length },
    { name: 'Medium', value: graphData.filter(task => task.priority === 'Medium').length },
    { name: 'High', value: graphData.filter(task => task.priority === 'High').length },
  ], [graphData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, progress, priority } = payload[0].payload;
      return (
        <div
          className="custom-tooltip"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#f8f8ff',
            padding: '10px',
            borderRadius: '5px',
          }}
        >
          <p className="label">{`Issue: ${name}`}</p>
          <p className="label">{`Progress: ${progress}%`}</p>
          <p className="label">{`Priority: ${priority}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-col lg:flex-row h-full p-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Project Details</h1>
          {selectedProjectname && selectedProjectmethodology ? (
            <div className="text-white">
              <p>
                <span className="font-bold">Project Name:</span> {selectedProjectname}
              </p>
              <p>
                <span className="font-bold">Project Methodology:</span> {selectedProjectmethodology}
              </p>
            </div>
          ) : (
            <p className="text-white">Please select a project to see the details.</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-9 min-w-max mt-4">
            {isGraphLoading ? (
              <>
                <div className="flex flex-col items-center h-36 w-full sm:w-48 md:w-full cursor-pointer transition-all duration-500 hover:translate-y-2 text-white bg-black bg-opacity-40 backdrop-filter backdrop-blur-sm rounded-3xl animate-pulse">
                  <div className="h-12 w-12 bg-gray-300 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold mt-2">Loading...</span>
                </div>
                <div className="flex flex-col items-center h-36 w-full sm:w-48 md:w-full cursor-pointer transition-all duration-500 hover:translate-y-2 text-white bg-black bg-opacity-40 backdrop-filter backdrop-blur-sm rounded-3xl animate-pulse">
                  <div className="h-12 w-12 bg-gray-300 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold mt-2">Loading...</span>
                </div>
                <div className="flex flex-col items-center h-36 w-full sm:w-48 md:w-full cursor-pointer transition-all duration-500 hover:translate-y-2 text-white bg-black bg-opacity-40 backdrop-filter backdrop-blur-sm rounded-3xl animate-pulse">
                  <div className="h-12 w-12 bg-gray-300 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold mt-2">Loading...</span>
                </div>
                <div className="flex flex-col items-center h-36 w-full sm:w-48 md:w-full cursor-pointer transition-all duration-500 hover:translate-y-2 text-white bg-black bg-opacity-40 backdrop-filter backdrop-blur-sm rounded-3xl animate-pulse">
                  <div className="h-12 w-12 bg-gray-300 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold mt-2">Loading...</span>
                </div>
              </>
            ) : (
              <>
                <TaskInfoBox
                  title="Total Tasks"
                  value={taskSummary.toDo + taskSummary.inProgress + taskSummary.done}
                  icon={<FaTasks className="text-4xl text-yellow-600" />}
                />
                <TaskInfoBox
                  title="To Do Tasks"
                  value={taskSummary.toDo}
                  icon={<FaClipboardList className="text-4xl text-red-600" />}
                />
                <TaskInfoBox
                  title="In Progress Tasks"
                  value={taskSummary.inProgress}
                  icon={<FaHourglassStart className="text-4xl text-blue-600" />}
                />
                <TaskInfoBox
                  title="Done Tasks"
                  value={taskSummary.done}
                  icon={<FaCheckCircle className="text-4xl text-green-600" />}
                />
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 mt-6 lg:mt-0 lg:ml-4 relative">
          <button
            className="flex items-center w-[9rem] pl-2 text-base mt-14 font-serif text-white bg-purple-900 border-none rounded-md hover:bg-purple-950"
            onClick={toggleDropdown}
            ref={btnref}
          >
            Select Project
            {showDropdown ? <FaCaretUp className="ml-1" /> : <FaSortDown className="ml-1" />}
          </button>
          {showDropdown && (
            <div
              ref={dropdownMenuRef}
              className="absolute right-0 mt-2 h-36 w-48 p-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border border-gray-300 rounded-lg shadow-lg overflow-auto"
            >
              <ul className="grid gap-2">
                {projectData.length > 0 ? (
                  projectData.map((project) => (
                    <li
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className="px-4 py-2 text-center bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-lg cursor-pointer"
                    >
                      {project.name || "Unnamed Project"}
                    </li>
                  ))
                ) : (
                  <li className="text-center text-gray-500">Loading</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      {isGraphLoading || isLoading ? (
        <div className="loader">
          <div className="bg-gray-300 h-64 w-full rounded-md animate-pulse mb-20">
            <p className="flex items-center justify-center h-full font-serif font font-bold">
              {isLoading ? 'Loading' : 'Loading'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-0 bg-black bg-opacity-40 backdrop-filter backdrop-blur-sm rounded-lg pt-1 overflow-y-scroll scrollbar-hide">
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 bg-transparent p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-center mb-4 text-white">Task Progress Breakdown</h2>
            <div className="overflow-x-scroll scrollbar-hide">
              {isGraphLoading ? (
                <div className="h-64 w-full  bg-gray-300 rounded-md animate-pulse"></div>
              ) : (
                <ResponsiveContainer width={graphData.length * 13} height={300}>
                  <ComposedChart
                    data={graphData}
                    margin={{
                      top: 0,
                      right: 20,
                      bottom: 2,
                      left: 2,
                    }}
                  >
                    <CartesianGrid stroke="#1c2d41" />
                    <XAxis stroke="#fffafa" dataKey="" />
                    <YAxis stroke="#fffafa" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="progress"
                      fill="#e6e6fa"
                      stroke="#e6e6fa"
                    />
                    <Bar dataKey="progress" barSize={15} fill="#0000CD" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 bg-transparent text-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-center mb-4">Total Progress</h2>
            <div className="overflow-y-scroll scrollbar-hide">
              {isGraphLoading ? (
                <div className="h-64 w-full bg-gray-300 rounded-md animate-pulse"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="55%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.priority === "High"
                              ? "#32cd32"
                              : entry.priority === "Medium"
                              ? "#eab308"
                              : "#FF0000"
                          }
                        />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3 bg-transparent text-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-center mb-4">Priority Breakdown</h2>
            <div className="overflow-y-scroll scrollbar-hide">
              {isGraphLoading ? (
                <div className="h-64 w-full bg-gray-300 rounded-md animate-pulse"></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={priorityChartData}
                    margin={{
                      top: 0,
                      right: 20,
                      bottom: 2,
                      left: 2,
                    }}
                  >
                    <CartesianGrid stroke="#1c2d41" />
                    <XAxis stroke="#fffafa" dataKey="name" />
                    <YAxis stroke="#fffafa" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#f600f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 bg-transparent p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-center mb-4 text-white">Assignee Breakdown</h2>
            <div className="overflow-x-scroll scrollbar-hide">
              {isGraphLoading ? (
                <div className="h-64 w-full bg-gray-300 rounded-md animate-pulse"></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={assigneeData}
                    margin={{
                      top: 0,
                      right: 20,
                      bottom: 2,
                      left: 2,
                    }}
                  >
                    <CartesianGrid stroke="#1c2d41" />
                    <XAxis stroke="#fffafa" dataKey="name" />
                    <YAxis stroke="#fffafa" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#68a17d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskInfoBox = ({ title, value, icon }) => (
  <div className="flex flex-col items-center h-36 w-full sm:w-48 md:w-full cursor-pointer transition-all duration-500 hover:translate-y-2 text-white bg-black bg-opacity-40 backdrop-filter backdrop-blur-sm rounded-3xl">
    {icon}
    <span className="text-lg font-semibold">{title}</span>
    <span className="text-3xl font-bold text-green-500 mt-2">{value}</span>
  </div>
);

export default Projecthome;