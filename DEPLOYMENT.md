# 🚀 ArtistSync Deployment Guide

This guide will walk you through deploying ArtistSync to production using **Vercel** (frontend) and **Render** (backend) with **MongoDB Atlas** (database).

---

## 📋 Prerequisites

- GitHub account with the repository pushed
- Vercel account (https://vercel.com)
- Render account (https://render.com)
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

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to https://render.com and sign up/login
2. Connect your GitHub account

### 2.2 Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Select your ArtistSync2 repository
3. Configure the service:

| Setting | Value |
|---------|-------|
| Name | `artistsync-backend` |
| Root Directory | `backend` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | **Free** |

### 2.3 Set Environment Variables

In your Render service → **Environment** tab, add these variables:

| Variable | Value |
|----------|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Generate a secure random string |
| `JWT_ACCESS_TOKEN_SECRET` | Generate a secure random string |
| `JWT_REFRESH_TOKEN_SECRET` | Generate a secure random string |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | (Add later after Vercel deployment) |
| `CORS_ORIGIN` | (Add later after Vercel deployment) |

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Render will build and deploy (takes 5-10 minutes)
3. Get your backend URL: `https://artistsync-backend.onrender.com`

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
| `REACT_APP_API_URL` | Your Render backend URL (e.g., `https://artistsync-backend.onrender.com`) |

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Get your frontend URL: `https://your-project.vercel.app`

---

## Step 4: Update CORS Configuration

Now that you have both URLs, update the configuration:

### Render Backend
Add your Vercel frontend URL to environment variables:
- `FRONTEND_URL`: `https://your-project.vercel.app`
- `CORS_ORIGIN`: `https://your-project.vercel.app`

### Vercel Frontend
Set environment variable in Vercel dashboard:
- `REACT_APP_API_URL`: Your Render backend URL (e.g., `https://artistsync-backend.onrender.com`)

---

## Step 5: Verify Deployment

### 1. Test Backend Health
```bash
curl https://artistsync-backend.onrender.com/health
```
Expected: `{"status":"ok"}`

### 2. Test Registration
```bash
curl -X POST https://artistsync-backend.onrender.com/api/auth/register \
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

### Render (Backend)
1. Go to service → **Settings** → **Custom Domains**
2. Add custom domain
3. Update DNS records as instructed

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

### Render
- Built-in logs
- Metrics dashboard
- Health checks

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

### 404 Error on Vercel Deployment

**Issue:** Seeing "404 Not Found" when visiting your Vercel URL

**Possible Causes & Fixes:**

1. **Build still in progress**
   - Check Vercel dashboard → Deployments tab
   - Wait for "Ready" status (can take 2-5 minutes)

2. **Missing REACT_APP_API_URL**
   - Go to Vercel Project → Settings → Environment Variables
   - Add: `REACT_APP_API_URL` = `https://your-backend.onrender.com`
   - Trigger a new deployment after adding

3. **Build error**
   - Check deployment logs in Vercel dashboard
   - Common errors: Missing dependencies, TypeScript errors

4. **Wait a few minutes**
   - DNS propagation can take 1-2 minutes
   - Try clearing browser cache

### Frontend can't connect to backend

**Issue:** CORS errors
**Fix:** Add frontend URL to `CORS_ORIGIN` in Render environment variables

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
| Render | Free | $0 |
| MongoDB Atlas | M0 | $0 |
| **Total** | | **$0** |

---

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/ArtistSync2/issues
- Documentation: See README.md

---

**Happy deploying! 🎉**
