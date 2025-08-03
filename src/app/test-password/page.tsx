'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordTestPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
    setClickCount(count => count + 1);
    console.log('Password visibility toggled:', !showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">👁️ Password Visibility Test</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Test Password Field with Eye Icon</h2>
          
          {/* Test Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Current Status:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>Password Visible: <strong>{showPassword ? 'YES' : 'NO'}</strong></li>
              <li>Input Type: <strong>{showPassword ? 'text' : 'password'}</strong></li>
              <li>Icon Showing: <strong>{showPassword ? 'EyeOff (Hide)' : 'Eye (Show)'}</strong></li>
              <li>Click Count: <strong>{clickCount}</strong></li>
            </ul>
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label htmlFor="test-password" className="block text-sm font-medium text-gray-700 mb-2">
              Test Password Field
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="test-password"
                name="test-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Type a password to test..."
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-r-md transition-colors duration-200"
                onClick={handleTogglePassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-600 hover:text-gray-800 cursor-pointer" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-600 hover:text-gray-800 cursor-pointer" />
                )}
              </button>
            </div>
          </div>

          {/* Manual Test Buttons */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold">Manual Controls:</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPassword(true)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                👁️ Show Password
              </button>
              <button
                onClick={() => setShowPassword(false)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                🙈 Hide Password
              </button>
              <button
                onClick={handleTogglePassword}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                🔄 Toggle
              </button>
            </div>
          </div>

          {/* Visual Feedback */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Visual Feedback:</h3>
            <div className="text-sm">
              <p><strong>Password Value:</strong> "{password}"</p>
              <p><strong>Display Mode:</strong> {showPassword ? '🔓 Plain Text' : '🔒 Hidden (dots)'}</p>
              <p><strong>Button Icon:</strong> {showPassword ? '👁️‍🗨️ EyeOff' : '👁️ Eye'}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Test Instructions:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Type some text in the password field above</li>
              <li>2. Click the eye icon to toggle visibility</li>
              <li>3. Watch the text change from dots to plain text</li>
              <li>4. Check that the icon changes between Eye and EyeOff</li>
              <li>5. Try the manual control buttons to verify functionality</li>
            </ol>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="/login"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
