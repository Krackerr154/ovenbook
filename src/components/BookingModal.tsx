'use client';

import { useState, useEffect } from 'react';
import { Oven } from '@/types';
import { X, Calendar, Clock, Thermometer, FileText, AlertCircle } from 'lucide-react';
import { format, setHours, setMinutes, addDays, differenceInDays } from 'date-fns';

interface BookingModalProps {
  oven: Oven;
  selectedDate: Date | null;
  onClose: () => void;
  onSubmit: (bookingData: {
    startTime: Date;
    endTime: Date;
    purpose: string;
    temperature?: number;
  }) => void;
  userActiveBookings?: number; // Number of active bookings for the user
}

export default function BookingModal({ oven, selectedDate, onClose, onSubmit, userActiveBookings = 0 }: BookingModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [purpose, setPurpose] = useState('');
  const [temperature, setTemperature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else {
      const today = format(new Date(), 'yyyy-MM-dd');
      setStartDate(today);
      setEndDate(today);
    }
  }, [selectedDate]);

  // Calculate booking duration
  const getDurationInDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return differenceInDays(end, start) + 1; // +1 to include both start and end days
  };

  // Validate booking constraints
  const validateBooking = () => {
    setError('');

    // Check if user has reached maximum active bookings
    if (userActiveBookings >= 2) {
      setError('You already have 2 active bookings. Please cancel an existing booking first.');
      return false;
    }

    // Check if end date is before start date
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date.');
      return false;
    }

    // Check if booking duration exceeds 7 days
    const duration = getDurationInDays();
    if (duration > 7) {
      setError('Booking duration cannot exceed 7 days.');
      return false;
    }

    // Check if start time is before end time (for same day bookings)
    if (startDate === endDate && startTime >= endTime) {
      setError('End time must be after start time.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !startTime || !endTime || !purpose) return;

    if (!validateBooking()) return;

    setLoading(true);

    try {
      // For multi-day bookings, use start date with start time and end date with end time
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startDateTime = setMinutes(setHours(start, startHour), startMinute);
      const endDateTime = setMinutes(setHours(end, endHour), endMinute);

      const bookingData = {
        startTime: startDateTime,
        endTime: endDateTime,
        purpose,
        temperature: temperature ? parseInt(temperature) : undefined,
      };

      await onSubmit(bookingData);
    } catch (error) {
      console.error('Error submitting booking:', error);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Book {oven.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* User Booking Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-600">
                <p className="font-medium">Booking Limits:</p>
                <p>• Maximum 7 days per booking</p>
                <p>• Maximum 2 active bookings per user</p>
                <p>• Current active bookings: {userActiveBookings}/2</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Oven Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Max Temperature: {oven.maxTemperature}°C</p>
              <p>Capacity: {oven.capacity}</p>
              <p>Location: {oven.location}</p>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || format(new Date(), 'yyyy-MM-dd')}
                max={startDate ? format(addDays(new Date(startDate), 6), 'yyyy-MM-dd') : undefined}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Duration Display */}
          {startDate && endDate && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Duration:</strong> {getDurationInDays()} day{getDurationInDays() !== 1 ? 's' : ''}
                {getDurationInDays() > 7 && <span className="text-red-600 ml-2">⚠️ Exceeds 7-day limit</span>}
              </p>
            </div>
          )}

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Daily Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Start time for each day</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Daily End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">End time for each day</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Thermometer className="h-4 w-4 inline mr-1" />
              Temperature (°C) - Optional
            </label>
            <input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              min="1"
              max={oven.maxTemperature}
              placeholder={`Max ${oven.maxTemperature}°C`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Purpose
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              rows={3}
              placeholder="Describe what you'll be using the oven for..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              ) : (
                'Book Oven'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
