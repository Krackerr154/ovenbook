'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { safeToDate, safeCopyToClipboard } from '@/lib/utils';

export default function ErrorTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testClipboard = async () => {
    addResult('🧪 Testing clipboard functionality...');
    const testText = 'Hello from OvenBook clipboard test!';
    
    const success = await safeCopyToClipboard(testText);
    if (success) {
      addResult('✅ Clipboard test successful - text copied safely');
    } else {
      addResult('⚠️ Clipboard test failed gracefully - this is expected in VS Code Simple Browser');
    }
  };

  const testTimestampConversion = () => {
    addResult('🧪 Testing timestamp conversion...');
    
    // Test various timestamp formats
    const testCases = [
      { name: 'Firebase Timestamp', value: { toDate: () => new Date('2023-01-01') } },
      { name: 'Date object', value: new Date('2023-01-01') },
      { name: 'String date', value: '2023-01-01' },
      { name: 'Unix timestamp', value: 1672531200000 },
      { name: 'Null value', value: null },
      { name: 'Undefined value', value: undefined },
      { name: 'Invalid object', value: { invalid: 'object' } },
    ];

    testCases.forEach(testCase => {
      try {
        const result = safeToDate(testCase.value);
        addResult(`✅ ${testCase.name}: ${result.toISOString()}`);
      } catch (error) {
        addResult(`❌ ${testCase.name}: Failed - ${error}`);
      }
    });
    
    addResult('✅ All timestamp conversion tests completed');
  };

  const testFirebaseRead = async () => {
    setIsLoading(true);
    addResult('🧪 Testing Firebase read with safe timestamp conversion...');
    
    try {
      // Try to read from users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      addResult(`✅ Successfully read ${usersSnapshot.docs.length} user documents`);
      
      // Test safe conversion on actual Firebase data
      usersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const safeCreatedAt = safeToDate(data.createdAt);
        addResult(`✅ User ${index + 1}: createdAt converted safely to ${safeCreatedAt.toISOString()}`);
      });
      
      // Try to read from ovens collection
      const ovensSnapshot = await getDocs(collection(db, 'ovens'));
      addResult(`✅ Successfully read ${ovensSnapshot.docs.length} oven documents`);
      
      // Try to read from bookings collection
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      addResult(`✅ Successfully read ${bookingsSnapshot.docs.length} booking documents`);
      
    } catch (error: any) {
      addResult(`❌ Firebase read test failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const testFirebaseWrite = async () => {
    setIsLoading(true);
    addResult('🧪 Testing Firebase write with proper timestamp handling...');
    
    try {
      const testDoc = {
        testMessage: 'Error handling test',
        createdAt: new Date(),
        testNumber: Math.random(),
      };
      
      const docRef = await addDoc(collection(db, 'test_errors'), testDoc);
      addResult(`✅ Successfully wrote test document: ${docRef.id}`);
      
      // Read it back and test conversion
      const snapshot = await getDocs(collection(db, 'test_errors'));
      const testData = snapshot.docs.find(doc => doc.id === docRef.id)?.data();
      
      if (testData) {
        const safeCreatedAt = safeToDate(testData.createdAt);
        addResult(`✅ Successfully read back and converted timestamp: ${safeCreatedAt.toISOString()}`);
      }
      
    } catch (error: any) {
      addResult(`❌ Firebase write test failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult('🚀 Starting comprehensive error handling tests...');
    
    testTimestampConversion();
    await testClipboard();
    await testFirebaseRead();
    await testFirebaseWrite();
    
    addResult('🎉 All tests completed!');
  };

  useEffect(() => {
    // Run basic tests on component mount
    testTimestampConversion();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🐛 Error Testing & Debugging</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Error Resolution Status</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ Fixed Issues</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Clipboard API errors (safe fallback implemented)</li>
                <li>• Firebase Timestamp toDate() errors (safe conversion)</li>
                <li>• Undefined property access protection</li>
                <li>• Error boundary and fallback handling</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🔧 Improvements Made</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Safe timestamp conversion utility</li>
                <li>• Clipboard operation with fallbacks</li>
                <li>• Better error logging and handling</li>
                <li>• Graceful degradation for browser limitations</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Test Functions</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={testClipboard}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              📋 Test Clipboard API
            </button>
            
            <button
              onClick={testTimestampConversion}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              📅 Test Timestamp Conversion
            </button>
            
            <button
              onClick={testFirebaseRead}
              disabled={isLoading}
              className="bg-purple-500 text-white px-4 py-3 rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              🔥 Test Firebase Read
            </button>
            
            <button
              onClick={testFirebaseWrite}
              disabled={isLoading}
              className="bg-orange-500 text-white px-4 py-3 rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              ✍️ Test Firebase Write
            </button>
          </div>
          
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="w-full bg-red-500 text-white px-4 py-3 rounded hover:bg-red-600 disabled:bg-gray-400 font-semibold"
          >
            {isLoading ? '⏳ Running Tests...' : '🚀 Run All Tests'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Run some tests to see results here.</p>
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
            className="text-blue-600 hover:text-blue-800 underline mr-4"
          >
            ← Back to OvenBook
          </a>
          <a 
            href="/test-firebase"
            className="text-green-600 hover:text-green-800 underline"
          >
            Firebase Tests →
          </a>
        </div>
      </div>
    </div>
  );
}
