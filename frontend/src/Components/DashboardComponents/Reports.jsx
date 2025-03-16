import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FaTasks, FaListAlt, FaProjectDiagram, FaChartPie } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function Reports() {
  const pieChartRef = useRef(null);
  
  const [isCalculated, setIsCalculated] = useState({
    taskSummary: false,
    taskDetails: false,
    projectProgress: false,
    graphicalReports: false,
  });

  const [isLoading, setIsLoading] = useState({
    taskSummary: false,
    taskDetails: false,
    projectProgress: false,
    graphicalReports: false,
  });

  const [projectName, setProjectName] = useState('');

  const [taskCounts, setTaskCounts] = useState({
    total: 0,
    toDo: 0,
    inProgress: 0,
    done: 0,
  });

  const [assigneeCounts, setAssigneeCounts] = useState({
    total: 0,
    names: [],
  });

  useEffect(() => {
    const storedProjectName = localStorage.getItem('selectedProjectname');
    if (storedProjectName) {
      setProjectName(storedProjectName);
    }
  }, []);

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

  const fetchTasks = useCallback(async (projectId) => {
    const storedProjectId = localStorage.getItem('selectedProjectId') || projectId;
    if (storedProjectId) {
      try {
        const storedData = await getTasksFromDB(storedProjectId);
        console.log('Fetched tasks from DB:', storedData); // Debugging log
        return storedData;
      } catch (err) {
        console.error('Error fetching data:', err);
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const calculateTaskCounts = async () => {
      const projectId = localStorage.getItem('selectedProjectId');
      const tasks = await fetchTasks(projectId);
      if (tasks) {
        const total = tasks.length;
        const toDo = tasks.filter(task => task.status === 'To Do').length;
        const inProgress = tasks.filter(task => task.status === 'In Progress').length;
        const done = tasks.filter(task => task.status === 'Done').length;
        setTaskCounts({ total, toDo, inProgress, done });
      }
    };
    calculateTaskCounts();
  }, [fetchTasks]);

  useEffect(() => {
    const calculateAssigneeCounts = async () => {
      const projectId = localStorage.getItem('selectedProjectId');
      const tasks = await fetchTasks(projectId);
      if (tasks) {
        const assignees = tasks.map(task => task.assignee).filter(Boolean);
        const uniqueAssignees = [...new Set(assignees)];
        setAssigneeCounts({ total: uniqueAssignees.length, names: uniqueAssignees });
      }
    };
    calculateAssigneeCounts();
  }, [fetchTasks]);

  const fetchProjectDetails = async () => {
    const projectId = localStorage.getItem('selectedProjectId');
    const projectName = localStorage.getItem('selectedProjectname');
    const projectMethodology = localStorage.getItem('selectedProjectmethodology');
    const tasks = await fetchTasks(projectId);
    let taskCounts = { total: 0, toDo: 0, inProgress: 0, done: 0 };
    let assigneeCounts = { total: 0, names: [] };

    if (tasks) {
      taskCounts.total = tasks.length;
      taskCounts.toDo = tasks.filter(task => task.status === 'To Do').length;
      taskCounts.inProgress = tasks.filter(task => task.status === 'In Progress').length;
      taskCounts.done = tasks.filter(task => task.status === 'Done').length;

      const assignees = tasks.map(task => task.assignee).filter(Boolean);
      const uniqueAssignees = [...new Set(assignees)];
      assigneeCounts.total = uniqueAssignees.length;
      assigneeCounts.names = uniqueAssignees;
    }

    return { projectName, projectMethodology, taskCounts, assigneeCounts };
  };

  const calculateTaskSummary = async () => {
    setIsLoading((prev) => ({ ...prev, taskSummary: true }));
    await fetchProjectDetails();
    setTimeout(() => {
      setIsCalculated((prev) => ({ ...prev, taskSummary: true }));
      setIsLoading((prev) => ({ ...prev, taskSummary: false }));
    }, 2000);
  };

  const calculateTaskDetails = async () => {
    setIsLoading((prev) => ({ ...prev, taskDetails: true }));
    await fetchProjectDetails();
    setTimeout(() => {
      setIsCalculated((prev) => ({ ...prev, taskDetails: true }));
      setIsLoading((prev) => ({ ...prev, taskDetails: false }));
    }, 2000);
  };

  const calculateProjectProgress = async () => {
    setIsLoading((prev) => ({ ...prev, projectProgress: true }));
    const details = await fetchProjectDetails();
    localStorage.setItem('projectProgressReport', JSON.stringify(details));
    setTimeout(() => {
      setIsCalculated((prev) => ({ ...prev, projectProgress: true }));
      setIsLoading((prev) => ({ ...prev, projectProgress: false }));
    }, 2000);
  };

  const calculateGraphicalReports = async () => {
    setIsLoading((prev) => ({ ...prev, graphicalReports: true }));
    await fetchProjectDetails();
    setTimeout(() => {
      setIsCalculated((prev) => ({ ...prev, graphicalReports: true }));
      setIsLoading((prev) => ({ ...prev, graphicalReports: false }));
    }, 2000);
  };

  const downloadReport = async (reportType) => {
    if (isCalculated[reportType]) {
      const details = JSON.parse(localStorage.getItem('projectProgressReport'));
      if (details) {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setTextColor(255, 0, 0);
        doc.text(`${reportType.replace(/([A-Z])/g, ' $1').trim()} Report`, 105, 10, null, null, 'center');

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 255);
        doc.text('Project Details', 10, 20);
        doc.setTextColor(0, 0, 0);
        doc.text(`Project Name: ${details.projectName}`, 10, 30);
        doc.text(`Project Methodology: ${details.projectMethodology}`, 10, 40);

        doc.setTextColor(0, 0, 255);
        doc.text('Task Counts', 10, 50);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Tasks: ${details.taskCounts.total}`, 10, 60);
        doc.text(`To Do: ${details.taskCounts.toDo}`, 10, 70);
        doc.text(`In Progress: ${details.taskCounts.inProgress}`, 10, 80);
        doc.text(`Done: ${details.taskCounts.done}`, 10, 90);

        doc.setTextColor(0, 0, 255);
        doc.text('Assignee Details', 10, 100);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Assignees: ${details.assigneeCounts.total}`, 10, 110);
        doc.text(`Assignees: ${details.assigneeCounts.names.join(', ')}`, 10, 120);

        if (reportType === 'taskSummary' && pieChartRef.current) {
          try {
            const canvas = await html2canvas(pieChartRef.current, {
              backgroundColor: null,
              scale: 2,
              width: 800,  // Increased width
              height: 400  // Adjusted height
            });
            
            const chartImage = canvas.toDataURL('image/png');
            
            doc.setTextColor(0, 0, 255);
            doc.text('Task Distribution', 10, 130);
            
            // Adjusted dimensions for wider chart
            doc.addImage(chartImage, 'PNG', 10, 140, 190, 120);
          } catch (error) {
            console.error('Error converting chart to image:', error);
          }
        }

        doc.save(`${reportType}.pdf`);
      } else {
        console.error('No project progress report found in localStorage');
      }
    }
  };

  const pieChartData = [
    { name: 'To Do', value: taskCounts.toDo },
    { name: 'In Progress', value: taskCounts.inProgress },
    { name: 'Done', value: taskCounts.done },
  ];

  return (
    <>
      {/* Invisible container for PDF chart generation */}
      <div className="p-6" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        <div ref={pieChartRef}>
          <ResponsiveContainer width={800} height={400}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg border border-gray-300">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaTasks className="mr-2" /> Task Summary Report
          </h2>
          <button 
            onClick={calculateTaskSummary} 
            className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded-2xl mt-4 transition duration-300 flex items-center justify-center"
            disabled={isLoading.taskSummary}
          >
            {isLoading.taskSummary ? 'Calculating...' : 'Calculate'}
            {isLoading.taskSummary && <div className="loader ml-2"></div>}
          </button>
          <button 
            onClick={() => downloadReport('taskSummary')} 
            className={`bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 transition duration-300 ${!isCalculated.taskSummary ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isCalculated.taskSummary}
          >
            Download
          </button>
        </div>

        <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg border border-gray-300">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaListAlt className="mr-2" /> Task Details Report
          </h2>
          <button 
            onClick={calculateTaskDetails} 
            className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded mt-4 transition duration-300 flex items-center justify-center"
            disabled={isLoading.taskDetails}
          >
            {isLoading.taskDetails ? 'Calculating...' : 'Calculate'}
            {isLoading.taskDetails && <div className="loader ml-2"></div>}
          </button>
          <button 
            onClick={() => downloadReport('taskDetails')} 
            className={`bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 transition duration-300 ${!isCalculated.taskDetails ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isCalculated.taskDetails}
          >
            Download
          </button>
        </div>

        <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg border border-gray-300">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaProjectDiagram className="mr-2" /> Project Progress Report
          </h2>
          <button 
            onClick={calculateProjectProgress} 
            className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded mt-4 transition duration-300 flex items-center justify-center"
            disabled={isLoading.projectProgress}
          >
            {isLoading.projectProgress ? 'Calculating...' : 'Calculate'}
            {isLoading.projectProgress && <div className="loader ml-2"></div>}
          </button>
          <button 
            onClick={() => downloadReport('projectProgress')} 
            className={`bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 transition duration-300 ${!isCalculated.projectProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isCalculated.projectProgress}
          >
            Download
          </button>
        </div>

        <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg border border-gray-300">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaChartPie className="mr-2" /> Graphical Reports
          </h2>
          <button 
            onClick={calculateGraphicalReports} 
            className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded mt-4 transition duration-300 flex items-center justify-center"
            disabled={isLoading.graphicalReports}
          >
            {isLoading.graphicalReports ? 'Calculating...' : 'Calculate'}
            {isLoading.graphicalReports && <div className="loader ml-2"></div>}
          </button>
          <button 
            onClick={() => downloadReport('graphicalReports')} 
            className={`bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 transition duration-300 ${!isCalculated.graphicalReports ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isCalculated.graphicalReports}
          >
            Download
          </button>
        </div>
      </div>
    </>
  );
}

export default Reports;
