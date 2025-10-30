# Secret Santa Inator 🎄

A modern, real-time web application for organizing Secret Santa gift exchanges with friends, family, or colleagues.

## ✨ Features

### Core Functionality
- **Easy Group Creation**: Create Secret Santa groups with customizable settings
- **Simple Joining**: Join groups using a shareable link or group code
- **Smart Assignments**: Automatic Secret Santa pairing when groups are ready
- **Real-time Updates**: Live notifications when members join, leave, or when assignments are made

### Group Management
- **Member Capacity**: Set maximum number of participants
- **Group Privacy**: Optional password protection for groups
- **Flexible Timing**: Set expiry dates for group participation
- **Group Status Control**: Open/close groups for new members, freeze for assignments

### User Experience
- **Code Names**: Optional anonymous participation with auto-generated or custom code names
- **Live Indicators**: Real-time connection status across all pages
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Intuitive UI**: Clean, festive design with clear navigation

### Admin Features
- **Group Administration**: Manage members, settings, and group status
- **Member Removal**: Remove participants when necessary
- **Assignment Control**: Lock/unlock Secret Santa assignments
- **Group Analytics**: View member lists and participation status

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for database and real-time features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ihtnc/secret-santa-inator.git
   cd secret-santa-inator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up the database**
   Run the SQL migration file in your Supabase database:
   ```bash
   # Execute the contents of db/001_initial_secret_santa_schema.sql in your Supabase SQL editor
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions, Auth)
- **Deployment**: Vercel-ready
- **Development**: ESLint, TypeScript strict mode

## 📱 How It Works

### For Participants
1. **Join a Group**: Click a shared link or enter a group code
2. **Enter Your Details**: Provide your name and optional code name
3. **Wait for Assignment**: Get notified when Secret Santa assignments are made
4. **View Your Assignment**: See who you're buying a gift for

### For Organizers
1. **Create a Group**: Set up a new Secret Santa group with your preferences
2. **Share the Link**: Send the group link to participants
3. **Manage Members**: Add/remove participants as needed
4. **Make Assignments**: Lock the group to generate Secret Santa pairings
5. **Monitor Progress**: Track participation and group status

## 🔧 Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run debug` - Start with debugging enabled

### Project Structure
```
secret-santa-inator/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin group management
│   ├── create/            # Group creation
│   ├── group/             # Group participation view
│   ├── join/              # Group joining process
│   └── my-groups/         # User's group overview
├── db/                    # Database schema and migrations
├── utilities/             # Utility functions and Supabase config
└── public/               # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎁 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the existing issues for solutions
- Review the database schema in `db/001_initial_secret_santa_schema.sql`

---

Made with ❤️ for spreading holiday joy through organized gift exchanges!