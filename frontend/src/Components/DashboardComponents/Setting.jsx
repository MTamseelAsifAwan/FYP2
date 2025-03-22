import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandshakeAngle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { getDatabase, ref, set, get } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase Auth
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PulseLoader } from 'react-spinners';

const Setting = () => {
  const [email, setEmail] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [accessTokenAvailable, setAccessTokenAvailable] = useState(null);
  const [user, setUser] = useState(null); // Track current user

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        checkAccessTokenAvailability(currentUser.uid);
      } else {
        setUser(null);
        setAccessTokenAvailable(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check if accessToken exists in Firebase
  const checkAccessTokenAvailability = (userId) => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}/Accesstokendata`);

    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          setAccessTokenAvailable(true);
        } else {
          setAccessTokenAvailable(false);
        }
      })
      .catch((error) => {
        console.error('Error checking access token:', error);
      });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('User not logged in');
      return;
    }

    setIsSaving(true);
    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}/Accesstokendata`);

    set(userRef, {
      email: email,
      accessToken: accessToken,
    })
      .then(() => {
        toast.success('Data saved successfully!');
        setEmail('');
        setAccessToken('');
        checkAccessTokenAvailability(user.uid);
      })
      .catch((error) => {
        toast.error('Error saving data');
        console.error('Error:', error);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <>
      <div className="text-3xl text-white font-bold mt-2 ml-1 mb-4">Setting</div>
      {user ? (
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center gap-4">
            <div>
              <h3 className="text-white text-center">Enter your Jira Email and Access Token</h3>
              <div className="flex items-center text-center pt-2">
                <FontAwesomeIcon className="text-yellow-400 rounded-full text-lg mr-2" icon={faHandshakeAngle} />
                <p className="text-gray-300">
                  Go to your <a href="https://www.atlassian.com/software/jira" target="_blank" className="text-blue-500 underline">Jira</a> account and generate an access token. <br />
                  By tapping on manage account and then security.
                </p>
              </div>
            </div>

            {/* Token availability check */}
            <div className="absolute top-0 right-0 mr-4 mt-2">
              {accessTokenAvailable === null ? (
                <span>Checking...</span>
              ) : accessTokenAvailable ? (
                <div className="flex justify-end items-end">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" title="Access Token Available" />
                  <p className="text-white text-sm">Token Available</p>
                </div>
              ) : (
                <FontAwesomeIcon icon={faCheckCircle} className="text-red-500" title="Access Token Not Available" />
              )}
            </div>

            <div className="flex flex-col gap-2 w-full">
              <label className="text-white font-semibold">Email</label>
              <input
                type="email"
                className="bg-white rounded-lg p-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <label className="text-white font-semibold">Access Token</label>
              <input
                type="password"
                className="bg-white rounded-lg p-2"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
              />
            </div>

            {/* Button with loader */}
            <button className="bg-purple-900 text-white rounded-lg p-2 hover:bg-purple-950 flex items-center justify-center" type="submit" disabled={isSaving}>
              {isSaving ? <PulseLoader size={8} color="white" /> : 'Update'}
            </button>
          </div>

          <ToastContainer />
        </form>
      ) : (
        <p className="text-white text-center">Please log in to update settings.</p>
      )}
    </>
  );
};

export default Setting;
