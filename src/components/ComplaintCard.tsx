import React from 'react';
import { Complaint } from '../types';
import { MapPin, Clock, AlertTriangle, Users, CheckCircle, Phone } from 'lucide-react';

interface ComplaintCardProps {
  complaint: Complaint;
  onClick: () => void;
}

export default function ComplaintCard({ complaint, onClick }: ComplaintCardProps) {
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
      case 'assigned': return 'text-blue-600 bg-blue-50';
      case 'in-progress': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 overflow-hidden"
    >
      <div className="aspect-video bg-gray-100 relative">
        <img
          src={complaint.photoUrl}
          alt="Complaint"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCriticalityColor(complaint.criticality)}`}>
            {complaint.criticality.toUpperCase()}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
            {complaint.status.replace('-', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-900 font-medium mb-3 line-clamp-2">
          {complaint.description}
        </p>

        <div className="flex items-start gap-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600 line-clamp-2">
            {complaint.locationName}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {formatDate(complaint.timeOfComplaint)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {complaint.estimatedWorkers} workers
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {complaint.userName}
              </span>
            </div>
            {complaint.userPhone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {complaint.userPhone}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <AlertTriangle className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Complexity: <span className="font-medium capitalize">{complaint.complexity}</span>
          </span>
        </div>
      </div>
    </div>
  );
}