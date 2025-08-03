# Firebase Security Rules for OvenBook

Add these rules to your Firestore Database in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read/write their own data, admins can read/write all
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    
    // Ovens collection - authenticated users can read, only admins can write
    match /ovens/{ovenId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Bookings collection - users can create their own bookings, admins can manage all
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow delete: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
  }
}
```

## How to Update Security Rules:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `lab-scheduler-prod`
3. Go to **Firestore Database** → **Rules**
4. Replace the existing rules with the rules above
5. Click **Publish**

## Common Issues & Solutions:

### Issue 1: Permission Denied
- **Cause**: Security rules blocking booking creation
- **Fix**: Update rules as shown above

### Issue 2: User not authenticated
- **Cause**: User object is null or missing uid
- **Fix**: Make sure user is logged in before booking

### Issue 3: Missing required fields
- **Cause**: Booking data missing required fields
- **Fix**: Ensure all required fields are included

### Issue 4: Firebase connection issues
- **Cause**: Environment variables not loaded
- **Fix**: Verify .env.local is properly configured
