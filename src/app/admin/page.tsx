'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Oven, Booking, User } from '@/types';
import { safeToDate } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Plus, Edit, Trash2, Users, Calendar, Wrench, AlertTriangle, X, Ban } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ovens' | 'bookings' | 'users'>('ovens');
  const [ovens, setOvens] = useState<Oven[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOvenModal, setShowOvenModal] = useState(false);
  const [editingOven, setEditingOven] = useState<Oven | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load ovens
      const ovensSnapshot = await getDocs(query(collection(db, 'ovens'), orderBy('name')));
      const ovensData = ovensSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          status: data.status,
          // Optional fields with defaults
          description: data.description || 'Lab oven for general use',
          maxTemperature: data.maxTemperature || 500,
          capacity: data.capacity || 'Standard',
          location: data.location || 'Lab',
          createdAt: safeToDate(data.createdAt) || new Date(),
        };
      }) as Oven[];

      // Load bookings
      const bookingsSnapshot = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')));
      const bookingsData = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          ovenId: data.ovenId,
          title: data.title,
          startTime: safeToDate(data.startTime),
          endTime: safeToDate(data.endTime),
          createdAt: safeToDate(data.createdAt),
          status: data.status || 'active', // Default to active if missing
          updatedAt: safeToDate(data.updatedAt) || safeToDate(data.createdAt),
          // Computed properties for compatibility
          purpose: data.title,
          userName: 'Loading...', // Will be populated from users
          userEmail: '',
          ovenName: 'Loading...', // Will be populated from ovens
          canCancel: false, // Admin view, different logic
        };
      }) as Booking[];

      // Load users
      const usersSnapshot = await getDocs(query(collection(db, 'users'), orderBy('name')));
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid || doc.id,
          name: data.name || data.displayName || '',
          email: data.email,
          isAdmin: data.isAdmin || false,
          createdAt: safeToDate(data.createdAt) || new Date(),
          // Computed properties for compatibility
          displayName: data.name || data.displayName || '',
          role: data.isAdmin ? 'admin' : 'user',
        };
      }) as User[];

      // Enrich bookings with user and oven data
      const enrichedBookings = bookingsData.map(booking => {
        const user = usersData.find(u => u.uid === booking.userId);
        const oven = ovensData.find(o => o.id === booking.ovenId);
        return {
          ...booking,
          userName: user?.name || 'Unknown User',
          userEmail: user?.email || '',
          ovenName: oven?.name || 'Unknown Oven'
        };
      });

      setOvens(ovensData);
      setBookings(enrichedBookings);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOven = async (ovenId: string) => {
    if (!confirm('Are you sure you want to delete this oven?')) return;

    try {
      await deleteDoc(doc(db, 'ovens', ovenId));
      loadData();
    } catch (error) {
      console.error('Error deleting oven:', error);
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    setCancellingBookingId(bookingId);
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async (reason: string, personalDetails?: string) => {
    if (!cancellingBookingId || !user) return;

    try {
      const cancellationReason = reason === 'Personal Request' && personalDetails 
        ? `${reason}: ${personalDetails}` 
        : reason;

      await updateDoc(doc(db, 'bookings', cancellingBookingId), {
        status: 'cancelled',
        updatedAt: new Date(),
        cancelledBy: user.uid || user.id,
        cancelledAt: new Date(),
        cancellationReason: cancellationReason,
      });

      setShowCancelModal(false);
      setCancellingBookingId(null);
      loadData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const handleToggleUserRole = async (userId: string, currentIsAdmin: boolean) => {
    const newIsAdmin = !currentIsAdmin;
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: newIsAdmin,
      });
      loadData();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = {
    totalOvens: ovens.length,
    availableOvens: ovens.filter(o => o.status === 'active').length, // Changed from 'available' to 'active'
    activeBookings: bookings.filter(b => b.status === 'active').length,
    totalUsers: users.length,
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage ovens, bookings, and users</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Ovens</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOvens}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.availableOvens}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('ovens')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'ovens'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Ovens ({ovens.length})
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'bookings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Bookings ({bookings.length})
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Users ({users.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Ovens Tab */}
              {activeTab === 'ovens' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Oven Management</h2>
                    <button
                      onClick={() => setShowOvenModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Oven
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Specifications
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ovens.map((oven) => (
                          <tr key={oven.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{oven.name}</div>
                                <div className="text-sm text-gray-500">{oven.description}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                oven.status === 'available' ? 'bg-green-100 text-green-800' :
                                oven.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {oven.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>
                                <p>Max: {oven.maxTemperature}°C</p>
                                <p>Capacity: {oven.capacity}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {oven.location}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setEditingOven(oven);
                                  setShowOvenModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteOven(oven.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Booking Management</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Oven
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Purpose
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{booking.userName}</div>
                                <div className="text-sm text-gray-500">{booking.userEmail}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {booking.ovenName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>
                                <p>{format(booking.startTime, 'MMM dd, yyyy')}</p>
                                <p>{format(booking.startTime, 'HH:mm')} - {format(booking.endTime, 'HH:mm')}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="max-w-xs truncate">{booking.purpose}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                booking.status === 'active' ? 'bg-green-100 text-green-800' :
                                booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {booking.status === 'active' && (
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-6">User Management</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.displayName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.isAdmin ? 'admin' : 'user'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(user.createdAt, 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleToggleUserRole(user.id, user.isAdmin)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                {user.isAdmin ? 'Make User' : 'Make Admin'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Oven Modal - You would implement this similar to BookingModal */}
        {showOvenModal && (
          <OvenModal
            oven={editingOven}
            onClose={() => {
              setShowOvenModal(false);
              setEditingOven(null);
            }}
            onSubmit={async (ovenData: OvenData) => {
              try {
                if (editingOven) {
                  await updateDoc(doc(db, 'ovens', editingOven.id), {
                    ...ovenData,
                    updatedAt: new Date(),
                  });
                } else {
                  await addDoc(collection(db, 'ovens'), {
                    ...ovenData,
                    createdAt: new Date(),
                  });
                }
                setShowOvenModal(false);
                setEditingOven(null);
                loadData();
              } catch (error) {
                console.error('Error saving oven:', error);
              }
            }}
          />
        )}

        {/* Cancellation Modal */}
        {showCancelModal && (
          <CancellationModal
            onClose={() => {
              setShowCancelModal(false);
              setCancellingBookingId(null);
            }}
            onConfirm={confirmCancelBooking}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// Oven Modal Component
interface OvenData {
  name: string;
  description: string;
  maxTemperature: number;
  capacity: string;
  location: string;
  status: string;
}

function OvenModal({ oven, onClose, onSubmit }: {
  oven: Oven | null;
  onClose: () => void;
  onSubmit: (data: OvenData) => void;
}) {
  const [name, setName] = useState(oven?.name || '');
  const [description, setDescription] = useState(oven?.description || '');
  const [maxTemperature, setMaxTemperature] = useState(oven?.maxTemperature?.toString() || '');
  const [capacity, setCapacity] = useState(oven?.capacity || '');
  const [location, setLocation] = useState(oven?.location || '');
  const [status, setStatus] = useState(oven?.status || 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      maxTemperature: parseInt(maxTemperature),
      capacity,
      location,
      status,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {oven ? 'Edit Oven' : 'Add New Oven'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Temperature (°C)</label>
            <input
              type="number"
              value={maxTemperature}
              onChange={(e) => setMaxTemperature(e.target.value)}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="text"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              placeholder="e.g., 50L, 12 samples"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="e.g., Lab Room 101"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="out-of-order">Out of Order</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {oven ? 'Update' : 'Create'} Oven
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Cancellation Modal Component
function CancellationModal({ onClose, onConfirm }: {
  onClose: () => void;
  onConfirm: (reason: string, personalDetails?: string) => void;
}) {
  const [reason, setReason] = useState('Wrong schedule');
  const [personalDetails, setPersonalDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onConfirm(reason, personalDetails);
    } catch (error) {
      console.error('Error confirming cancellation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Ban className="h-5 w-5 text-red-500 mr-2" />
            Cancel Booking
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Wrong schedule">Wrong schedule</option>
              <option value="Overlap">Overlap</option>
              <option value="Personal Request">Personal Request</option>
            </select>
          </div>

          {reason === 'Personal Request' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                value={personalDetails}
                onChange={(e) => setPersonalDetails(e.target.value)}
                required
                rows={3}
                placeholder="Please provide details for the personal request..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">
              <strong>Warning:</strong> This action will permanently cancel the booking and cannot be undone.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Keep Booking
            </button>
            <button
              type="submit"
              disabled={loading || (reason === 'Personal Request' && !personalDetails.trim())}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cancelling...
                </div>
              ) : (
                'Cancel Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
