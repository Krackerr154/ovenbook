<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# OvenBook - Lab Equipment Booking System

This is a full-stack Next.js application for managing lab equipment bookings with Firebase as the backend.

## Project Structure

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS with Lucide React icons

## Key Features

1. **User Authentication**: Registration, login, and role-based access control
2. **Booking System**: Calendar-based booking interface with 1-hour cancellation grace period
3. **Admin Panel**: Equipment management, user management, and booking oversight
4. **Real-time Updates**: Firebase real-time database integration

## Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling for Firebase operations
- Maintain responsive design patterns
- Use React hooks and context for state management
- Follow Next.js 15 App Router conventions

## Firebase Collections

- `users`: User profiles with roles (user/admin)
- `ovens`: Equipment information and status
- `bookings`: Booking records with status tracking

## Important Notes

- All dates should be handled using the `date-fns` library
- Authentication state is managed through React Context
- Protected routes use the `ProtectedRoute` component
- Admin-only routes require `adminOnly` prop
