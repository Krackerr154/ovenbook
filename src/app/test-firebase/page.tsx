'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function FirebaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [authStatus, setAuthStatus] = useState('Not tested');
  const [firestoreStatus, setFirestoreStatus] = useState('Not tested');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  useEffect(() => {
    testFirebase();
  }, []);

  const testFirebase = async () => {
    try {
      addResult('🔥 Starting Firebase tests...');
      
      // Test 1: Basic Firebase initialization
      if (auth && db) {
        setConnectionStatus('✅ Connected');
        addResult('✅ Firebase services initialized successfully');
      } else {
        setConnectionStatus('❌ Failed');
        addResult('❌ Firebase services failed to initialize');
        return;
      }

      // Test 2: Test Firestore connection
      try {
        addResult('🔍 Testing Firestore connection...');
        const testCollection = collection(db, 'test');
        await getDocs(testCollection);
        setFirestoreStatus('✅ Connected');
        addResult('✅ Firestore connection successful');
      } catch (error) {
        setFirestoreStatus('❌ Failed');
        addResult(`❌ Firestore error: ${error}`);
      }

      // Test 3: Test Auth service
      try {
        addResult('🔍 Testing Auth service...');
        // Just checking if auth is available
        const currentUser = auth.currentUser;
        setAuthStatus('✅ Available');
        addResult(`✅ Auth service available. Current user: ${currentUser ? currentUser.email : 'None'}`);
      } catch (error) {
        setAuthStatus('❌ Failed');
        addResult(`❌ Auth error: ${error}`);
      }

    } catch (error) {
      setConnectionStatus('❌ Failed');
      addResult(`❌ General error: ${error}`);
    }
  };

  const testCreateUser = async () => {
    try {
      addResult('👤 Testing user creation...');
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'test123456';
      
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      addResult(`✅ User created successfully: ${userCredential.user.email}`);
      
      // Clean up - delete the test user
      await userCredential.user.delete();
      addResult(`🧹 Test user deleted`);
    } catch (error: any) {
      addResult(`❌ User creation failed: ${error.message}`);
    }
  };

  const testFirestore = async () => {
    try {
      addResult('📝 Testing Firestore write/read...');
      
      // Add a test document
      const testData = {
        message: 'Firebase test',
        timestamp: new Date(),
        testId: Date.now()
      };
      
      const docRef = await addDoc(collection(db, 'tests'), testData);
      addResult(`✅ Document written with ID: ${docRef.id}`);
      
      // Read back the test collection
      const querySnapshot = await getDocs(collection(db, 'tests'));
      addResult(`✅ Found ${querySnapshot.size} documents in tests collection`);
      
    } catch (error: any) {
      addResult(`❌ Firestore test failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔥 Firebase Connection Test</h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
            <p className="text-2xl">{connectionStatus}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Authentication</h3>
            <p className="text-2xl">{authStatus}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Firestore</h3>
            <p className="text-2xl">{firestoreStatus}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Manual Tests</h3>
          <div className="space-x-4">
            <button 
              onClick={testCreateUser}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test User Creation
            </button>
            <button 
              onClick={testFirestore}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test Firestore Write/Read
            </button>
            <button 
              onClick={testFirebase}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Re-run All Tests
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Test Results Log</h3>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to OvenBook App
          </a>
        </div>
      </div>
    </div>
  );
}
