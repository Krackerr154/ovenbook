'use client';

import { useState } from 'react';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function InitializePage() {
  const [status, setStatus] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const initializeOvens = async () => {
    setIsLoading(true);
    try {
      addStatus('🔧 Initializing ovens collection...');
      
      const ovens = [
        {
          name: 'Lab Oven A',
          description: 'High-temperature lab oven for material testing',
          status: 'available',
          location: 'Room 101',
          capacity: '50L',
          maxTemperature: 300,
          createdAt: new Date(),
        },
        {
          name: 'Lab Oven B',
          description: 'Medium-capacity oven for routine experiments',
          status: 'available',
          location: 'Room 102',
          capacity: '75L',
          maxTemperature: 400,
          createdAt: new Date(),
        },
        {
          name: 'Lab Oven C',
          description: 'Large industrial oven for bulk processing',
          status: 'maintenance',
          location: 'Room 103',
          capacity: '100L',
          maxTemperature: 500,
          createdAt: new Date(),
        },
      ];

      for (const oven of ovens) {
        const docRef = await addDoc(collection(db, 'ovens'), oven);
        addStatus(`✅ Added oven: ${oven.name} (ID: ${docRef.id})`);
      }
      
      addStatus('🎉 Ovens collection initialized successfully!');
    } catch (error: any) {
      addStatus(`❌ Error initializing ovens: ${error.message}`);
    }
    setIsLoading(false);
  };

  const createTestUser = async () => {
    setIsLoading(true);
    try {
      addStatus('👤 Creating test user...');
      
      const testEmail = 'test@ovenbook.com';
      const testPassword = 'test123456';
      
      // Create authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: 'Test User',
        email: testEmail,
        role: 'user',
        createdAt: new Date(),
      });
      
      addStatus(`✅ Test user created: ${testEmail}`);
      addStatus('🔑 Password: test123456');
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        addStatus('ℹ️ Test user already exists');
      } else {
        addStatus(`❌ Error creating test user: ${error.message}`);
      }
    }
    setIsLoading(false);
  };

  const createAdminUser = async () => {
    setIsLoading(true);
    try {
      addStatus('👑 Creating admin user...');
      
      const adminEmail = 'admin@ovenbook.com';
      const adminPassword = 'admin123456';
      
      // Create authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      
      // Create admin user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: 'Admin User',
        email: adminEmail,
        role: 'admin',
        createdAt: new Date(),
      });
      
      addStatus(`✅ Admin user created: ${adminEmail}`);
      addStatus('🔑 Password: admin123456');
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        addStatus('ℹ️ Admin user already exists');
      } else {
        addStatus(`❌ Error creating admin user: ${error.message}`);
      }
    }
    setIsLoading(false);
  };

  const createSampleBooking = async () => {
    setIsLoading(true);
    try {
      addStatus('📅 Creating sample booking...');
      
      const sampleBooking = {
        userId: 'sample-user-id',
        userName: 'Sample User',
        userEmail: 'sample@example.com',
        ovenId: 'sample-oven-id',
        ovenName: 'Lab Oven A',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow + 2 hours
        purpose: 'Sample experiment for testing',
        temperature: 250,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        canCancel: true,
      };
      
      const docRef = await addDoc(collection(db, 'bookings'), sampleBooking);
      addStatus(`✅ Sample booking created (ID: ${docRef.id})`);
      
    } catch (error: any) {
      addStatus(`❌ Error creating sample booking: ${error.message}`);
    }
    setIsLoading(false);
  };

  const initializeAll = async () => {
    await initializeOvens();
    await createTestUser();
    await createAdminUser();
    await createSampleBooking();
    addStatus('🎉 Database initialization complete!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🚀 Initialize OvenBook Database</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Database Setup</h3>
          <p className="text-gray-600 mb-6">
            Click the buttons below to set up your OvenBook database with initial data.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button 
              onClick={initializeOvens}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              🔧 Initialize Ovens
            </button>
            
            <button 
              onClick={createTestUser}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              👤 Create Test User
            </button>
            
            <button 
              onClick={createAdminUser}
              disabled={isLoading}
              className="bg-purple-500 text-white px-4 py-3 rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              👑 Create Admin User
            </button>
            
            <button 
              onClick={createSampleBooking}
              disabled={isLoading}
              className="bg-orange-500 text-white px-4 py-3 rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              📅 Create Sample Booking
            </button>
          </div>
          
          <button 
            onClick={initializeAll}
            disabled={isLoading}
            className="w-full bg-red-500 text-white px-4 py-3 rounded hover:bg-red-600 disabled:bg-gray-400 font-semibold"
          >
            🚀 Initialize Everything
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Status Log</h3>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {status.length === 0 ? (
              <p className="text-gray-500">Ready to initialize database...</p>
            ) : (
              status.map((message, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {message}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-yellow-800 mb-2">Test Credentials</h4>
          <div className="text-sm text-yellow-700">
            <p><strong>Regular User:</strong> test@ovenbook.com / test123456</p>
            <p><strong>Admin User:</strong> admin@ovenbook.com / admin123456</p>
          </div>
        </div>

        <div className="text-center">
          <a 
            href="/"
            className="text-blue-600 hover:text-blue-800 underline mr-4"
          >
            ← Back to OvenBook
          </a>
          <a 
            href="/test-firebase"
            className="text-green-600 hover:text-green-800 underline"
          >
            Test Firebase Connection →
          </a>
        </div>
      </div>
    </div>
  );
}
