import { useEffect, useState } from 'react';
import { FaTasks, FaMagic, FaCalendarAlt, FaFlag, FaUser, FaTag, FaEye, FaArrowCircleLeft, FaInfoCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import additional Firebase auth utilities

const RADIAN = Math.PI / 180;

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

const Tasks = () => {
  const [storedProjectId, setStoredProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [viewDetails, setViewDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState(null);
  const [selectedTaskcomments, setSelectedTaskComments] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [authToken, setAuthToken] = useState('');
  const [authLoading, setAuthLoading] = useState(true); // Add auth loading state
  const [authError, setAuthError] = useState(null); // Add auth error state

  // Improved auth token handling
  useEffect(() => {
    const auth = getAuth();
    setAuthLoading(true);
    
    // Use Firebase's onAuthStateChanged for more reliable auth state tracking
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          console.log("User authenticated, getting token...");
          const token = await user.getIdToken(true); // Force token refresh
          console.log("Token obtained successfully");
          setAuthToken(token);
          setAuthError(null);
        } catch (error) {
          console.error('Error getting auth token:', error);
          setAuthError(error.message);
        } finally {
          setAuthLoading(false);
        }
      } else {
        console.log("No user is signed in");
        setAuthToken('');
        setAuthError('User not authenticated');
        setAuthLoading(false);
      }
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const fetchTask = async () => {
    if (!authToken) {
      console.error("Cannot fetch tasks - no auth token available");
      return;
    }
    
    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) {
      console.error("No project ID found in localStorage");
      return;
    }
    
    console.log("Fetching tasks with auth token", authToken.substring(0, 10) + "...");
    setStoredProjectId(projectId);
    setLoading(true);
    
    try {
      let allIssues = [];
      const maxResults = 50;
      
      // Include the auth token in the request headers
      const headers = {
        'Authorization': `Bearer ${authToken}`
      };
      
      console.log("Making initial API request to get task count");
      const response = await axios.get(`http://localhost:4000/api/tasks?projectId=${projectId}&startAt=0&maxResults=1`, { headers });
      
      const total = response.data.total;
      console.log(`Found ${total} total tasks, fetching in batches`);
      
      const batchCount = Math.ceil(total / maxResults);

      // Create an array of promises to fetch batches in parallel
      const fetchPromises = Array.from({ length: batchCount }, (_, index) => {
        const startAt = index * maxResults;
        return axios.get(`http://localhost:4000/api/tasks?projectId=${projectId}&startAt=${startAt}&maxResults=${maxResults}`, { headers });
      });

      // Wait for all promises to resolve
      const responses = await Promise.all(fetchPromises);
      responses.forEach(response => {
        allIssues = [...allIssues, ...response.data.issues];
      });
      
      console.log(`Successfully fetched ${allIssues.length} tasks`);
      setTasks(allIssues);
      setLoading(false);
      saveTasksToDB(projectId, allIssues); // Save to IndexedDB
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      setLoading(false);
      alert('Failed to fetch tasks. Please try again.');

      // Try to load from IndexedDB as fallback
      try {
        const storedData = await getTasksFromDB(projectId);
        if (storedData) {
          console.log("Loading tasks from IndexedDB");
          setTasks(storedData);
        }
      } catch (dbError) {
        console.error("Error loading from IndexedDB:", dbError);
      }
    }
  };

  // Only trigger fetchTask when authToken is available and not loading
  useEffect(() => {
    if (authToken && !authLoading) {
      fetchTask();
    }
  }, [authToken, authLoading]);

  useEffect(() => {
    const storedTask = localStorage.getItem('selectedTask');
    if (storedTask) {
      const parsedTask = JSON.parse(storedTask);
      setSelectedTask(parsedTask);
      // Remove setting viewDetails to true
    }
  }, []);

  const handleMagicDatePredictClick = () => {
    console.log('Magic Date Predict Clicked');
  };

  const calculateProgress = (tasks) => {
    const totalTasks = tasks.length;
    const statusWeights = {
      'to do': 0,
      'in progress': 0.5,
      'done': 1,
      'launched': 1,
      'ready for launch': 1
    };

    const totalProgress = tasks.reduce((acc, task) => {
      const status = task.fields.status.name.toLowerCase();
      return acc + (statusWeights[status] || 0);
    }, 0);

    return (totalProgress / totalTasks) * 100;
  };

  const calculateTaskProgress = (task) => {
    const statusWeights = {
      'to do': 0,
      'in progress': 0.5,
      'done': 1,
      'launched': 1,
      'ready for launch': 1
    };

    const status = task.fields.status.name.toLowerCase();
    return (statusWeights[status] || 0) * 100;
  };

  const getProgressData = (task) => {
    if (!task || !task.fields) {
      return [
        { name: 'To Do', value: 0, color: '#ff0000' },
        { name: 'In Progress', value: 0, color: '#0000ff' },
        { name: 'Done', value: 0, color: '#00ff00' }
      ];
    }
  
    if (task.fields.subtasks?.length > 0) {
      const totalSubtasks = task.fields.subtasks.length;
      const toDoCount = task.fields.subtasks.filter(subtask => subtask.fields.status.name.toLowerCase() === 'to do').length;
      const inProgressCount = task.fields.subtasks.filter(subtask => subtask.fields.status.name.toLowerCase() === 'in progress').length;
      const doneCount = task.fields.subtasks.filter(subtask => ['done', 'launched', 'ready for launch'].includes(subtask.fields.status.name.toLowerCase())).length;
  
      return [
        { name: 'To Do', value: (toDoCount / totalSubtasks) * 100, color: '#ff0000' },
        { name: 'In Progress', value: (inProgressCount / totalSubtasks) * 100, color: '#0000ff' },
        { name: 'Done', value: (doneCount / totalSubtasks) * 100, color: '#00ff00' }
      ];
    } else {
      const status = task.fields.status.name.toLowerCase();
      return [
        { name: 'To Do', value: status === 'to do' ? 100 : 0, color: '#ff0000' },
        { name: 'In Progress', value: status === 'in progress' ? 100 : 0, color: '#0000ff' },
        { name: 'Done', value: ['done', 'launched', 'ready for launch'].includes(status) ? 100 : 0, color: '#00ff00' }
      ];
    }
  };

  const handleTaskClick = async (task) => {
    if (!authToken) {
      console.error("Cannot fetch task details - no auth token available");
      alert('Authentication error. Please refresh the page and try again.');
      return;
    }
    
    console.log('Fetching task details API hit');
    setSelectedTask(task);
    setLoadingDetails(true);
    setLoadingTaskId(task.id);
    localStorage.setItem('selectedTask', JSON.stringify(task));
    
    try {
      // Include auth token in the requests
      const headers = {
        'Authorization': `Bearer ${authToken}`
      };
      
      const response = await axios.get(`http://localhost:4000/api/tasksdetails?taskId=${task.id}`, { headers });
      const responseofcomment = await axios.get(`http://localhost:4000/api/taskscomments?taskId=${task.id}`, { headers });
      
      console.log('Fetching task comments API hit');
      const taskDetails = response.data;
      const commentsdata = responseofcomment.data;
      setTaskDetails(taskDetails);
      setSelectedTaskComments(commentsdata);
      setViewDetails(true);
      setLoadingDetails(false);
      setLoadingTaskId(null);
    } catch (error) {
      console.error("Error fetching task details:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      setLoadingDetails(false);
      setLoadingTaskId(null);
      alert('Failed to fetch task details. Please try again.');
    }
  };

  const handleBackClick = () => {
    setViewDetails(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'to do':
        return 'bg-red-700';
      case 'in progress':
        return 'bg-blue-700';
      case 'done':
        return 'bg-green-700';
      default:
        return 'bg-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critical':
      case 'highest':
        return 'bg-red-700';
      case 'medium':
        return 'bg-yellow-700';
      case 'low':
      case 'lowest':
        return 'bg-green-700';
      default:
        return 'bg-gray-700';
    }
  };

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 2}
          outerRadius={outerRadius + 6}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#fff">
          {`( ${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  // Show authentication error if there is one
  if (authError && !authLoading) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Authentication Error</strong>
          <p className="block sm:inline">{authError}</p>
          <p className="mt-2">Please refresh the page or try signing in again.</p>
        </div>
      </div>
    );
  }

  // Show authentication loading state
  if (authLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-400 h-12 w-12 mb-4"></div>
          <div className="h-4 bg-gray-400 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-400 rounded w-1/3"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  const progressData = getProgressData(selectedTask);

  const cx = 150;
  const cy = 200;
  const iR = 50;
  const oR = 100;
  const value = calculateProgress(tasks);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-10 p-6 ">
        {/* Skeleton loaders */}
        {[...Array(9)].map((_, index) => (
          <div key={index} className="flex flex-col bg-gray-300 rounded-3xl p-4 shadow-lg animate-pulse">
            <div className="h-6 bg-gray-400 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-400 rounded w-1/2 mb-4"></div>
            <div className="h-6 bg-gray-400 rounded w-full"></div>
            <div className="h-4 bg-gray-400 rounded w-1/2 mt-2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      {viewDetails ? (
        loadingDetails ? (
          <div>
            <button
              className="mb-4 cursor-pointer text-white shadow-md shadow-purple-800 rounded-full px-5 py-2 bg-gradient-to-bl from-purple-200 to-purple-300 hover:bg-purple-950"
              onClick={handleBackClick}
            >
              Back to Tasks
            </button>
            <div className="flex flex-col bg-gray-300 rounded-3xl  shadow-lg animate-pulse">
              <div className="h-2 bg-gray-400 rounded w-3/4 "></div>
              <div className="h-2 bg-gray-400 rounded w-1/2 "></div>
              <div className="h-2 bg-gray-400 rounded w-1/2"></div>
              <div className="h-2 bg-gray-400 rounded w-1/2 "></div>
            </div>
          </div>
        ) : (
          <div>
            <button
              className="mb-4 px-4 py-2 text-white bg-purple-900 rounded-full hover:bg-purple-950 flex items-center"
              onClick={handleBackClick}
            >
              <FaArrowCircleLeft className="mr-2" /> Back to Tasks
            </button>
            <div className="bg-black bg-opacity-40 h-auto backdrop-filter backdrop-blur-sm rounded-3xl p-6 relative">
              <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 px-4 py-2 font-semibold rounded-b-3xl ${getStatusColor(taskDetails?.fields?.status?.statusCategory?.name)}`}>
                <span className="px-2 py-1 text-xs font-semibold text-white">
                  {taskDetails?.fields?.status?.statusCategory?.name}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Task Details</h2>
                <button
                  className="px-4 py-2 text-white bg-purple-900 rounded-full hover:bg-purple-950 flex items-center"
                  onClick={handleMagicDatePredictClick}
                >
                  <FaMagic className="mr-2 text-yellow-500" /> Magic Date Predict
                </button>
              </div>
              <div className="text-white grid grid-cols-2 gap-4">
                <div>
                  <p><FaTasks className="inline text-yellow-500 mr-2" /><strong>Name: </strong> {selectedTask?.fields?.summary}</p>
                  <p><FaCalendarAlt className="inline text-blue-500 mr-2" /><strong>Created: </strong> {taskDetails?.fields?.created ? moment(taskDetails.fields.created).format('MMMM Do YYYY, h:mm:ss a') : 'Date is not selected'}</p>
                  <p><FaCalendarAlt className="inline text-red-500 mr-2" /><strong>Due Date: </strong> {taskDetails?.fields?.duedate ? moment(taskDetails.fields.duedate).format('MMMM Do YYYY, h:mm:ss a') : 'Date is not selected'}</p>
                  <p><FaFlag className="inline text-green-500 mr-2 " /><strong>Priority: </strong> {taskDetails?.fields?.priority?.name ? taskDetails?.fields?.priority?.name : "No Name"}</p>
                </div>
                <div>
                  <p><FaUser className="inline text-purple-500 mr-2" /><strong>Assignee: </strong> {taskDetails?.fields?.assignee?.displayName ? taskDetails?.fields?.assignee?.displayName : 'No Assignee'}</p>
                  <p><FaTag className="inline text-orange-500 mr-2" /><strong>Label: </strong> {taskDetails?.fields.labels ? taskDetails?.fields.labels : 'No labels'}</p>
                  <p><FaEye className="inline text-teal-500 mr-2" /><strong>Last viewed: </strong> {taskDetails?.fields?.lastViewed ? moment(taskDetails.fields.lastViewed).format('MMMM Do YYYY, h:mm:ss a') : 'Date is not selected'}</p>
                  <div className="mt-1 h-52 ">
                    <div className="rounded-sm text-black w-full p-2">
                      <ResponsiveContainer width="100%" height={184}>
                        <PieChart>
                          <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={progressData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={50}
                            fill="#8884d8"
                            dataKey="value"
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                          >
                            {progressData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-0 border-t-2 border-t-slate-400 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white ">Comments</h3>
                  <div className="rounded-lg text-black w-full h-20 p-2 overflow-y-scroll bg-white">
                    {selectedTaskcomments?.comments?.length > 0 ? (
                      selectedTaskcomments.comments.map((comment, index) => (
                        <div key={index} className="mb-2 flex items-start space-x-2">
                          <img src={comment.author.avatarUrls['16x16']} alt="avatar" className="w-5 h-5 rounded-full" />
                          <div>
                            <p className="font-bold">{comment.author.displayName}</p>
                            <p>{comment.body.content.map(content => content.content.map(text => text.text).join(' ')).join(' ')}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-900">No messages 🥺</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white ">Subtasks</h3>
                  <div className="rounded-lg text-black w-full h-20 p-2 overflow-y-scroll bg-white">
                    {taskDetails?.fields?.subtasks?.length > 0 ? (
                      taskDetails.fields.subtasks.map((subtask, index) => (
                        <div key={index} className="mb-2 grid grid-flow-col grid-cols-2">
                          <p className="font-bold"><FaTasks className="inline text-yellow-500 mr-2" />{subtask.fields.summary || 'No Summary'}</p>
                          <p><FaFlag className="inline text-green-500 mr-2" /> {subtask.fields.status.name || 'No Status'}</p>
                          <p><FaTag className="inline text-orange-500 mr-2" /> {subtask.fields.priority?.name || 'No Priority'}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-900">No subtasks available 😓</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 overflow-y-scroll h-[83vh]">
          {Object.entries(tasks).map(([key, item]) => (
            <div
              key={key}
              className="relative flex flex-col bg-black bg-opacity-40 backdrop-filter backdrop-blur-sm rounded-3xl p-4 shadow-lg h-auto shadow-white"
              onClick={() => handleTaskClick(item)}
            >
              <div className="absolute top-0 left-0 right-0 transform ">
                <span className={`px-2 py-1 text-xs font-semibold text-white rounded-b-lg ${getPriorityColor(item?.fields?.priority?.name)}`}>
                  {item?.fields?.priority?.name}
                </span>
              </div>
              <div className="absolute top-0 right-0 transform ">
                <span className={`px-2 py-1 text-xs font-semibold text-white rounded rounded-b-lg ${getStatusColor(item?.fields?.status?.statusCategory?.name)}`}>
                  {item?.fields?.status?.statusCategory?.name}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <h2 className="text-lg font-medium tracking-tighter text-white">{item?.fields?.summary}</h2>
              </div>
              <button
                className="cursor-pointer text-white mt-5 w-40 shadow-md shadow-purple-800 rounded-full px-5 py-2 bg-gradient-to-bl from-purple-700 to-purple-900 hover:bg-purple-950 flex items-center"
                onClick={(e) => { 
                  e.stopPropagation(); // Prevent the button click from triggering the card click
                  setLoadingDetails(true);
                  setLoadingTaskId(item.id);
                  handleTaskClick(item);
                }}
              >
                <FaInfoCircle className="mr-2" /> {loadingTaskId === item.id ? 'Loading...' : 'See Details'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
