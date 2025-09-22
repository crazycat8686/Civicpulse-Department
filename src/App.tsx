import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, messaging } from './config/firebase';
import { getToken } from 'firebase/messaging';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { Department } from './types';

function App() {
  const [user, setUser] = useState<any>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedDept = localStorage.getItem("department") as Department | null;
    if (storedDept) {
      setDepartment(storedDept);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        requestPermission();
      }
    });

    return () => unsubscribe();
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: 'BLqWM8vNBZ49lmOkSRNBrgpDZoeCPCtPyHmB-8vrMMiWld37irqZlDythcO2YehJn8N9KMGfeeFNWOPuBLyMylA' });
        console.log('FCM Token:', token);
        // TODO: Save the token to the user's profile in Firestore
      } else {
        console.log('Notification permission denied.');
      }
    } catch (error) {
      console.error('Error getting notification permission:', error);
    }
  };

  const handleLogin = (dept: Department) => {
    setDepartment(dept);
    localStorage.setItem("department", dept);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setDepartment(null);
      localStorage.removeItem("department");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !department) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard department={department} onLogout={handleLogout} />;
}

export default App;