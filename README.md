# ArtistSync 🎵

A full-stack platform connecting artists with venues for booking events, collaborations, and networking.

## 🚀 Features

- **User Authentication** - JWT-based auth with refresh tokens
- **Profile Management** - Artist & venue profiles with portfolios
- **Event Booking** - Create events, send invitations, accept/decline bookings
- **Real-time Messaging** - Socket.IO-powered instant messaging
- **Notifications** - Real-time notifications for invites, messages, reviews
- **File Uploads** - Avatars, event covers, portfolio items
- **Reviews & Ratings** - Review artists and venues
- **Dashboard** - Analytics and activity overview

## 🛠️ Tech Stack

### Frontend
- React 18
- Material-UI (MUI) v5
- React Router v7
- React Query
- Socket.IO Client
- Axios

### Backend
- Node.js 18+
- Express
- MongoDB (Mongoose)
- Socket.IO
- JWT Authentication
- Multer (file uploads)

## 📦 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB 7.0+ (local or Docker)
- Docker & Docker Compose (optional)

### Using Docker (Recommended)

1. Clone the repository
```bash
git clone https://github.com/yourusername/ArtistSync2.git
cd ArtistSync2
```

2. Start all services
```bash
docker-compose up -d
```

3. Access the application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017/artistsync

### Manual Setup

1. Install dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. Set up environment variables
```bash
# Backend
cp ../.env.production.example .env
# Edit .env with your values

# Frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000
```

3. Start MongoDB (if using Docker)
```bash
docker-compose up -d mongodb
```

4. Start the servers
```bash
# Backend (terminal 1)
cd backend
npm start

# Frontend (terminal 2)
cd frontend
npm start
```

## 📁 Project Structure

```
ArtistSync2/
├── backend/
│   ├── config/         # Database configuration
│   ├── middleware/     # Auth, rate limiting, validation
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Socket.IO, notifications, uploads
│   ├── utils/          # Helper functions
│   ├── uploads/        # Uploaded files
│   ├── server.js       # Entry point
│   ├── Dockerfile      # Docker configuration
│   └── railway.toml    # Railway deployment
├── frontend/
│   ├── public/         # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Auth, Socket contexts
│   │   ├── App.js       # Main app
│   │   └── index.js     # Entry point
│   ├── Dockerfile
│   └── vercel.json     # Vercel deployment
├── docker-compose.yml  # Docker services
├── .env.production.example
└── README.md
```

## 🔌 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe",
  "userType": "artist"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Profiles

#### Get My Profile
```http
GET /api/profile/me
Authorization: Bearer {access_token}
```

#### Update Profile
```http
PUT /api/profile/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "John Doe",
  "description": "Musician",
  "genres": ["Rock", "Jazz"],
  "location": { "city": "New York" }
}
```

#### Update Artist Details
```http
PUT /api/profile/me/artist-details
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "genres": ["Rock", "Jazz"],
  "instruments": ["Guitar", "Vocals"],
  "pricing": { "hourlyRate": 100 }
}
```

### Events

#### Get All Events
```http
GET /api/events?page=1&limit=20&category=concert&genre=Rock
```

#### Get Event by ID
```http
GET /api/events/:id
```

#### Create Event (Venues only)
```http
POST /api/events
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Summer Music Festival",
  "description": "Annual music festival",
  "date": { "start": "2024-07-15T18:00:00Z", "end": "2024-07-16T02:00:00Z" },
  "capacity": 5000,
  "categories": ["festival"],
  "genres": ["Rock", "Pop"]
}
```

#### Invite Artist to Event
```http
POST /api/events/:id/artists
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "artistId": "artist_profile_id",
  "setTime": { "start": "2024-07-15T20:00:00Z" },
  "payment": { "amount": 500, "currency": "USD" }
}
```

### Messages

#### Get Conversations
```http
GET /api/messages/conversations
Authorization: Bearer {access_token}
```

#### Get Messages in Conversation
```http
GET /api/messages/conversations/:id/messages
Authorization: Bearer {access_token}
```

#### Send Message
```http
POST /api/messages/conversations/:id/messages
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "Hello, interested in performing!"
}
```

### Notifications

#### Get Notifications
```http
GET /api/notifications?limit=20&unreadOnly=false
Authorization: Bearer {access_token}
```

#### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer {access_token}
```

### File Uploads

#### Upload Avatar
```http
POST /api/upload/avatar
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

avatar: <file>
```

#### Upload Event Cover
```http
POST /api/upload/event-cover
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

cover: <file>
```

#### Upload Portfolio Item
```http
POST /api/upload/portfolio
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: <file>
type: "image"
title: "My Performance"
```

## 🔌 WebSocket Events

### Client → Server

```javascript
// Join conversation
socket.emit('conversation:join', { conversationId });

// Send message
socket.emit('message:send', { conversationId, content });

// Typing indicator
socket.emit('message:typing', { conversationId });
socket.emit('message:stop_typing', { conversationId });

// Mark as read
socket.emit('messages:mark_read', { conversationId });
```

### Server → Client

```javascript
// New message
socket.on('message:new', ({ message, conversationId });

// User online/offline
socket.on('user:online', { userId, user });
socket.on('user:offline', { userId });

// Typing indicator
socket.on('user:typing', { conversationId, userId });
socket.on('user:stop_typing', { conversationId, userId });

// Notifications
socket.on('notification:new', (notification));
socket.on('notification:event_invitation', (data));
socket.on('notification:booking_update', (data));
```

## 🚢 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable:
   - `REACT_APP_API_URL` = Your backend URL
4. Deploy!

### Backend (Railway)

1. Push code to GitHub
2. Create new project in Railway
3. Add MongoDB plugin
4. Add environment variables (see `.env.production.example`)
5. Set root directory to `backend`
6. Deploy!

### MongoDB Atlas

1. Create account at mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Whitelist Railway/Vercel IPs
4. Get connection string
5. Update `MONGODB_URI` in environment variables

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_ACCESS_TOKEN_SECRET` | Access token secret | - |
| `JWT_REFRESH_TOKEN_SECRET` | Refresh token secret | - |
| `FRONTEND_URL` | Frontend URL for CORS | - |
| `CORS_ORIGIN` | Allowed origins | - |

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 License

ISC

## 👥 Contributing

Pull requests are welcome!

---

Built with ❤️ for the music community
