import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Worker, Complaint, Department } from '../types';
import { sortWorkersByDistance } from '../utils/distance';
import LocationPicker from './LocationPicker';
import { ArrowLeft, MapPin, Star, CheckCircle, Clock, Plus } from 'lucide-react';

interface WorkerAssignmentProps {
  complaint: Complaint;
  department: Department;
  onBack: () => void;
  onAssign: () => void;
}

export default function WorkerAssignment({ complaint, department, onBack, onAssign }: WorkerAssignmentProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: '',
    phone: '',
    expertise: '',
    location: { lat: 0, lng: 0 }
  });

  useEffect(() => {
    const workersRef = collection(db, 'workers');
    const q = query(workersRef, where('department', '==', department));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workersData: Worker[] = [];
      snapshot.forEach((doc) => {
        workersData.push({ id: doc.id, ...doc.data() } as Worker);
      });
      
      const sortedWorkers = sortWorkersByDistance(workersData, complaint.location);
      setWorkers(sortedWorkers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [department, complaint.location]);

  const handleWorkerSelect = (workerId: string) => {
    if (selectedWorkers.includes(workerId)) {
      setSelectedWorkers(selectedWorkers.filter(id => id !== workerId));
    } else {
      setSelectedWorkers([...selectedWorkers, workerId]);
    }
  };

  const handleAssignment = async () => {
    if (selectedWorkers.length === 0 || !estimatedTime) return;

    try {
      const complaintRef = doc(db, 'complaints', complaint.id);
      await updateDoc(complaintRef, {
        assignedWorkers: selectedWorkers,
        assignedAt: new Date().toISOString(),
        estimatedTime,
        status: 'assigned'
      });

      for (const workerId of selectedWorkers) {
        const workerRef = doc(db, 'workers', workerId);
        await updateDoc(workerRef, { isWorking: true });
      }

      onAssign();
    } catch (error) {
      console.error('Error assigning workers:', error);
    }
  };

  const addWorker = async () => {
    if (!newWorker.name || !newWorker.phone || !newWorker.location.lat || !newWorker.location.lng) return;

    try {
      await addDoc(collection(db, 'workers'), {
        name: newWorker.name,
        phone: newWorker.phone,
        department,
        location: [newWorker.location.lat, newWorker.location.lng],
        expertise: newWorker.expertise.split(',').map(e => e.trim()),
        isWorking: false,
        rating: 5,
        completedTasks: 0
      });

      setNewWorker({ name: '', phone: '', expertise: '', location: { lat: 0, lng: 0 } });
      setShowAddWorker(false);
    } catch (error) {
      console.error('Error adding worker:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Complaint
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Assign Workers</h1>
            <button
              onClick={() => setShowAddWorker(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Worker
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Complaint Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 mb-2">Description:</p>
              <p className="text-gray-900 font-medium">{complaint.description}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Location:</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                <p className="text-gray-900 text-sm">{complaint.locationName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Workers (Sorted by Distance)
              </h3>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse border rounded-lg p-4"><div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></div>
                  ))}
                </div>
              ) : workers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No workers available</p>
              ) : (
                <div className="space-y-3">
                  {workers.map((worker, index) => (
                    <div
                      key={worker.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedWorkers.includes(worker.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${worker.isWorking ? 'opacity-60' : ''}`}
                      onClick={() => !worker.isWorking && handleWorkerSelect(worker.id)}
                    >
                       <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center"><span className="text-gray-600 font-semibold">{worker.name.charAt(0).toUpperCase()}</span></div>
                            {index === 0 && selectedWorkers.includes(worker.id) && <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 rounded">Leader</div>}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{worker.name}</h4>
                            <p className="text-sm text-gray-600">{worker.phone}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" /><span className="text-sm text-gray-600">{worker.rating}</span></div>
                              <span className="text-sm text-gray-600">{worker.completedTasks} tasks completed</span>
                            </div>
                            {worker.expertise && worker.expertise.length > 0 && <div className="flex gap-1 mt-1">{worker.expertise.slice(0, 3).map(skill => <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{skill}</span>)}</div>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1"><MapPin className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-600">{worker.distance ? `${worker.distance} km away` : 'Distance unknown'}</span></div>
                          <div className="flex items-center gap-2">
                            {worker.isWorking ? <div className="flex items-center gap-1 text-red-600"><Clock className="w-4 h-4" /><span className="text-sm">Busy</span></div> : <div className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /><span className="text-sm">Available</span></div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selected Workers ({selectedWorkers.length})</label>
                  {selectedWorkers.length === 0 ? <p className="text-gray-500 text-sm">No workers selected</p> : <div className="text-sm text-gray-600">{selectedWorkers.map((workerId, index) => { const worker = workers.find(w => w.id === workerId); return <div key={workerId} className="flex items-center justify-between py-1"><span>{worker?.name} {index === 0 && '(Leader)'}</span><span className="text-xs text-gray-500">{worker?.distance && `${worker.distance} km`}</span></div>; })}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time to Complete</label>
                  <input type="text" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="e.g., 2-3 hours" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <button onClick={handleAssignment} disabled={selectedWorkers.length === 0 || !estimatedTime} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Assign Workers</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Worker</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Worker Name" value={newWorker.name} onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <input type="tel" placeholder="Phone Number" value={newWorker.phone} onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Expertise (comma separated)" value={newWorker.expertise} onChange={(e) => setNewWorker({ ...newWorker, expertise: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <LocationPicker onLocationSelect={(location) => setNewWorker({ ...newWorker, location })} />
                <p className="text-xs text-gray-500 mt-1">Click on the map to select the worker's location.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddWorker(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={addWorker} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add Worker</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}