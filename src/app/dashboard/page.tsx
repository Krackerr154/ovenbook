'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Booking, Oven } from '@/types';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import BookingCalendar from '@/components/BookingCalendar';
import BookingModal from '@/components/BookingModal';
import { Plus, Calendar, Clock, AlertCircle } from 'lucide-react';
import { isAfter, addHours, format, differenceInDays } from 'date-fns';
import { safeToDate } from '@/lib/utils';

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ovens, setOvens] = useState<Oven[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedOven, setSelectedOven] = useState<Oven | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]); // Remove loadData from dependencies to avoid infinite loop

  const loadData = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Loading dashboard data for user:', user.email);
      
      // Load user bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid || user.id)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      console.log('📅 Found', bookingsSnapshot.docs.length, 'bookings');
      
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
          userName: user.name || user.displayName,
          userEmail: user.email,
          ovenName: '', // Will be populated later
          canCancel: data.startTime ? isAfter(safeToDate(data.startTime), addHours(new Date(), 1)) : false
        };
      }) as Booking[];

      // Load all ovens
      const ovensQuery = collection(db, 'ovens');
      const ovensSnapshot = await getDocs(ovensQuery);
      console.log('🔥 Found', ovensSnapshot.docs.length, 'ovens in Firebase');
      
      const ovensData = ovensSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('🔧 Oven data:', { id: doc.id, name: data.name, status: data.status });
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

      // Update booking data with oven names
      const enrichedBookings = bookingsData.map(booking => {
        const oven = ovensData.find(o => o.id === booking.ovenId);
        return {
          ...booking,
          ovenName: oven?.name || 'Unknown Oven'
        };
      });

      console.log('✅ Setting ovens state with', ovensData.length, 'ovens');
      setBookings(enrichedBookings);
      setOvens(ovensData);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };  const handleCreateBooking = async (bookingData: {
    startTime: Date;
    endTime: Date;
    purpose: string;
    temperature?: number;
  }) => {
    if (!user || !selectedOven) return;

    try {
      // Validate booking constraints
      const activeUserBookings = bookings.filter(b => 
        b.status === 'active' && b.userId === (user.uid || user.id)
      );

      // Check maximum active bookings limit
      if (activeUserBookings.length >= 2) {
        alert('You already have 2 active bookings. Please cancel an existing booking first.');
        return;
      }

      // Check maximum booking duration (7 days)
      const duration = differenceInDays(bookingData.endTime, bookingData.startTime) + 1;
      if (duration > 7) {
        alert('Booking duration cannot exceed 7 days.');
        return;
      }

      // Check for conflicts with existing bookings for this oven
      const hasConflict = bookings.some(booking => 
        booking.ovenId === selectedOven.id &&
        booking.status === 'active' &&
        booking.id !== bookingData.startTime.getTime().toString() && // Exclude current booking if editing
        !(bookingData.endTime <= booking.startTime || bookingData.startTime >= booking.endTime)
      );

      if (hasConflict) {
        alert('This oven is already booked during the selected time period. Please choose different dates/times.');
        return;
      }

      console.log('🚀 Creating booking with data:', {
        userId: user.uid || user.id,
        userEmail: user.email,
        ovenId: selectedOven.id,
        ovenName: selectedOven.name,
        title: bookingData.purpose,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
      });

      await addDoc(collection(db, 'bookings'), {
        userId: user.uid || user.id,
        ovenId: selectedOven.id,
        title: bookingData.purpose, // Use title field instead of purpose
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        status: 'active', // Add status field
        createdAt: new Date(),
        updatedAt: new Date(), // Add updatedAt field
      });

      console.log('✅ Booking created successfully');

      setShowBookingModal(false);
      setSelectedOven(null);
      setSelectedDate(null);
      loadData();
    } catch (error: any) {
      console.error('❌ Error creating booking:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        user: user?.email,
        oven: selectedOven?.name
      });
      alert(`Failed to create booking: ${error?.message || error}`);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled',
        updatedAt: new Date(),
      });
      loadData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const activeBookings = bookings.filter(b => b.status === 'active');
  const upcomingBookings = activeBookings.filter(b => isAfter(b.startTime, new Date()));
  const currentBookings = activeBookings.filter(b => 
    b.startTime <= new Date() && b.endTime > new Date()
  );
  const userActiveBookings = activeBookings.filter(b => b.userId === (user?.uid || user?.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Manage your oven bookings</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Your Active Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{userActiveBookings.length}<span className="text-sm text-gray-500 ml-1">/2</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Upcoming Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Current Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{currentBookings.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Available Ovens</p>
                  <p className="text-2xl font-bold text-gray-900">{ovens.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar View */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Booking Calendar</h2>
              </div>
              <div className="p-6">
                <BookingCalendar
                  bookings={bookings}
                  onDateSelect={(date: Date) => setSelectedDate(date)}
                />
              </div>
            </div>

            {/* Available Ovens */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Available Ovens</h2>
              </div>
              <div className="p-6">
                {ovens.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No ovens available</p>
                ) : (
                  <div className="space-y-4">
                    {ovens.map((oven) => (
                      <div key={oven.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{oven.name}</h3>
                            <p className="text-sm text-gray-500">{oven.description}</p>
                            <div className="mt-2 text-sm text-gray-600">
                              <p>Max Temperature: {oven.maxTemperature}°C</p>
                              <p>Capacity: {oven.capacity}</p>
                              <p>Location: {oven.location}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedOven(oven);
                              setShowBookingModal(true);
                            }}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Your Bookings</h2>
            </div>
            <div className="p-6">
              {bookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bookings found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.ovenName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <p>{format(booking.startTime, 'MMM dd, yyyy')} - {format(booking.endTime, 'MMM dd, yyyy')}</p>
                              <p className="text-xs text-gray-400">
                                {format(booking.startTime, 'HH:mm')} - {format(booking.endTime, 'HH:mm')}
                                {differenceInDays(booking.endTime, booking.startTime) + 1 > 1 && (
                                  <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    {differenceInDays(booking.endTime, booking.startTime) + 1} days
                                  </span>
                                )}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.purpose}
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
                            {booking.canCancel && booking.status === 'active' && (
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
              )}
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && selectedOven && (
          <BookingModal
            oven={selectedOven}
            selectedDate={selectedDate}
            userActiveBookings={userActiveBookings.length}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedOven(null);
              setSelectedDate(null);
            }}
            onSubmit={handleCreateBooking}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
