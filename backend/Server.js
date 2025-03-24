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
app.use(express.json()); // To parse JSON bodies

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const idToken = authHeader?.split('Bearer ')[1];
  
  if (!authHeader) {
    console.error('Authorization header missing');
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  
  if (!idToken) {
    console.error('Bearer token not found in Authorization header');
    return res.status(401).json({ error: 'Token missing or malformed' });
  }

  try {
    console.log(`Verifying token: ${idToken.substring(0, 10)}...`);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log(`Token verified successfully for user: ${decodedToken.uid}`);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: error.message,
      code: error.code
    });
  }
};

app.get('/api/projects', verifyToken, async (req, res) => {
  console.log('/api/projects API hit');
  try {
    console.log('PROJECT DATA FETCHING');
    
    // Reference to the Realtime Database node where Accesstokendata is stored
    const ref = db.ref(`users/${req.user.uid}/Accesstokendata`);

    // Fetch the data from the Realtime Database
    ref.once('value', async (snapshot) => {
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the user data (email and accessToken)
      const userData = snapshot.val();
      const email = userData.email;
      const accessToken = userData.accessToken;
      const domain = userData.domainName;


      // Proceed with Jira API request using email and accessToken
      const jiraURL = `https://${domain}/rest/api/3/project`; // Replace with your Jira instance

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

app.get('/api/tasks', verifyToken, async (req, res) => {
  console.log('/api/tasks API hit');
  try {
    console.log('TASKS DATA FETCHING');

    const { projectId, startAt = 0, maxResults = 50 } = req.query;
    console.log(req.query);
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Reference to the Realtime Database node where Accesstokendata is stored
    const ref = db.ref(`users/${req.user.uid}/Accesstokendata`);

    // Fetch the data from the Realtime Database
    ref.once('value', async (snapshot) => {
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the user data (email and accessToken)
      const userData = snapshot.val();
      const email = userData.email;
      const accessToken = userData.accessToken;
      const domain = userData.domainName;


      // Jira API request with projectId in the JQL
      const jiraURL = `https://${domain}/rest/api/3/search?jql=project=${projectId}&startAt=${startAt}&maxResults=${maxResults}`; // Replace with your Jira instance

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
        // Include more detailed error information
        const errorResponse = {
          error: jiraError.message,
          status: jiraError.response?.status,
          statusText: jiraError.response?.statusText,
          details: jiraError.response?.data
        };
        res.status(jiraError.response?.status || 500).json(errorResponse);
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

app.get('/api/tasksdetails', verifyToken, async (req, res) => {
  console.log('/api/tasksdetails API hit');
  try {
    console.log('TASKS DETAILS DATA FETCHING');

    const { taskId } = req.query;
    console.log(req.query);
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Reference to the Realtime Database node where Accesstokendata is stored
    const ref = db.ref(`users/${req.user.uid}/Accesstokendata`);

    // Fetch the data from the Realtime Database
    ref.once('value', async (snapshot) => {
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the user data (email and accessToken)
      const userData = snapshot.val();
      const email = userData.email;
      const accessToken = userData.accessToken;
      const domain = userData.domainName;


      // Jira API request with taskId
      const jiraURL = `https://${domain}/rest/api/3/issue/${taskId}?expand=changelog`; // Replace with your Jira instance

      try {
        const response = await axios.get(jiraURL, {
          auth: {
            username: email,          // Jira username (email)
            password: accessToken     // Jira API token
          }
        });

        // Process changelog to extract transition history
        const transitionHistory = {
          transitions: [],
          timeInStatus: {}
        };
        
        let lastTransitionTime = null;
        let currentStatus = response.data.fields.status.name;
        
        // Process changelog entries
        if (response.data.changelog && response.data.changelog.histories) {
          response.data.changelog.histories.forEach(history => {
            history.items.forEach(item => {
              if (item.field === 'status') {
                const timestamp = history.created;
                const author = history.author.displayName;
                const fromStatus = item.fromString;
                const toStatus = item.toString;
                
                // Record transition
                transitionHistory.transitions.push({
                  timestamp,
                  author,
                  fromStatus,
                  toStatus
                });
                
                // Calculate time in previous status if we have previous transition data
                if (lastTransitionTime) {
                  const transitionDate = new Date(timestamp);
                  const prevDate = new Date(lastTransitionTime);
                  const durationMs = transitionDate - prevDate;
                  
                  // Convert to seconds
                  const durationSeconds = durationMs / 1000;
                  
                  // Add to the status time tracking
                  if (fromStatus in transitionHistory.timeInStatus) {
                    transitionHistory.timeInStatus[fromStatus] += durationSeconds;
                  } else {
                    transitionHistory.timeInStatus[fromStatus] = durationSeconds;
                  }
                }
                
                // Update for next iteration
                lastTransitionTime = timestamp;
                currentStatus = toStatus;
              }
            });
          });
        }
        
        // Calculate time in current status (from last transition to now)
        if (lastTransitionTime) {
          const now = new Date();
          const lastDate = new Date(lastTransitionTime);
          const durationMs = now - lastDate;
          const durationSeconds = durationMs / 1000;
          
          if (currentStatus in transitionHistory.timeInStatus) {
            transitionHistory.timeInStatus[currentStatus] += durationSeconds;
          } else {
            transitionHistory.timeInStatus[currentStatus] = durationSeconds;
          }
        }
        
        // Convert seconds to human-readable format
        Object.keys(transitionHistory.timeInStatus).forEach(status => {
          const seconds = transitionHistory.timeInStatus[status];
          const days = Math.floor(seconds / (24 * 3600));
          const remainingSeconds = seconds % (24 * 3600);
          const hours = Math.floor(remainingSeconds / 3600);
          
          transitionHistory.timeInStatus[status] = {
            seconds,
            formattedDuration: `${days}d ${hours}h`
          };
        });
        
        // Add transition history to the response
        const enhancedResponse = {
          ...response.data,
          transitionHistory
        };

        // Send back the enhanced response
        res.status(200).json(enhancedResponse);
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
});;
app.get('/api/taskscomments', verifyToken, async (req, res) => {
  console.log('/api/taskscomments API hit');
  try {
    console.log('TASKS DETAILS DATA FETCHING');

    const { taskId } = req.query;
    console.log(req.query);
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Reference to the Realtime Database node where Accesstokendata is stored
    const ref = db.ref(`users/${req.user.uid}/Accesstokendata`);

    // Fetch the data from the Realtime Database
    ref.once('value', async (snapshot) => {
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the user data (email and accessToken)
      const userData = snapshot.val();
      const email = userData.email;
      const accessToken = userData.accessToken;
      const domain = userData.domainName;

      // Jira API request with taskId
      const jiraURL = `https://${domain}/rest/api/3/issue/${taskId}/comment`; // Replace with your Jira instance

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
