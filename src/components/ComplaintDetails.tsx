import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Complaint, User, Department } from '../types';
import WorkerAssignment from './WorkerAssignment';
import { ArrowLeft, MapPin, Clock, User as UserIcon, Flag, Phone, Calendar, Send } from 'lucide-react';

interface ComplaintDetailsProps {
  complaint: Complaint;
  onBack: () => void;
  department: Department;
}

export default function ComplaintDetails({ complaint, onBack, department }: ComplaintDetailsProps) {
  const [currentComplaint, setCurrentComplaint] = useState(complaint);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWorkerAssignment, setShowWorkerAssignment] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [showTimeAlert, setShowTimeAlert] = useState(false);

  useEffect(() => {
    setCurrentComplaint(complaint);
  }, [complaint]);

  useEffect(() => {
    const userRef = collection(db, 'users');
    const q = query(userRef, where('id', '==', currentComplaint.userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setUser(snapshot.docs[0].data() as User);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentComplaint.userId]);

  useEffect(() => {
    if (currentComplaint.status === 'submitted') {
      updateComplaintStatus('under-review');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentComplaint.status]);

  useEffect(() => {
    if (currentComplaint.status === 'in-progress' && currentComplaint.startedAt && currentComplaint.timeConstraint) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const startTime = new Date(currentComplaint.startedAt!).getTime();
        const deadline = startTime + currentComplaint.timeConstraint! * 60 * 60 * 1000;
        const remaining = deadline - now;
        setTimeRemaining(remaining);

        if (remaining < 3600000 && remaining > 0) {
          setShowTimeAlert(true);
        }

      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentComplaint.status, currentComplaint.startedAt, currentComplaint.timeConstraint]);

  const updateComplaint = async (data: Partial<Complaint>) => {
    try {
      const complaintRef = doc(db, 'complaints', currentComplaint.id);
      await updateDoc(complaintRef, data);
      setCurrentComplaint(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error updating complaint:', error);
    }
  }

  const updateComplaintStatus = async (status: Complaint['status'], extraData = {}) => {
    await updateComplaint({ status, ...extraData });
  };

  const handleCloseCase = async () => {
    if (currentComplaint.allowClose) {
      await updateComplaint({ isOpen: false });
    }
  };

  const handleSendCustomMessage = async () => {
    if (!customMessage.trim()) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: currentComplaint.userId,
        complaintId: currentComplaint.id,
        message: customMessage,
        timestamp: serverTimestamp(),
        isRead: false,
      });
      setCustomMessage('');
    } catch (error) {
      console.error('Error sending custom message:', error);
    }
  };

  const handleStartWork = () => {
    updateComplaintStatus('in-progress', { startedAt: new Date().toISOString(), timeConstraint: 24 });
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-orange-600 bg-orange-50';
      case 'under-review': return 'text-purple-600 bg-purple-50';
      case 'assigned': return 'text-blue-600 bg-blue-50';
      case 'in-progress': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (showWorkerAssignment) {
    return <WorkerAssignment complaint={currentComplaint} department={department} onBack={() => setShowWorkerAssignment(false)} onAssign={() => { setShowWorkerAssignment(false); updateComplaintStatus('assigned'); }} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--secondary-color)' }}>
      {showTimeAlert && (
        <div className="fixed top-16 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          <strong className="font-bold">Time Constraint Alert!</strong>
          <span className="block sm:inline"> Less than one hour remaining.</span>
          <button onClick={() => setShowTimeAlert(false)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </button>
        </div>
      )}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <div className="flex gap-3 items-center">
              {timeRemaining !== null && timeRemaining > 0 && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${timeRemaining < 3600000 ? 'text-red-600 bg-red-50 border-red-200' : 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                  <Clock className="inline w-4 h-4 mr-1" />
                  {formatTime(timeRemaining)}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCriticalityColor(currentComplaint.criticality)}`}>{currentComplaint.criticality.toUpperCase()}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentComplaint.status)}`}>{currentComplaint.status.replace('-', ' ').toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card overflow-hidden">
              <img src={currentComplaint.photoUrl} alt="Complaint" className="w-full h-80 object-cover" />
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Complaint Details</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{currentComplaint.description}</p>
              {currentComplaint.flags && currentComplaint.flags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Flags</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentComplaint.flags.map((flag) => (
                      <span key={flag} className={`px-3 py-1 rounded-full text-sm font-medium ${flag === 'false-case' || flag === 'spam' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{flag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Location</h3>
              <div className="flex items-start gap-3 mt-4">
                <MapPin className="w-6 h-6 text-gray-500 mt-1" />
                <div>
                  <p className="text-lg text-gray-800">{currentComplaint.locationName}</p>
                  <p className="text-sm text-gray-500 mt-1">({currentComplaint.location[0]}, {currentComplaint.location[1]})</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button onClick={() => {}} className='w-full bg-indigo-100 text-indigo-800 py-3 px-4 rounded-lg font-semibold hover:bg-indigo-200 transition-colors text-lg'>Notify Locality</button>
                {currentComplaint.status === 'under-review' && <button onClick={() => setShowWorkerAssignment(true)} className="w-full text-lg bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Assign Workers</button>}
                {currentComplaint.status === 'assigned' && <button onClick={handleStartWork} className="w-full text-lg bg-yellow-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">Start Work</button>}
                {currentComplaint.status === 'in-progress' && <button onClick={() => updateComplaintStatus('completed')} className="w-full text-lg bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors">Mark as Completed</button>}
                {currentComplaint.status === 'completed' && (
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="allowClose" checked={!!currentComplaint.allowClose} onChange={(e) => updateComplaint({ allowClose: e.target.checked })} className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="allowClose" className="text-lg text-gray-800">Allow case to be closed</label>
                  </div>
                )}
                <button onClick={handleCloseCase} className="w-full text-lg bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!currentComplaint.allowClose}>Close Case</button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Custom Message</h3>
              <div className="space-y-3">
                <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder="Type your message to the user..." className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                <button onClick={handleSendCustomMessage} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"><Send className="w-5 h-5" />Send Message</button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">User Details</h3>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3"><UserIcon className="w-5 h-5 text-gray-500" /><span className="text-lg text-gray-800 font-medium">{currentComplaint.userName}</span></div>
                  <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-500" /><span className="text-lg text-gray-800">{currentComplaint.userPhone || 'Not provided'}</span></div>
                  {user && (
                    <>
                      <div className="flex items-center gap-3"><Flag className="w-5 h-5 text-gray-500" /><span className="text-lg text-gray-800">Flags: <span className={user.flags > 3 ? 'text-red-600 font-bold' : 'text-green-600 font-medium'}>{user.flags}</span></span></div>
                      <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-gray-500" /><span className="text-lg text-gray-800">Past Complaints: {user.previousComplaints?.length || 0}</span></div>
                      {user.flags > 3 && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4"><p className="text-red-800 font-semibold text-base">⚠️ High flag count - Proceed with caution</p></div>}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
