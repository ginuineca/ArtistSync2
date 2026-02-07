# 🚀 ArtistSync Deployment Guide

This guide will walk you through deploying ArtistSync to production using **Vercel** (frontend) and **Railway** (backend) with **MongoDB Atlas** (database).

---

## 📋 Prerequisites

- GitHub account with the repository pushed
- Vercel account (https://vercel.com)
- Railway account (https://railway.app)
- MongoDB Atlas account (https://mongodb.com/cloud/atlas)

---

## Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up and verify your email

### 1.2 Create a Cluster

1. Click **"Build a Database"**
2. Choose **M0** (Free tier) - 512MB storage
3. Select cloud provider (AWS/Google/Azure) and region closest to you
4. Name your cluster: `artistsync-cluster`
5. Click **"Create Cluster"** (wait 2-3 minutes)

### 1.3 Create Database User

1. Go to **Database Access** → **Add New Database User**
2. Username: `artistsync-admin`
3. Password: Generate a secure password (save it!)
4. Click **"Create User"**

### 1.4 Whitelist IP Addresses

1. Go to **Network Access** → **Add IP Address**
2. For Railway: **0.0.0.0/0** (allows all, Railway uses dynamic IPs)
3. For local testing: Add your IP address
4. Click **"Confirm"**

### 1.5 Get Connection String

1. Go to **Database** → Click **"Connect"**
2. Choose **"Drivers"** → Select **Node.js** (version 4.1+)
3. Copy connection string:
```
mongodb+srv://artistsync-admin:<password>@artistsync-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your ArtistSync repository
4. Railway will auto-detect the backend

### 2.2 Configure Service

1. Root Directory: `backend`
2. Build Command: `npm install`
3. Start Command: `npm start`

### 2.3 Add MongoDB Plugin

1. In your Railway project, click **"New Service"**
2. Select **"MongoDB"** from plugins
3. Railway will automatically create a database

### 2.4 Set Environment Variables

Click on your backend service → **Variables** → **New Variable**:

| Variable | Value |
|----------|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `${{MongoDB.MONGODB_URI}}` |
| `JWT_SECRET` | Generate with `openssl rand -base64 64` |
| `JWT_ACCESS_TOKEN_SECRET` | Generate with `openssl rand -base64 64` |
| `JWT_REFRESH_TOKEN_SECRET` | Generate with `openssl rand -base64 64` |
| `FRONTEND_URL` | (Add later after Vercel deployment) |

### 2.3 Deploy

1. Click **"Deploy"**
2. Railway will build and deploy your backend
3. Get your backend URL: `https://your-backend.railway.app`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select `frontend` as root directory

### 3.2 Configure Project

| Setting | Value |
|---------|-------|
| Framework Preset | Create React App |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `build` |
| Install Command | `npm install` |

### 3.3 Set Environment Variables

In Vercel project → **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | Your Railway backend URL |

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Get your frontend URL: `https://your-project.vercel.app`

---

## Step 4: Update CORS Configuration

Now that you have both URLs, update the backend CORS:

### Railway Backend
Add your Vercel frontend URL to `CORS_ORIGIN`:

```
CORS_ORIGIN=https://your-project.vercel.app
```

### Vercel Frontend
Your `REACT_APP_API_URL` should be:
```
REACT_APP_API_URL=https://your-backend.railway.app
```

---

## Step 5: Verify Deployment

### 1. Test Backend Health
```bash
curl https://your-backend.railway.app/health
```
Expected: `{"status":"ok"}`

### 2. Test Registration
```bash
curl -X POST https://your-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123456","name":"Test"}'
```

### 3. Open Frontend
Navigate to your Vercel URL and test:
- User registration
- Login
- Profile creation
- Messaging

---

## 📱 Custom Domain (Optional)

### Vercel (Frontend)
1. Go to project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed

### Railway (Backend)
1. Go to project → **Settings** → **Domains**
2. Add custom domain
3. Update DNS records

---

## 🔒 Security Checklist

Before going live, ensure you've:

- [ ] Changed all default JWT secrets
- [ ] Enabled MongoDB authentication
- [ ] Set up SSL/TLS (automatic on Vercel/Railway)
- [ ] Configured CORS correctly
- [ ] Set up rate limiting
- [ ] Added environment variables for production
- [ ] Removed development tools from production build

---

## 🔄 CI/CD Pipeline

The `.github/workflows/ci-cd.yml` file includes:

- ✅ Automated testing on push
- ✅ Docker image building
- ✅ Production deployment on main branch
- ✅ Slack notifications (optional)

---

## 📊 Monitoring

### Railway
- Built-in logs
- Metrics dashboard
- Error tracking

### Vercel
- Analytics
- Deployment logs
- Web Vitals

### MongoDB Atlas
- Performance advisor
- Real-time metrics
- Slow query analysis

---

## 🐛 Troubleshooting

### Frontend can't connect to backend

**Issue:** CORS errors
**Fix:** Add frontend URL to `CORS_ORIGIN` in Railway

**Issue:** Mixed content
**Fix:** Ensure all API calls use `https://`

### Database connection fails

**Issue:** `MONGODB_URI` incorrect
**Fix:** Verify connection string and IP whitelist

### Socket.IO connection fails

**Issue:** WebSocket connection blocked
**Fix:** Ensure backend allows WebSocket upgrades

---

## 💰 Cost Breakdown (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby | $0 |
| Railway | Free | $0 (includes $5 free credit) |
| MongoDB Atlas | M0 | $0 |
| **Total** | | **$0** |

---

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/ArtistSync2/issues
- Documentation: See README.md

---

**Happy deploying! 🎉**
