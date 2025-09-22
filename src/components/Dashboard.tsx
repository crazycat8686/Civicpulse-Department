import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Complaint, Department } from '../types';
import ComplaintCard from './ComplaintCard';
import ComplaintDetails from './ComplaintDetails';
import { Filter, AlertCircle, Clock, CheckCircle, FileText } from 'lucide-react';

interface DashboardProps {
  department: Department;
  onLogout: () => void;
}

const criticalityOrder: { [key: string]: number } = {
  high: 1,
  medium: 2,
  low: 3,
};

export default function Dashboard({ department, onLogout }: DashboardProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'assigned' | 'in-progress' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  const departmentColors = {
    municipality: 'bg-blue-600',
    electricity: 'bg-yellow-600',
    fire: 'bg-red-600',
    safe: 'bg-green-600',
  };

  useEffect(() => {
    const complaintsRef = collection(db, 'complaints');
    const q = query(
      complaintsRef,
      where('departments', 'array-contains', department)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const complaintsData: Complaint[] = [];
      snapshot.forEach((doc) => {
        complaintsData.push({ id: doc.id, ...doc.data() } as Complaint);
      });

      const sortedComplaints = complaintsData.sort((a, b) => {
        const aCriticality = a.criticality ? criticalityOrder[a.criticality] || 4 : 4;
        const bCriticality = b.criticality ? criticalityOrder[b.criticality] || 4 : 4;
        return aCriticality - bCriticality;
      });

      setComplaints(sortedComplaints);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [department]);

  const filteredComplaints = complaints.filter(complaint => {
    const criticalityMatch = filter === 'all' || complaint.criticality === filter;
    const statusMatch = statusFilter === 'all' || complaint.status === statusFilter;
    return criticalityMatch && statusMatch;
  });

  const stats = {
    total: complaints.length,
    submitted: complaints.filter(c => c.status === 'submitted').length,
    assigned: complaints.filter(c => c.status === 'assigned').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    completed: complaints.filter(c => c.status === 'completed').length,
  };

  if (selectedComplaint) {
    return (
      <ComplaintDetails
        complaint={selectedComplaint}
        onBack={() => setSelectedComplaint(null)}
        department={department}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`${departmentColors[department]} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold capitalize">{department} Department</h1>
              <p className="text-blue-100 mt-1">Complaint Management Portal</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-orange-600">{stats.submitted}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Criticality:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No complaints found</h3>
            <p className="text-gray-500">No complaints match your current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onClick={() => setSelectedComplaint(complaint)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}