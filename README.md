# OvenBook - Lab Equipment Booking System

A comprehensive full-stack web application for managing laboratory oven bookings with advanced multi-day booking capabilities. Built with Next.js, React, TypeScript, Tailwind CSS, and Firebase.

## 🚀 Features

### 🔐 User Authentication
- Secure user registration and login
- Role-based access control (User/Admin)
- Firebase Authentication integration

### 📅 Multi-Day Booking Management
- **Flexible date ranges** up to 7 days per booking
- **Daily time slots** with customizable start/end times
- **Booking limits**: Maximum 2 active bookings per user
- **Conflict detection** prevents overlapping bookings
- **1-hour cancellation grace period** for users
- Real-time availability checking
- Booking status tracking (Active/Completed/Cancelled)

### 👨‍💼 Enhanced Admin Panel
- Equipment management (Add/Edit/Delete ovens)
- User role management
- **Advanced booking oversight** with detailed cancellation system
- **Cancellation reasons**: Wrong schedule, Overlap, Personal Request
- **Audit trail** with timestamps and admin attribution
- Comprehensive dashboard with statistics

### 🔧 Equipment Management
- Oven specifications (temperature, capacity, location)
- Status tracking (Available/Maintenance/Out of Order)
- Real-time status updates

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Date Handling**: date-fns
- **Build Tool**: Next.js with TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ovenbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database and Authentication
   - Enable Email/Password authentication method
   - Copy your Firebase configuration

4. **Environment Setup**
   - Copy `.env.local` and add your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📋 Database Schema

### Users Collection
```typescript
{
  id: string,
  uid: string,
  name: string,
  email: string,
  isAdmin: boolean,
  createdAt: Date
}
```

### Ovens Collection
```typescript
{
  id: string,
  name: string,
  status: string, // 'active', 'maintenance'
  description?: string,
  maxTemperature?: number,
  capacity?: string,
  location?: string
}
```

### Bookings Collection
```typescript
{
  id: string,
  userId: string,
  ovenId: string,
  title: string,
  startTime: Date,
  endTime: Date,
  status: 'active' | 'completed' | 'cancelled',
  createdAt: Date,
  updatedAt: Date,
  cancelledBy?: string,
  cancelledAt?: Date,
  cancellationReason?: string
}
```

## 📝 Usage

### For Users:
1. **Register/Login** with email and password
2. **View available ovens** on the dashboard
3. **Create multi-day bookings** with date ranges up to 7 days
4. **Manage bookings** with 1-hour cancellation window
5. **Track booking limits** (2 active bookings maximum)

### For Admins:
1. **Access Admin Panel** from navigation
2. **Manage ovens** (add, edit, delete equipment)
3. **Oversee all bookings** with detailed view
4. **Cancel bookings** with categorized reasons (Wrong schedule, Overlap, Personal Request)
5. **Manage user roles** (promote/demote admins)

## 🔧 Key Features

- **Multi-day booking support** with flexible date ranges (up to 7 days)
- **Real-time conflict detection** prevents double bookings
- **User booking limits** (maximum 2 active bookings per user)
- **Comprehensive admin tools** for equipment and user management
- **Detailed audit trails** for all cancellations with reasons
- **Responsive design** works on all devices
- **Type-safe** with full TypeScript support

## Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── admin/             # Admin panel pages
│   ├── dashboard/         # User dashboard
│   ├── login/             # Authentication pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── BookingCalendar.tsx
│   ├── BookingModal.tsx
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── contexts/              # React Context providers
│   └── AuthContext.tsx
├── lib/                   # Utility libraries
│   └── firebase.ts
└── types/                 # TypeScript type definitions
    └── index.ts
```

## Database Schema

### Users Collection
```typescript
{
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: Date;
}
```

### Ovens Collection
```typescript
{
  id: string;
  name: string;
  description: string;
  status: 'available' | 'maintenance' | 'out-of-order';
  maxTemperature: number;
  capacity: string;
  location: string;
  createdAt: Date;
}
```

### Bookings Collection
```typescript
{
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  ovenId: string;
  ovenName: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  temperature?: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```

## Key Features Explained

### Authentication Flow
- Users register with email/password
- Firebase Auth handles authentication
- User profiles stored in Firestore with role information
- Context provider manages authentication state

### Booking System
- Calendar view shows all bookings
- Users can select dates and times
- 1-hour grace period allows cancellations
- Real-time updates via Firestore

### Admin Capabilities
- Manage all ovens (add, edit, delete, change status)
- View and cancel any user booking
- Promote users to admin role
- Access comprehensive analytics

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Build the project: `npm run build`
3. Initialize Firebase hosting: `firebase init hosting`
4. Deploy: `firebase deploy`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security Considerations

- Environment variables are properly configured
- Firebase security rules should be implemented
- Input validation on all forms
- Protected routes for admin functions
- Proper error handling for all operations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue in the GitHub repository.

---

Built with ❤️ for the laboratory community
