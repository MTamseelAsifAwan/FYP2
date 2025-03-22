// Import necessary dependencies
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FaTasks, FaListAlt, FaProjectDiagram, FaChartPie } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Ensure autoTable is imported correctly
import html2canvas from 'html2canvas';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the date adapter
Chart.register(...registerables);

// Add this helper function outside the Reports component
const generatePriorityBarChart = async (priorityCounts) => {
  const canvas = document.createElement('canvas');
  canvas.width = 500; // Increase canvas size
  canvas.height = 500; // Increase canvas size
  const ctx = canvas.getContext('2d');

  // Ensure all priority levels are included and filter out those with zero count
  const allPriorities = ['Critical', 'High', 'Very High', 'Medium High', 'Medium', 'Low', 'Very Low', 'None/Other', 'Lowest'];
  const filteredPriorityCounts = allPriorities.reduce((acc, priority) => {
    if (priorityCounts[priority] > 0) {
      acc[priority] = priorityCounts[priority];
    }
    return acc;
  }, {});

  const backgroundColors = {
    'Critical': '#FF0000',
    'High': '#D20103',
    'Very High': '#D20103',
    'Medium High': '#D20103',
    'Medium': '#E58A01',
    'Low': '#40E000',
    'Very Low': '#48ED07',
    'None/Other': '#33FFF3',
    'Lowest': '#53E11B'
  };

  return new Promise((resolve) => {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(filteredPriorityCounts).map(key => `${key} (${filteredPriorityCounts[key]})`),
        datasets: [{
          label: 'Priority Levels',
          data: Object.values(filteredPriorityCounts),
          backgroundColor: Object.keys(filteredPriorityCounts).map(key => backgroundColors[key]),
          borderWidth: 2,
          borderColor: '#ffffff',
          borderRadius: 10 // Add border radius
        }]
      },
      options: {
        responsive: false,
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#000000'
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#000000',
              callback: (value) => Number.isInteger(value) ? value : null // Show only integer values
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value * 100) / total).toFixed(1);
                return `${label}: ${percentage}%`;
              }
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#000000',
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value) => value
          }
        }
      }
    });

    // Convert to image after a slight delay to ensure rendering
    setTimeout(() => {
      resolve(canvas.toDataURL('image/png'));
    }, 500); // Increased delay to ensure full rendering
  });
};

