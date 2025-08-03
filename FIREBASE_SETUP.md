# 🔥 Firebase Setup Guide for OvenBook

This guide will help you connect the OvenBook application to Firebase for full functionality with real data persistence.

## 📋 Prerequisites

- A Google account
- The OvenBook application running locally
- Basic understanding of Firebase

## 🚀 Step-by-Step Setup

### Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project"
   - Project name: `ovenbook-lab` (or your preferred name)
   - Accept Firebase terms
   - Enable/disable Google Analytics (optional)
   - Click "Create project"
   - Wait for project creation to complete

### Step 2: Set Up Authentication

1. **Navigate to Authentication**
   - In the Firebase console, click "Authentication" in the left sidebar
   - Click "Get started"

2. **Configure Sign-in Methods**
   - Go to the "Sign-in method" tab
   - Click on "Email/Password"
   - Toggle "Enable" to turn it on
   - Click "Save"

### Step 3: Create Firestore Database

1. **Navigate to Firestore**
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"

2. **Set Security Rules**
   - Choose "Start in test mode" (for development)
   - This allows read/write access for 30 days
   - Click "Next"

3. **Choose Location**
   - Select your preferred location (closest to you)
   - Click "Done"

### Step 4: Get Firebase Configuration

1. **Register Web App**
   - In Project Overview, click the web icon `</>`
   - App nickname: `OvenBook Web App`
   - Don't check "Firebase Hosting" for now
   - Click "Register app"

2. **Copy Configuration**
   - You'll see a code snippet like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
   - **Copy these values** - you'll need them in the next step

### Step 5: Configure OvenBook Application

1. **Update Environment Variables**
   - Open the `.env.local` file in your OvenBook project
   - Replace the placeholder values with your Firebase config:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_DEVELOPMENT_MODE=false
   ```

2. **Restart Development Server**
   - Stop the current server (Ctrl+C)
   - Run: `npm run dev`
   - Server should start on http://localhost:3000

### Step 6: Test the Connection

1. **Open OvenBook Application**
   - Go to http://localhost:3000
   - Navigate to the login page

2. **Create First User Account**
   - Click "Register" or go to registration
   - Fill in user details:
     - Name: Your Name
     - Email: your.email@example.com
     - Password: (choose a secure password)
   - Click "Register"

3. **Verify in Firebase Console**
   - Go back to Firebase Console > Authentication > Users
   - You should see your newly created user

### Step 7: Initialize Database Collections

1. **Set Up Initial Data**
   - The app will automatically create collections when you:
     - Register users (creates `users` collection)
     - Create bookings (creates `bookings` collection)
   
2. **Add Sample Ovens** (Optional)
   - Go to Firestore Database in Firebase Console
   - Click "Start collection"
   - Collection ID: `ovens`
   - Add documents with these fields:
     ```
     Document 1:
     - name: "Lab Oven A"
     - description: "High-temperature lab oven"
     - status: "available"
     - location: "Room 101"
     - capacity: "50L"
     - maxTemperature: 300
     - createdAt: (timestamp)
     ```

### Step 8: Create Admin User

1. **Register Admin Account**
   - Register normally through the app
   - Note the user ID from Authentication > Users in Firebase

2. **Update User Role**
   - In Firestore Database, go to `users` collection
   - Find your user document
   - Edit the `role` field from "user" to "admin"
   - Save changes

3. **Test Admin Access**
   - Logout and login again
   - You should now see the Admin panel in navigation

## 🔒 Security Rules (Production)

For production, update Firestore security rules:

1. **Go to Firestore > Rules**
2. **Replace with these rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        resource.data.role == 'admin' || 
        request.auth.uid == userId;
    }
    
    // All authenticated users can read ovens
    match /ovens/{ovenId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users can manage their own bookings
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

3. **Click "Publish"**

## ✅ Testing Checklist

After setup, test these features:

- [ ] User registration and login
- [ ] User authentication persistence
- [ ] Dashboard loads with real data
- [ ] Create new booking
- [ ] View bookings in calendar
- [ ] Cancel booking (within 1 hour)
- [ ] Admin panel access (if admin user)
- [ ] Admin: manage ovens
- [ ] Admin: view all bookings

## 🐛 Troubleshooting

**Common Issues:**

1. **"Firebase not initialized"**
   - Check environment variables are correct
   - Restart development server

2. **"Permission denied"**
   - Verify Firestore rules allow your operations
   - Check user authentication status

3. **"Network error"**
   - Check internet connection
   - Verify Firebase project is active

4. **"User not found in Firestore"**
   - User document should be created automatically on registration
   - Check Firestore console for `users` collection

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Verify Firebase Console settings
3. Check Firestore security rules
4. Ensure environment variables are correct

## 🎉 Success!

Once connected, you'll have:
- ✅ Real user authentication
- ✅ Persistent data storage
- ✅ Real-time updates
- ✅ Multi-user support
- ✅ Admin functionality
- ✅ Production-ready setup
