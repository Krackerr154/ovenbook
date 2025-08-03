'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Oven, Booking, User } from '@/types';
import { safeToDate } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import BookingCalendar from '@/components/BookingCalendar';
import { Plus, Edit, Trash2, Users, Calendar, Wrench, AlertTriangle, X, Ban, Filter, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ovens' | 'bookings' | 'users' | 'calendar'>('bookings');
  const [ovens, setOvens] = useState<Oven[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOvenModal, setShowOvenModal] = useState(false);
  const [editingOven, setEditingOven] = useState<Oven | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  
  // New state for enhanced booking management
  const [bookingFilters, setBookingFilters] = useState({
    status: 'all', // all, active, completed, cancelled
    user: 'all',
    oven: 'all',
    dateRange: 'all', // all, today, week, month
    search: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'user' | 'oven' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // Filter and sort bookings
  const getFilteredAndSortedBookings = () => {
    let filteredBookings = [...bookings];

    // Apply filters
    if (bookingFilters.status !== 'all') {
      filteredBookings = filteredBookings.filter(b => b.status === bookingFilters.status);
    }

    if (bookingFilters.user !== 'all') {
      filteredBookings = filteredBookings.filter(b => b.userId === bookingFilters.user);
    }

    if (bookingFilters.oven !== 'all') {
      filteredBookings = filteredBookings.filter(b => b.ovenId === bookingFilters.oven);
    }

    if (bookingFilters.search) {
      const searchLower = bookingFilters.search.toLowerCase();
      filteredBookings = filteredBookings.filter(b => 
        b.userName.toLowerCase().includes(searchLower) ||
        b.ovenName.toLowerCase().includes(searchLower) ||
        b.title.toLowerCase().includes(searchLower) ||
        b.userEmail.toLowerCase().includes(searchLower)
      );
    }

    // Apply date range filter
    const now = new Date();
    if (bookingFilters.dateRange !== 'all') {
      switch (bookingFilters.dateRange) {
        case 'today':
          filteredBookings = filteredBookings.filter(b => {
            const bookingDate = startOfDay(b.startTime);
            const today = startOfDay(now);
            return bookingDate.getTime() === today.getTime();
          });
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredBookings = filteredBookings.filter(b => 
            isAfter(b.startTime, weekAgo) && isBefore(b.startTime, endOfDay(now))
          );
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredBookings = filteredBookings.filter(b => 
            isAfter(b.startTime, monthAgo) && isBefore(b.startTime, endOfDay(now))
          );
          break;
      }
    }

    // Apply sorting
    filteredBookings.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          compareValue = a.startTime.getTime() - b.startTime.getTime();
          break;
        case 'user':
          compareValue = a.userName.localeCompare(b.userName);
          break;
        case 'oven':
          compareValue = a.ovenName.localeCompare(b.ovenName);
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filteredBookings;
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
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

  const filteredBookings = getFilteredAndSortedBookings();
  
  const stats = {
    totalOvens: ovens.length,
    availableOvens: ovens.filter(o => o.status === 'active').length,
    activeBookings: bookings.filter(b => b.status === 'active').length,
    totalUsers: users.length,
    filteredBookings: filteredBookings.length,
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
                  onClick={() => setActiveTab('bookings')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'bookings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  All Bookings ({filteredBookings.length})
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'calendar'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Calendar View
                </button>
                <button
                  onClick={() => setActiveTab('ovens')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'ovens'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Wrench className="h-4 w-4 inline mr-2" />
                  Ovens ({ovens.length})
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
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
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">All Bookings Management</h2>
                    <div className="text-sm text-gray-500">
                      Showing {filteredBookings.length} of {bookings.length} bookings
                    </div>
                  </div>

                  {/* Filters and Search */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="User, oven, purpose..."
                            value={bookingFilters.search}
                            onChange={(e) => setBookingFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
                          />
                        </div>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={bookingFilters.status}
                          onChange={(e) => setBookingFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      {/* User Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                        <select
                          value={bookingFilters.user}
                          onChange={(e) => setBookingFilters(prev => ({ ...prev, user: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Users</option>
                          {users.map(user => (
                            <option key={user.uid} value={user.uid}>{user.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Oven Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Oven</label>
                        <select
                          value={bookingFilters.oven}
                          onChange={(e) => setBookingFilters(prev => ({ ...prev, oven: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Ovens</option>
                          {ovens.map(oven => (
                            <option key={oven.id} value={oven.id}>{oven.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex flex-wrap gap-2">
                      <label className="block text-sm font-medium text-gray-700 mr-2">Date Range:</label>
                      {['all', 'today', 'week', 'month'].map(range => (
                        <button
                          key={range}
                          onClick={() => setBookingFilters(prev => ({ ...prev, dateRange: range }))}
                          className={`px-3 py-1 text-sm rounded-md ${
                            bookingFilters.dateRange === range
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSortChange('user')}
                          >
                            <div className="flex items-center">
                              User
                              <ChevronDown className={`ml-1 h-4 w-4 transform ${sortBy === 'user' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSortChange('oven')}
                          >
                            <div className="flex items-center">
                              Oven
                              <ChevronDown className={`ml-1 h-4 w-4 transform ${sortBy === 'oven' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSortChange('date')}
                          >
                            <div className="flex items-center">
                              Date & Time
                              <ChevronDown className={`ml-1 h-4 w-4 transform ${sortBy === 'date' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Purpose
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSortChange('status')}
                          >
                            <div className="flex items-center">
                              Status
                              <ChevronDown className={`ml-1 h-4 w-4 transform ${sortBy === 'status' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBookings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                              No bookings found matching your filters
                            </td>
                          </tr>
                        ) : (
                          filteredBookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
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
                                <div className="max-w-xs truncate">{booking.title}</div>
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
                                    <Ban className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Calendar Tab */}
              {activeTab === 'calendar' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Booking Calendar View</h2>
                    <div className="text-sm text-gray-500">
                      Visual overview of all bookings
                    </div>
                  </div>

                  {/* Calendar Legend */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                        <span className="text-sm text-gray-600">Active Booking</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                        <span className="text-sm text-gray-600">Completed Booking</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                        <span className="text-sm text-gray-600">Cancelled Booking</span>
                      </div>
                    </div>
                  </div>

                  {/* Calendar Component Placeholder */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
                      <p className="text-gray-500 mb-4">
                        Advanced calendar component will be integrated here to show all bookings visually.
                      </p>
                      
                      {/* Simple calendar grid for now */}
                      <div className="mt-8 max-w-4xl mx-auto">
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                          <div className="p-2 font-medium text-gray-700">Sun</div>
                          <div className="p-2 font-medium text-gray-700">Mon</div>
                          <div className="p-2 font-medium text-gray-700">Tue</div>
                          <div className="p-2 font-medium text-gray-700">Wed</div>
                          <div className="p-2 font-medium text-gray-700">Thu</div>
                          <div className="p-2 font-medium text-gray-700">Fri</div>
                          <div className="p-2 font-medium text-gray-700">Sat</div>
                          
                          {/* Sample calendar days with booking indicators */}
                          {Array.from({ length: 35 }, (_, i) => {
                            const day = i - 6 + 1;
                            const hasBooking = Math.random() > 0.7; // Sample booking distribution
                            const bookingStatus = ['active', 'completed', 'cancelled'][Math.floor(Math.random() * 3)];
                            
                            return (
                              <div key={i} className="p-2 h-16 border border-gray-100 relative">
                                {day > 0 && day <= 31 && (
                                  <div className="text-gray-700">{day}</div>
                                )}
                                {hasBooking && day > 0 && day <= 31 && (
                                  <div className={`absolute bottom-1 left-1 right-1 h-1 rounded ${
                                    bookingStatus === 'active' ? 'bg-green-500' :
                                    bookingStatus === 'completed' ? 'bg-blue-500' :
                                    'bg-red-500'
                                  }`}></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
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
