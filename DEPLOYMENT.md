# Hafiz Stars Eleven - Free Deployment Guide

## 🚀 Deployment Overview

This project uses:
- **Frontend**: Vercel (Free Tier)
- **Backend**: Render or Railway (Free Tier)
- **Database**: Supabase (Free Tier)

---

## 📱 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend
```bash
cd frontend
npm run build  # Test build locally first
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub account
3. Click "New Project"
4. Select your GitHub repository
5. Select `/frontend` as root directory
6. Add Environment Variables:
   - `VITE_SUPABASE_URL` = Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase Anon Key
   - `VITE_API_URL` = Your backend URL (e.g., https://your-backend.onrender.com)
7. Click Deploy

**Note**: Update `VITE_API_URL` to point to your deployed backend.

---

## 🔧 Backend Deployment (Render - Recommended for Free Tier)

### Step 1: Prepare Backend
1. Create `Procfile` in backend folder:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

2. Ensure `requirements.txt` is updated:
```bash
pip freeze > requirements.txt
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign in with GitHub account
3. Click "New" → "Web Service"
4. Select your GitHub repository
5. Configure:
   - **Name**: hafiz-stars-backend
   - **Root Directory**: `backend`
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variables:
   - `SUPABASE_URL` = Your Supabase URL
   - `SUPABASE_KEY` = Your Supabase Anon Key
   - `SUPABASE_JWT_SECRET` = Your Supabase JWT Secret
7. Click "Create Web Service"

**Note**: Free tier spins down after 15 mins of inactivity.

---

## 🗄️ Database (Supabase - Free Tier)

### Setup Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Project Settings** → **API**
4. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_KEY` & `VITE_SUPABASE_ANON_KEY`
   - `service_role` (from JWT) → `SUPABASE_JWT_SECRET`

### Run Migrations
```bash
# In Supabase Dashboard, go to SQL Editor
# Run the migration files in order:
# 1. database/schema.sql
# 2. database/migrations/002_teams_join_requests.sql
```

---

## 🔄 Update Frontend for Deployed Backend

After deploying backend, update frontend environment:

1. On Vercel Dashboard
2. Go to your project → Settings → Environment Variables
3. Update `VITE_API_URL` to your Render backend URL
4. Redeploy

---

## ✅ Testing

After deployment:
1. Visit your Vercel frontend URL
2. Test login/signup with Supabase
3. Test API calls to backend
4. Check console for CORS errors if any

---

## 💡 Free Tier Limits

- **Vercel**: Unlimited deployments, built-in CDN
- **Render**: 1 free web service, spins down after 15 mins
- **Supabase**: 500MB DB, Auth included

---

## 🆘 Troubleshooting

**CORS Errors**: Update backend CORS settings in `backend/app/config.py`
**WebSocket Issues**: Add WebSocket URL to frontend API client
**Database Connection**: Verify Supabase credentials in environment variables