const generateAssigneeBarChart = async (assigneeCounts) => {
  const canvas = document.createElement('canvas');
  canvas.width = 500; // Increase canvas size
  canvas.height = 500; // Increase canvas size
  const ctx = canvas.getContext('2d');

  return new Promise((resolve) => {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(assigneeCounts),
        datasets: [{
          label: 'Tasks Assigned',
          data: Object.values(assigneeCounts),
          backgroundColor: '#36A2EB',
          borderWidth: 1,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: false,
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#000000'
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#000000',
              callback: (value) => Number.isInteger(value) ? value : null // Show only integer values
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}`;
              }
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#000000',
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value) => value
          }
        }
      }
    });

    // Convert to image after a slight delay to ensure rendering
    setTimeout(() => {
      resolve(canvas.toDataURL('image/png'));
    }, 500); // Increased delay to ensure full rendering
  });
};

const generateTaskCompletionBarChart = async (taskCompletionData) => {
  const canvas = document.createElement('canvas');
  canvas.width = 500; // Increase canvas size
  canvas.height = 500; // Increase canvas size
  const ctx = canvas.getContext('2d');

  return new Promise((resolve) => {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: taskCompletionData.dates,
        datasets: [{
          label: 'Tasks Completed',
          data: taskCompletionData.counts,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: '#36A2EB',
          borderWidth: 2
        }]
      },
      options: {
        responsive: false,
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#000000'
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#000000',
              callback: (value) => Number.isInteger(value) ? value : null // Show only integer values
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          }
        },
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });

    // Convert to image after a slight delay to ensure rendering
    setTimeout(() => {
      resolve(canvas.toDataURL('image/png'));
    }, 500); // Increased delay to ensure full rendering
  });
};

const generateTaskCompletionLineChart = async (taskCompletionData) => {
  const canvas = document.createElement('canvas');
  canvas.width = 500; // Increase canvas size
  canvas.height = 500; // Increase canvas size
  const ctx = canvas.getContext('2d');

  return new Promise((resolve) => {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: taskCompletionData.dates,
        datasets: [{
          label: 'Tasks Completed',
          data: taskCompletionData.counts,
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          pointStyle: 'circle',
          pointRadius: 5,
          pointBackgroundColor: '#36A2EB',
          fill: true
        }]
      },
      options: {
        responsive: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day'
            },
            ticks: {
              color: '#000000'
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#000000',
              callback: (value) => Number.isInteger(value) ? value : null // Show only integer values
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          }
        },
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });

    // Convert to image after a slight delay to ensure rendering
    setTimeout(() => {
      resolve(canvas.toDataURL('image/png'));
    }, 500); // Increased delay to ensure full rendering
  });
};

const generateTaskCompletionAreaChart = async (taskCompletionData) => {
  const canvas = document.createElement('canvas');
  canvas.width = 500; // Increase canvas size
  canvas.height = 500; // Increase canvas size
  const ctx = canvas.getContext('2d');

  return new Promise((resolve) => {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: taskCompletionData.dates,
        datasets: [{
          label: 'Cumulative Tasks Completed',
          data: taskCompletionData.cumulativeCounts,
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderWidth: 2,
          pointStyle: 'circle',
          pointRadius: 5,
          pointBackgroundColor: '#FF6384',
          fill: true
        }]
      },
      options: {
        responsive: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day'
            },
            ticks: {
              color: '#000000'
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#000000',
              callback: (value) => Number.isInteger(value) ? value : null // Show only integer values
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          }
        },
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });

    // Convert to image after a slight delay to ensure rendering
    setTimeout(() => {
      resolve(canvas.toDataURL('image/png'));
    }, 500); // Increased delay to ensure full rendering
  });
};

const generateGanttChart = async (tasks) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1000; // Increase canvas size for better resolution
  canvas.height = tasks.length * 40 + 100; // Dynamically set height based on number of tasks
  const ctx = canvas.getContext('2d');

  // Custom Gantt chart rendering logic
  const taskHeight = 30;
  const taskSpacing = 10;
  const chartPadding = 50;
  const chartWidth = canvas.width - chartPadding * 2;
  const chartHeight = canvas.height - chartPadding * 2;
  const maxDate = new Date(Math.max(...tasks.map(task => new Date(task.endDate))));
  const minDate = new Date(Math.min(...tasks.map(task => new Date(task.startDate))));
  const dateRange = maxDate - minDate;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw x-axis (dates)
  ctx.fillStyle = '#000000';
  ctx.font = '12px Arial';
  const dateStep = dateRange / 10;
  for (let i = 0; i <= 10; i++) {
    const date = new Date(minDate.getTime() + i * dateStep);
    const x = chartPadding + (i * chartWidth) / 10;
    ctx.fillText(date.toISOString().split('T')[0], x - 20, chartPadding - 20);
    ctx.beginPath();
    ctx.moveTo(x, chartPadding - 10);
    ctx.lineTo(x, canvas.height - chartPadding);
    ctx.strokeStyle = '#e0e0e0';
    ctx.stroke();
  }

  tasks.forEach((task, index) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const taskStartX = chartPadding + ((taskStart - minDate) / dateRange) * chartWidth;
    const taskEndX = chartPadding + ((taskEnd - minDate) / dateRange) * chartWidth;
    const taskY = chartPadding + index * (taskHeight + taskSpacing);

    // Draw the bar with a border and highlight the completion portion
    ctx.fillStyle = '#36A2EB';
    ctx.fillRect(taskStartX, taskY, taskEndX - taskStartX, taskHeight);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(taskStartX, taskY, taskEndX - taskStartX, taskHeight);

    // Highlight the completion portion
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(taskEndX - 5, taskY, 5, taskHeight);

    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.fillText(task.name, 5, taskY + taskHeight / 1.5);
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(canvas.toDataURL('image/png'));
    }, 500); // Increased delay to ensure full rendering
  });
};

const calculateProjectProgress = async (setIsLoading, setIsCalculated) => {
  setIsLoading(prevState => ({ ...prevState, projectProgress: true }));

  try {
    const projectTasks = JSON.parse(localStorage.getItem('projectTasks'));
    if (!projectTasks) {
      console.error('No task data available');
      setIsLoading(prevState => ({ ...prevState, projectProgress: false }));
      return;
    }

    // Perform any necessary calculations here

    setIsCalculated(prevState => ({ ...prevState, projectProgress: true }));
  } catch (error) {
    console.error('Error calculating project progress:', error);
  }

  setIsLoading(prevState => ({ ...prevState, projectProgress: false }));
};

const downloadGanttChart = async (projectDetails, setIsLoading, setIsCalculated) => {
  try {
    setIsLoading(prevState => ({ ...prevState, downloadingGanttChart: true }));
    const projectTasks = JSON.parse(localStorage.getItem('projectTasks'));
    if (!projectTasks) {
      console.error('No task data available');
      setIsLoading(prevState => ({ ...prevState, downloadingGanttChart: false }));
      return;
    }

    const doc = new jsPDF();
    const tasksPerPage = 8; // Number of tasks to display per page

    // Title
    doc.setFontSize(22);
    doc.setTextColor(0, 102, 204);
    doc.text('Gantt Chart Report', 105, 20, { align: 'center' });

    // Project Details
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Project Details', 20, 40);

    doc.setFontSize(12);
    doc.text(`Project Name: ${projectDetails.name}`, 20, 50);
    doc.text(`Project Methodology: ${projectDetails.methodology}`, 20, 60);

    // Status Summary
    doc.setFontSize(16);
    doc.text('Status Summary', 20, 80);
    
    const statusCounts = projectTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    doc.setFontSize(12);
    let yPos = 90;
    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`${status}: ${count}`, 20, yPos);
      yPos += 10;
    });

    // Gantt Chart
    doc.setFontSize(16);
    doc.text('Gantt Chart', 20, yPos + 10);

    for (let i = 0; i < projectTasks.length; i += tasksPerPage) {
      const tasksSubset = projectTasks.slice(i, i + tasksPerPage);
      const ganttChartImage = await generateGanttChart(tasksSubset);
      doc.addImage(ganttChartImage, 'PNG', 15, yPos + 20, 180, 90);

      if (i + tasksPerPage < projectTasks.length) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 110;
      }
    }

    // Add timestamp at the very end
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, doc.internal.pageSize.height - 10);

    // Save the PDF
    doc.save(`GanttChart_${projectDetails.name}.pdf`);
    setIsLoading(prevState => ({ ...prevState, downloadingGanttChart: false }));
    setIsCalculated(prevState => ({ ...prevState, projectProgress: false }));
  } catch (error) {
    console.error('Error generating Gantt chart PDF:', error);
    setIsLoading(prevState => ({ ...prevState, downloadingGanttChart: false }));
  }
};

const calculateAndDownloadReport = async (reportType, projectDetails, setIsLoading, setIsCalculated) => {
  setIsLoading(prevState => ({ ...prevState, [reportType]: true }));

  try {
    const projectTasks = JSON.parse(localStorage.getItem('projectTasks'));
    if (!projectTasks) {
      console.error('No task data available');
      setIsLoading(prevState => ({ ...prevState, [reportType]: false }));
      return;
    }

    const doc = new jsPDF();
    const tasksPerPage = 12; // Number of tasks to display per page

    // Title
    doc.setFontSize(22);
    doc.setTextColor(0, 102, 204);
    doc.text(`${reportType === 'taskSummary' ? 'Task Summary Report' : reportType === 'projectProgress' ? 'Gantt Chart Report' : 'Graphical Reports'}`, 105, 20, { align: 'center' });

    // Project Details
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Project Details', 20, 40);

    doc.setFontSize(12);
    doc.text(`Project Name: ${projectDetails.name}`, 20, 50);
    doc.text(`Project Methodology: ${projectDetails.methodology}`, 20, 60);

    // Status Summary
    doc.setFontSize(16);
    doc.text('Status Summary', 20, 80);
    
    const statusCounts = projectTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    doc.setFontSize(12);
    let yPos = 90;
    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`${status}: ${count}`, 20, yPos);
      yPos += 10;
    });

    const priorityCounts = projectTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    const assignees = [...new Set(projectTasks.map(task => task.assignee))];
    const assigneeCounts = projectTasks.reduce((acc, task) => {
      acc[task.assignee] = (acc[task.assignee] || 0) + 1;
      return acc;
    }, {});

    if (reportType === 'taskSummary' || reportType === 'graphicalReports') {
      // Priority Summary (Text Version)
      doc.setFontSize(16);
      doc.text('Priority Summary', 20, yPos + 10);
      
      doc.setFontSize(12);
      yPos += 20;
      Object.entries(priorityCounts).forEach(([priority, count]) => {
        doc.text(`${priority}: ${count}`, 20, yPos);
        yPos += 10;
      });

      // Assignees
      doc.setFontSize(16);
      doc.text('Assignees', 20, yPos + 10);
      
      doc.setFontSize(12);
      yPos += 20;
      assignees.forEach((assignee) => {
        doc.text(`• ${assignee}: ${assigneeCounts[assignee]}`, 20, yPos);
        yPos += 10;
      });
    }

    if (reportType === 'graphicalReports') {
      // Add new page for the priority bar chart if needed
      if (yPos > doc.internal.pageSize.height - 220) {
        doc.addPage();
        yPos = 20;
      }

      // Priority Distribution Chart
      doc.setFontSize(16);
      doc.text('Priority Distribution Chart', 20, yPos + 20);
      
      // Generate and add priority bar chart
      const priorityBarChartImage = await generatePriorityBarChart(priorityCounts);
      doc.addImage(priorityBarChartImage, 'PNG', 15, yPos + 30, 180, 180);
      
      yPos += 220;

      // Add new page for the assignee bar chart if needed
      if (yPos > doc.internal.pageSize.height - 220) {
        doc.addPage();
        yPos = 20;
      }

      // Assignee Breakdown Chart
      doc.setFontSize(16);
      doc.text('Assignee Breakdown Chart', 20, yPos + 20);
      
      // Generate and add assignee bar chart
      const assigneeBarChartImage = await generateAssigneeBarChart(assigneeCounts);
      doc.addImage(assigneeBarChartImage, 'PNG', 15, yPos + 30, 180, 180);
      
      yPos += 220;

      // Add labels for each assignee count
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      Object.entries(assigneeCounts).forEach(([assignee, count]) => {
        doc.text(`${assignee}: ${count} tasks`, 20, yPos + 10);
        yPos += 10;
      });

      // Add new page for task completion charts if needed
      if (yPos > doc.internal.pageSize.height - 220) {
        doc.addPage();
        yPos = 20;
      }

      // Task Completion Over Time
      doc.setFontSize(16);
      doc.text('Task Completion Over Time', 20, yPos + 20);
      
      // Generate and add task completion area chart using dynamic data
      const taskCompletionData = {
        dates: [],
        counts: {},
        cumulativeCounts: []
      };

      projectTasks.forEach(task => {
        const completionDate = task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : null;
        if (completionDate) {
          if (!taskCompletionData.dates.includes(completionDate)) {
            taskCompletionData.dates.push(completionDate);
          }
          taskCompletionData.counts[completionDate] = (taskCompletionData.counts[completionDate] || 0) + 1;
        }
      });

      // Sort dates
      taskCompletionData.dates.sort((a, b) => new Date(a) - new Date(b));

      // Calculate cumulative counts
      let cumulativeCount = 0;
      taskCompletionData.dates.forEach(date => {
        cumulativeCount += taskCompletionData.counts[date];
        taskCompletionData.cumulativeCounts.push(cumulativeCount);
      });

      const taskCompletionAreaChartImage = await generateTaskCompletionAreaChart({
        dates: taskCompletionData.dates,
        cumulativeCounts: taskCompletionData.cumulativeCounts
      });
      doc.addImage(taskCompletionAreaChartImage, 'PNG', 15, yPos + 30, 180, 180);
      
      yPos += 220;

      // Add table for task details
      if (yPos > doc.internal.pageSize.height - 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.text('Task Details', 20, yPos + 20);
      yPos += 30;

      const tableColumn = ["Task Name", "Assignee", "Priority", "Start Date", "End Date", "Status"];
      const tableRows = [];

      projectTasks.forEach(task => {
        const taskData = [
          task.name,
          task.assignee,
          task.priority,
          task.startDate ? new Date(task.startDate).toLocaleDateString() : '',
          task.endDate ? new Date(task.endDate).toLocaleDateString() : '',
          task.status
        ];
        tableRows.push(taskData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos
      });
    }

    if (reportType === 'projectProgress' || reportType === 'graphicalReports') {
      // Add new page for Gantt chart if needed
      if (yPos > doc.internal.pageSize.height - 220) {
        doc.addPage();
        yPos = 20;
      }

      // Gantt Chart
      doc.setFontSize(16);
      doc.text('Gantt Chart', 20, yPos + 20);
      
      for (let i = 0; i < projectTasks.length; i += tasksPerPage) {
        const tasksSubset = projectTasks.slice(i, i + tasksPerPage);
        const ganttChartImage = await generateGanttChart(tasksSubset);
        doc.addImage(ganttChartImage, 'PNG', 15, yPos + 30, 180, 90);

        if (i + tasksPerPage < projectTasks.length) {
          doc.addPage();
          yPos = 20;
        } else {
          yPos += 120;
        }
      }
    }

    if (reportType === 'taskSummary') {
      // Add table for task details
      if (yPos > doc.internal.pageSize.height - 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.text('Task Details', 20, yPos + 20);
      yPos += 30;

      const tableColumn = ["Task Name", "Assignee", "Priority", "Start Date", "End Date", "Status"];
      const tableRows = [];

      projectTasks.forEach(task => {
        const taskData = [
          task.name,
          task.assignee,
          task.priority,
          task.startDate ? new Date(task.startDate).toLocaleDateString() : '',
          task.endDate ? new Date(task.endDate).toLocaleDateString() : '',
          task.status
        ];
        tableRows.push(taskData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos
      });
    }

    // Add timestamp at the very end
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, doc.internal.pageSize.height - 10);

    // Save the PDF
    doc.save(`${reportType}_${projectDetails.name}.pdf`);
    setIsLoading(prevState => ({ ...prevState, [reportType]: false }));
    setIsCalculated(prevState => ({ ...prevState, [reportType]: true }));
  } catch (error) {
    console.error(`Error generating ${reportType} PDF:`, error);
    setIsLoading(prevState => ({ ...prevState, [reportType]: false }));
  }
};

function Reports() {
  // Add new state variables for project details
  const [projectDetails, setProjectDetails] = useState({
    name: '',
    methodology: ''
  });

  // Define state variables
  const [isLoading, setIsLoading] = useState({
    taskSummary: false,
    taskDetails: false,
    projectProgress: false,
    graphicalReports: false,
    downloadingGanttChart: false,
  });

  const [isCalculated, setIsCalculated] = useState({
    taskSummary: false,
    taskDetails: false,
    projectProgress: false,
    graphicalReports: false,
  });

  // Add new state for storing parsed task data
  const [parsedTaskData, setParsedTaskData] = useState(null);

  // Add useEffect to get project details when component mounts
  useEffect(() => {
    const storedName = localStorage.getItem('selectedProjectname');
    const storedMethodology = localStorage.getItem('selectedProjectmethodology');
    setProjectDetails({
      name: storedName || '',
      methodology: storedMethodology || ''
    });
  }, []);

  // Optimize the calculation function
  const calculateTaskSummary = useCallback(() => {
    setIsLoading(prevState => ({ ...prevState, taskSummary: true }));

    try {
      // Get project details
      console.log('Project Details:', {
        name: projectDetails.name,
        methodology: projectDetails.methodology
      });

      // Only parse data if we haven't already
      if (!parsedTaskData) {
        const projectTasks = localStorage.getItem('projectTasks');
        if (projectTasks) {
          const parsed = JSON.parse(projectTasks);
          setParsedTaskData(parsed);

          // Do heavy calculations in the next tick
          requestAnimationFrame(() => {
            const summaryData = {
              projectName: projectDetails.name,
              projectMethodology: projectDetails.methodology,
              statusCounts: parsed.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
              }, {}),
              priorityCounts: parsed.reduce((acc, task) => {
                acc[task.priority] = (acc[task.priority] || 0) + 1;
                return acc;
              }, {}),
              assignees: [...new Set(parsed.map(task => task.assignee))]
            };

            console.log('=== Task Summary ===');
            console.log('Project Details:', {
              name: summaryData.projectName,
              methodology: summaryData.projectMethodology
            });
            console.log('Status Summary:', summaryData.statusCounts);
            console.log('Priority Summary:', summaryData.priorityCounts);
            console.log('Assignees:', summaryData.assignees);
          });
        }
      } else {
        // Use cached data for subsequent calculations
        console.log('Using cached task data:', {
          ...parsedTaskData,
          projectName: projectDetails.name,
          projectMethodology: projectDetails.methodology
        });
      }
    } catch (error) {
      console.error('Error processing task data:', error);
    }

    // Reduce timeout for faster feedback
    setTimeout(() => {
      setIsLoading(prevState => ({ ...prevState, taskSummary: false }));
      setIsCalculated(prevState => ({ ...prevState, taskSummary: true }));
    }, 500);
  }, [parsedTaskData, projectDetails]);

  const calculateTaskDetails = () => {
    setIsLoading(prevState => ({ ...prevState, taskDetails: true }));
    // Add your calculation logic here
    setTimeout(() => {
      setIsLoading(prevState => ({ ...prevState, taskDetails: false }));
      setIsCalculated(prevState => ({ ...prevState, taskDetails: true }));
    }, 20);
  };

  const calculateGraphicalReports = () => {
    setIsLoading(prevState => ({ ...prevState, graphicalReports: true }));
    // Add your calculation logic here
    setTimeout(() => {
      setIsLoading(prevState => ({ ...prevState, graphicalReports: false }));
      setIsCalculated(prevState => ({ ...prevState, graphicalReports: true }));
    }, 2000);
  };

  const downloadReport = async (reportType) => {
    try {
      // Disable the download button
      setIsCalculated(prevState => ({ ...prevState, [reportType]: false }));
      const projectTasks = JSON.parse(localStorage.getItem('projectTasks'));
      if (!projectTasks) {
        console.error('No task data available');
        return;
      }

      const doc = new jsPDF();

      // Title
      doc.setFontSize(22);
      doc.setTextColor(0, 102, 204);
      doc.text('Task Summary Report', 105, 20, { align: 'center' });

      // Project Details
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Project Details', 20, 40);
      
      doc.setFontSize(12);
      doc.text(`Project Name: ${projectDetails.name}`, 20, 50);
      doc.text(`Project Methodology: ${projectDetails.methodology}`, 20, 60);

      // Status Summary
      doc.setFontSize(16);
      doc.text('Status Summary', 20, 80);
      
      const statusCounts = projectTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      doc.setFontSize(12);
      let yPos = 90;
      Object.entries(statusCounts).forEach(([status, count]) => {
        doc.text(`${status}: ${count}`, 20, yPos);
        yPos += 10;
      });

      // Priority Summary (Text Version)
      doc.setFontSize(16);
      doc.text('Priority Summary', 20, yPos + 10);
      
      const priorityCounts = projectTasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {});

      doc.setFontSize(12);
      yPos += 20;
      Object.entries(priorityCounts).forEach(([priority, count]) => {
        doc.text(`${priority}: ${count}`, 20, yPos);
        yPos += 10;
      });

      // Assignees
      doc.setFontSize(16);
      doc.text('Assignees', 20, yPos + 10);
      
      const assignees = [...new Set(projectTasks.map(task => task.assignee))];
      const assigneeCounts = projectTasks.reduce((acc, task) => {
        acc[task.assignee] = (acc[task.assignee] || 0) + 1;
        return acc;
      }, {});

      doc.setFontSize(12);
      yPos += 20;
      assignees.forEach((assignee) => {
        doc.text(`• ${assignee}: ${assigneeCounts[assignee]}`, 20, yPos);
        yPos += 10;
      });

      if (reportType === 'graphicalReports') {
        // Add new page for the priority bar chart if needed
        if (yPos > doc.internal.pageSize.height - 220) {
          doc.addPage();
          yPos = 20;
        }

        // Priority Distribution Chart
        doc.setFontSize(16);
        doc.text('Priority Distribution Chart', 20, yPos + 20);
        
        // Generate and add priority bar chart
        const priorityBarChartImage = await generatePriorityBarChart(priorityCounts);
        doc.addImage(priorityBarChartImage, 'PNG', 15, yPos + 30, 180, 180);
        
        yPos += 220;

        // Add new page for the assignee bar chart if needed
        if (yPos > doc.internal.pageSize.height - 220) {
          doc.addPage();
          yPos = 20;
        }

        // Assignee Breakdown Chart
        doc.setFontSize(16);
        doc.text('Assignee Breakdown Chart', 20, yPos + 20);
        
        // Generate and add assignee bar chart
        const assigneeBarChartImage = await generateAssigneeBarChart(assigneeCounts);
        doc.addImage(assigneeBarChartImage, 'PNG', 15, yPos + 30, 180, 180);
        
        yPos += 220;

        // Add labels for each assignee count
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        Object.entries(assigneeCounts).forEach(([assignee, count]) => {
          doc.text(`${assignee}: ${count} tasks`, 20, yPos + 10);
          yPos += 10;
        });

        // Add new page for task completion charts if needed
        if (yPos > doc.internal.pageSize.height - 220) {
          doc.addPage();
          yPos = 20;
        }

        // Task Completion Over Time
        doc.setFontSize(16);
        doc.text('Task Completion Over Time', 20, yPos + 20);
        
        // Generate and add task completion area chart using dynamic data
        const taskCompletionData = {
          dates: [],
          counts: {},
          cumulativeCounts: []
        };

        projectTasks.forEach(task => {
          const completionDate = task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : null;
          if (completionDate) {
            if (!taskCompletionData.dates.includes(completionDate)) {
              taskCompletionData.dates.push(completionDate);
            }
            taskCompletionData.counts[completionDate] = (taskCompletionData.counts[completionDate] || 0) + 1;
          }
        });

        // Sort dates
        taskCompletionData.dates.sort((a, b) => new Date(a) - new Date(b));

        // Calculate cumulative counts
        let cumulativeCount = 0;
        taskCompletionData.dates.forEach(date => {
          cumulativeCount += taskCompletionData.counts[date];
          taskCompletionData.cumulativeCounts.push(cumulativeCount);
        });

        const taskCompletionAreaChartImage = await generateTaskCompletionAreaChart({
          dates: taskCompletionData.dates,
          cumulativeCounts: taskCompletionData.cumulativeCounts
        });
        doc.addImage(taskCompletionAreaChartImage, 'PNG', 15, yPos + 30, 180, 180);
        
        yPos += 220;
      }

      // Add table for task details
      if (yPos > doc.internal.pageSize.height - 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.text('Task Details', 20, yPos + 20);
      yPos += 30;

      const tableColumn = ["Task Name", "Assignee", "Priority", "Start Date", "End Date", "Status"];
      const tableRows = [];

      projectTasks.forEach(task => {
        const taskData = [
          task.name,
          task.assignee,
          task.priority,
          task.startDate ? new Date(task.startDate).toLocaleDateString() : '',
          task.endDate ? new Date(task.endDate).toLocaleDateString() : '',
          task.status
        ];
        tableRows.push(taskData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos
      });

      // Add timestamp at the very end
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, doc.lastAutoTable.finalY + 10);

      // Save the PDF
      doc.save(`${reportType}_${projectDetails.name}.pdf`);
      setIsLoading(prevState => ({ ...prevState, taskDetails: true }));
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Render component UI
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg border border-gray-300">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaTasks className="mr-2" /> Task Summary Report
          </h2>
          <button 
            onClick={() => calculateAndDownloadReport('taskSummary', projectDetails, setIsLoading, setIsCalculated)} 
            className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded-2xl mt-4 transition duration-300 flex items-center justify-center"
            disabled={isLoading.taskSummary}
          >
            {isLoading.taskSummary ? 'Calculating & Downloading...' : 'Calculate & Download'}
            {isLoading.taskSummary && <div className="loader ml-2"></div>}
          </button>
        </div>
        
        <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg border border-gray-300">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaProjectDiagram className="mr-2" /> Gantt Chart
          </h2>
          <button 
            onClick={() => calculateAndDownloadReport('projectProgress', projectDetails, setIsLoading, setIsCalculated)} 
            className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded mt-4 transition duration-300 flex items-center justify-center"
            disabled={isLoading.projectProgress}
          >
            {isLoading.projectProgress ? 'Calculating & Downloading...' : 'Calculate & Download'}
          </button>
        </div>

        <div className="report-container bg-black bg-opacity-50 p-6 rounded-lg shadow-lg border border-gray-300 ">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaChartPie className="mr-2" /> Graphical Reports
          </h2>
          <button 
            onClick={() => calculateAndDownloadReport('graphicalReports', projectDetails, setIsLoading, setIsCalculated)} 
            className="bg-purple-900 from-purple-700 to-purple-900 hover:bg-purple-950 text-white px-4 py-2 rounded mt-4 transition duration-300 flex items-center justify-center"
            disabled={isLoading.graphicalReports}
          >
            {isLoading.graphicalReports ? 'Calculating & Downloading...' : 'Calculate & Download'}
            {isLoading.graphicalReports && <div className="loader ml-2"></div>}
          </button>
        </div>
      </div>
    </>
  );
}

export default Reports;
