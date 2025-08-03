export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  // Computed properties
  displayName?: string; // Will be computed from name
  role?: 'user' | 'admin'; // Will be computed from isAdmin
}

export interface Oven {
  id: string;
  name: string;
  status: string; // 'active', 'maintenance', etc.
  // Optional fields that might be missing in Firebase
  description?: string;
  maxTemperature?: number;
  capacity?: string;
  location?: string;
  createdAt?: Date;
}

export interface Booking {
  id: string;
  userId: string;
  ovenId: string;
  title: string; // This is the purpose/description
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled'; // Make this required
  updatedAt: Date; // Make this required
  // Optional tracking fields
  cancelledBy?: string; // User ID who cancelled
  cancelledAt?: Date; // When cancelled
  cancellationReason?: string; // Why cancelled
  // Computed properties
  userName?: string; // Will be fetched from user data
  userEmail?: string; // Will be fetched from user data
  ovenName?: string; // Will be fetched from oven data
  purpose?: string; // Will use title
  canCancel?: boolean; // Will be computed
}

export interface BookingSlot {
  start: Date;
  end: Date;
  available: boolean;
  bookingId?: string;
}
