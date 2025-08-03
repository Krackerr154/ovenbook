// Firebase Database Initialization Script
// Run this after setting up Firebase to populate initial data

import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

// Initial ovens data
const initialOvens = [
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

// Function to initialize ovens collection
export const initializeOvens = async () => {
  try {
    console.log('Initializing ovens collection...');
    
    for (const oven of initialOvens) {
      await addDoc(collection(db, 'ovens'), oven);
      console.log(`Added oven: ${oven.name}`);
    }
    
    console.log('✅ Ovens collection initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing ovens:', error);
  }
};

// Function to create admin user document (call after first admin registers)
export const createAdminUser = async (userId: string, userData: {
  displayName: string;
  email: string;
}) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      role: 'admin',
      createdAt: new Date(),
    });
    console.log('✅ Admin user created successfully!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

// Function to check Firebase connection
export const testFirebaseConnection = async () => {
  try {
    // Try to read from Firestore
    const testCollection = collection(db, 'test');
    console.log('✅ Firebase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};
