export interface Complaint {
  id: string;
  aiSynopsis: string;
  complexity: 'low' | 'medium' | 'high';
  criticality: 'low' | 'medium' | 'high';
  departments: string[];
  description: string;
  estimatedWorkers: number;
  isOpen: boolean;
  location: [number, number];
  locationName: string;
  photoDeleteUrl: string;
  photoUrl: string;
  status: 'submitted' | 'assigned' | 'in-progress' | 'completed' | 'under-review';
  timeOfComplaint: string;
  timestamp: any;
  userId: string;
  userName: string;
  userPhone: string;
  assignedWorkers?: string[];
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  timeConstraint?: number; // in hours
  flags?: ('false-case' | 'spam')[];
}

export interface Worker {
  id: string;
  name: string;
  department: string;
  location: [number, number];
  isWorking: boolean;
  phone: string;
  expertise: string[];
  rating: number;
  completedTasks: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  flags: number;
  location: [number, number];
  previousComplaints: string[];
  falseReports: number;
}

export interface DepartmentHead {
  id: string;
  department: string;
  name: string;
  email: string;
}

export type Department = 
  | 'municipality' 
  | 'water' 
  | 'electricity' 
  | 'waste' 
  | 'health' 
  | 'security' 
  | 'environment' 
  | 'roads' 
  | 'sanitation';