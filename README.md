[README.md](https://github.com/user-attachments/files/21754056/README.md)
# Tax Audit Practice Management System

**🌐 Live System**: https://gmcasoftware.netlify.app
**👤 Default Login**: admin / admin123
**☁️ Storage**: Google Drive (2TB Plan)

A comprehensive web application for managing tax audit tasks with Google Drive cloud synchronization.

## 🚀 Features

- **Task Management** - Track audit tasks across multiple clients
- **Client Master** - Manage client information with Excel import/export
- **Excel-like Filtering** - Advanced filtering system for task analysis
- **User Management** - Role-based access control
- **Google Drive Sync** - Cloud storage using your existing Google Drive plan
- **Offline Support** - Works offline with automatic sync when online
- **PDF Export** - Generate detailed task reports

## 🌐 **Access Your Live System**

**URL**: https://gmcasoftware.netlify.app

### Quick Start:
1. Visit the URL above
2. Login with: `admin` / `admin123`
3. Go to "Google Drive" tab
4. Click "Connect to Google Drive"
5. Start managing your tax audit tasks!

## 🔧 Setup Instructions

### 1. Google Drive API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Drive API** and **Google Picker API**
4. Create credentials:
   - **API Key** (for Google Drive API)
   - **OAuth 2.0 Client ID** (for authentication)
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://your-app.netlify.app`)

### 2. Environment Configuration

1. Copy `.env.example` to `.env`
2. Fill in your Google credentials from Google Cloud Console:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-google-api-key
```

### 3. Google Drive Setup

The application will automatically:
- Create a "Tax Audit Data" folder in your Google Drive
- Store all application data as JSON files
- Sync every 5 minutes when online
- Use your existing 2TB Google Drive storage plan

### 4. Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🌐 Deployment

### Quick Deploy to Netlify

1. **Build and Deploy**:
   ```bash
   npm run build
   ```
   
2. **Deploy to Netlify**:
   - Drag and drop the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)
   - Or connect your GitHub repository for automatic deployments

3. **Configure Environment Variables**:
   - Go to Site Settings > Environment Variables in Netlify
   - Add your Google API credentials:
     - `VITE_GOOGLE_CLIENT_ID`
     - `VITE_GOOGLE_API_KEY`

4. **Update Google Cloud Console**:
   - Add your Netlify domain to authorized JavaScript origins
   - Example: `https://your-app-name.netlify.app`

### Alternative: Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push
4. Update Google Cloud Console with your Vercel domain

## 👥 User Roles

- **Top Level Rights** - Full access to all features
- **Stage 1 Rights** - Regular tasks only, limited client access
- **Stage 2 Rights** - All tasks except Level 1 approval

## 📊 Default Login

- **Username**: Admin
- **Password**: admin123

## 🔄 Data Synchronization

- **Google Drive Storage** - Uses your existing 2TB plan
- **Auto-sync** - Every 5 minutes when online
- **Offline support** - Works without internet, syncs when reconnected
- **Manual sync** - Force sync anytime
- **Backup system** - Create and restore backups
- **Multi-device** - Access from any device with your Google account

## 💾 Data Storage Structure

```
Google Drive/
└── Tax Audit Data/
    ├── taskEntries.json     # All task entries
    ├── clients.json         # Client master data
    ├── users.json          # User accounts
    └── backup_YYYY-MM-DD.json  # Daily backups
```

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Storage**: Google Drive API + localStorage fallback
- **Build Tool**: Vite
- **PDF Generation**: @react-pdf/renderer
- **Icons**: Lucide React

## 🔐 Security Features

- **OAuth 2.0** - Secure Google authentication
- **Role-based access** - Different permission levels
- **Data encryption** - Google Drive's enterprise security
- **Automatic backups** - Never lose your data

## 📄 License

This project is proprietary software for tax audit practice management.

## 🆘 Support

For setup assistance or issues:
1. Check Google Cloud Console configuration
2. Verify environment variables
3. Ensure Google Drive API is enabled
4. Check browser console for errors
