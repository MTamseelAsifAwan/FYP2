const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const cors = require('cors'); // Import CORS
const serviceAccount = require('./sprinty-fyp-key.json'); // Ensure this path is correct

// Ensure server time is properly synced
// You can use the following command to sync time on a Linux server:
// sudo ntpdate -u pool.ntp.org

// If the key file is revoked, generate a new key file from the Firebase console:
// 1. Go to https://console.firebase.google.com/
// 2. Navigate to your project settings
// 3. Go to the "Service accounts" tab
// 4. Click "Generate new private key"
// 5. Replace the old key file with the new one

// Initialize Firebase Admin SDK for Realtime Database
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sprinty-fyp-default-rtdb.firebaseio.com/" // Make sure this is correct
});

const db = admin.database();
const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all requests
app.use(cors());

app.get('/api/projects', async (req, res) => {
  console.log('/api/projects API hit');
  try {
    console.log('PROJECT DATA FETCHING');
    
    // Reference to the Realtime Database node where Accesstokendata is stored
    const ref = db.ref('users/Accesstokendata');

    // Fetch the data from the Realtime Database
    ref.once('value', async (snapshot) => {
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the user data (email and accessToken)
      const userData = snapshot.val();
      const email = userData.email;
      const accessToken = userData.accessToken;

      // Proceed with Jira API request using email and accessToken
      const jiraURL = `https://codewolfsol.atlassian.net/rest/api/3/project`; // Replace with your Jira instance

      try {
        const response = await axios.get(jiraURL, {
          auth: {
            username: email,          // Jira username (email)
            password: accessToken     // Jira API token
          }
        });

        // Send back the response from Jira
        res.status(200).json(response.data);
      } catch (jiraError) {
        console.error('Error fetching data from Jira:', jiraError.message);
        res.status(500).json({ error: jiraError.message });
      }

    }, (errorObject) => {
      console.error("Error reading data from Firebase Realtime Database:", errorObject);
      res.status(500).json({ error: errorObject.message });
    });

  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  console.log('/api/tasks API hit');
  try {
    console.log('TASKS DATA FETCHING');

    const { projectId, startAt = 0, maxResults = 50 } = req.query;
    console.log(req.query);
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Reference to the Realtime Database node where Accesstokendata is stored
    const ref = db.ref('users/Accesstokendata');

    // Fetch the data from the Realtime Database
    ref.once('value', async (snapshot) => {
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the user data (email and accessToken)
      const userData = snapshot.val();
      const email = userData.email;
      const accessToken = userData.accessToken;

      // Jira API request with projectId in the JQL
      const jiraURL = `https://codewolfsol.atlassian.net/rest/api/3/search?jql=project=${projectId}&startAt=${startAt}&maxResults=${maxResults}`; // Replace with your Jira instance

      try {
        const response = await axios.get(jiraURL, {
          auth: {
            username: email,          // Jira username (email)
            password: accessToken     // Jira API token
          }
        });

        // Ensure the total number of tasks does not exceed the actual number of tasks
        const issues = response.data.issues;
        const total = response.data.total;

        // Send back the response from Jira
        res.status(200).json({ issues, total });
      } catch (jiraError) {
        console.error('Error fetching data from Jira:', jiraError.message);
        res.status(500).json({ error: jiraError.message });
      }

    }, (errorObject) => {
      console.error("Error reading data from Firebase Realtime Database:", errorObject);
      res.status(500).json({ error: errorObject.message });
    });

  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasksdetails', async (req, res) => {
  console.log('/api/tasksdetails API hit');
  try {
    console.log('TASKS DETAILS DATA FETCHING');

    const { taskId } = req.query;
    console.log(req.query);
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Reference to the Realtime Database node where Accesstokendata is stored
    const ref = db.ref('users/Accesstokendata');

    // Fetch the data from the Realtime Database
    ref.once('value', async (snapshot) => {
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the user data (email and accessToken)
      const userData = snapshot.val();
      const email = userData.email;
      const accessToken = userData.accessToken;

      // Jira API request with taskId
      const jiraURL = `https://codewolfsol.atlassian.net/rest/api/3/issue/${taskId}?expand=changelog`; // Replace with your Jira instance

      try {
        const response = await axios.get(jiraURL, {
          auth: {
            username: email,          // Jira username (email)
            password: accessToken     // Jira API token
          }
        });

        // Send back the response from Jira
        res.status(200).json(response.data);
      } catch (jiraError) {
        console.error('Error fetching data from Jira:', jiraError.message);
        res.status(500).json({ error: jiraError.message });
      }

    }, (errorObject) => {
      console.error("Error reading data from Firebase Realtime Database:", errorObject);
      res.status(500).json({ error: errorObject.message });
    });

  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/taskscomments', async (req, res) => {
  console.log('/api/taskscomments API hit');
  try {
    console.log('TASKS DETAILS DATA FETCHING');

    const { taskId } = req.query;
    console.log(req.query);
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Reference to the Realtime Database node where Accesstokendata is stored
    const ref = db.ref('users/Accesstokendata');

    // Fetch the data from the Realtime Database
    ref.once('value', async (snapshot) => {
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the user data (email and accessToken)
      const userData = snapshot.val();
      const email = userData.email;
      const accessToken = userData.accessToken;

      // Jira API request with taskId
      const jiraURL = `https://codewolfsol.atlassian.net/rest/api/3/issue/${taskId}/comment`; // Replace with your Jira instance

      try {
        const response = await axios.get(jiraURL, {
          auth: {
            username: email,          // Jira username (email)
            password: accessToken     // Jira API token
          }
        });

        // Send back the response from Jira
        res.status(200).json(response.data);
        console.log('tasks comment api is hit');
      } catch (jiraError) {
        console.error('Error fetching data from Jira:', jiraError.message);
        res.status(500).json({ error: jiraError.message });
      }

    }, (errorObject) => {
      console.error("Error reading data from Firebase Realtime Database:", errorObject);
      res.status(500).json({ error: errorObject.message });
    });

  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
