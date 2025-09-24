export type Department = 'municipality' | 'electricity' | 'fire' | 'safe';

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userPhone: string | null;
  description: string;
  location: [number, number];
  locationName: string;
  photoUrl: string;
  status: 'submitted' | 'under-review' | 'assigned' | 'in-progress' | 'completed' | 'closed';
  criticality: 'low' | 'medium' | 'high';
  timeOfComplaint: string;
  assignedWorkers?: string[];
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedWorkers: number;
  complexity: string;
  timeLimit: string;
  isOpen: boolean;
  synopsis: string;
  departments: Department[];
  flags?: string[];
  aiSynopsis?: string;
  timeConstraint?: number;
  allowClose?: boolean;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  department: Department;
  location: [number, number];
  isWorking: boolean;
  rating: number;
  completedTasks: number;
  expertise: string[];
  distance?: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  flags: number;
  previousComplaints: string[];
}

export interface Notification {
  id: string;
  userId: string;
  complaintId: string;
  message: string;
  timestamp: any;
  isRead: boolean;
}
