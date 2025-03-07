import React, { useState } from 'react';
import { FaTasks, FaListAlt, FaProjectDiagram, FaChartPie } from 'react-icons/fa';

function Reports() {
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

  const handleCalculate = (reportType) => {
    setIsLoading((prev) => ({ ...prev, [reportType]: true }));
    // Simulate calculation logic with a timeout
    setTimeout(() => {
      setIsCalculated((prev) => ({ ...prev, [reportType]: true }));
      setIsLoading((prev) => ({ ...prev, [reportType]: false }));
    }, 2000);
  };

  const handleDownload = (reportType) => {
    if (isCalculated[reportType]) {
      // Perform download logic here
      console.log(`Downloading ${reportType} report...`);
    }
  };

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FaTasks className="mr-2" /> Task Summary Report
        </h2>
        <button 
          onClick={() => handleCalculate('taskSummary')} 
          className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded-2xl mt-4 transition duration-300 flex items-center justify-center"
          disabled={isLoading.taskSummary}
        >
          {isLoading.taskSummary ? 'Calculating...' : 'Calculate'}
          {isLoading.taskSummary && <div className="loader ml-2"></div>}
        </button>
        <button 
          onClick={() => handleDownload('taskSummary')} 
          className={`bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 transition duration-300 ${!isCalculated.taskSummary ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isCalculated.taskSummary}
        >
          Download
        </button>
      </div>

      <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FaListAlt className="mr-2" /> Task Details Report
        </h2>
        <button 
          onClick={() => handleCalculate('taskDetails')} 
          className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded mt-4 transition duration-300 flex items-center justify-center"
          disabled={isLoading.taskDetails}
        >
          {isLoading.taskDetails ? 'Calculating...' : 'Calculate'}
          {isLoading.taskDetails && <div className="loader ml-2"></div>}
        </button>
        <button 
          onClick={() => handleDownload('taskDetails')} 
          className={`bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 transition duration-300 ${!isCalculated.taskDetails ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isCalculated.taskDetails}
        >
          Download
        </button>
      </div>

      <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FaProjectDiagram className="mr-2" /> Project Progress Report
        </h2>
        <button 
          onClick={() => handleCalculate('projectProgress')} 
          className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded mt-4 transition duration-300 flex items-center justify-center"
          disabled={isLoading.projectProgress}
        >
          {isLoading.projectProgress ? 'Calculating...' : 'Calculate'}
          {isLoading.projectProgress && <div className="loader ml-2"></div>}
        </button>
        <button 
          onClick={() => handleDownload('projectProgress')} 
          className={`bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 transition duration-300 ${!isCalculated.projectProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isCalculated.projectProgress}
        >
          Download
        </button>
      </div>

      <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FaChartPie className="mr-2" /> Graphical Reports
        </h2>
        <button 
          onClick={() => handleCalculate('graphicalReports')} 
          className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded mt-4 transition duration-300 flex items-center justify-center"
          disabled={isLoading.graphicalReports}
        >
          {isLoading.graphicalReports ? 'Calculating...' : 'Calculate'}
          {isLoading.graphicalReports && <div className="loader ml-2"></div>}
        </button>
        <button 
          onClick={() => handleDownload('graphicalReports')} 
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
