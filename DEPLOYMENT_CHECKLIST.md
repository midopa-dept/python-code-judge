# Python Code Judge - Deployment Checklist

This checklist ensures all requirements are met before deploying the Python Code Judge application to Render.

## Pre-Deployment Checks

### 1. Repository Status
- [x] All changes committed to the repository
- [x] Repository pushed to GitHub
- [x] Branch is stable and tested locally

### 2. Supabase Setup
- [x] Supabase project created and configured
- [x] Database schema created (using the database migration files)
- [ ] SQL functions (like `exec_sql`) created in the Supabase SQL Editor
- [x] Supabase URL, Anon Key, and Service Role Key noted down

### 3. Security Credentials
- [x] JWT secret key generated (minimum 32 random characters)
- [x] Supabase credentials securely stored
- [x] No sensitive information in the code repository

### 4. Render Configuration
- [x] `render.yaml` file created and committed
- [x] `RENDER_SETUP.md` guide created
- [x] Dockerfile created for backend (optional, as render.yaml handles deployment)

### 5. Environment Variables Required for Render
- [ ] `DATABASE_URL` - Supabase database connection string
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `JWT_SECRET` - JWT secret key (minimum 32 characters)
- [x] `NODE_ENV` - Set to `production`
- [x] `PORT` - Set to `{{ PORT }}` (Render will set this automatically)

### 6. Health Check
- [x] Health check endpoint available at `/api/health`

### 7. Database Connection
- [x] Database connection tested locally
- [x] Supabase client properly configured
- [x] Custom SQL function handling implemented (for complex queries)

## Deployment Steps

1. Connect your GitHub repository to Render
2. Select the correct branch for deployment
3. Set all required environment variables in Render dashboard
4. Verify build command: `cd backend && npm install`
5. Verify start command: `cd backend && npm start`
6. Set health check path: `/api/health`
7. Deploy the service
8. Monitor initial deployment logs

## Post-Deployment Verification

- [ ] Application successfully deployed
- [ ] Health check endpoint responding: `https://[your-app-name].onrender.com/api/health`
- [ ] Database connection established
- [ ] API endpoints accessible
- [ ] Authentication system working
- [ ] Code submission and judging working properly

## Notes for Render Deployment

1. The application uses Supabase for database operations
2. The `exec_sql` function needs to be created manually in the Supabase SQL Editor
3. Ensure Python is available in the Render environment for code execution
4. The judging module executes Python code in isolated environments

## Rollback Plan

1. If deployment fails, revert to the previous stable commit
2. Check Render logs for specific error messages
3. Verify environment variables are correctly set
4. Confirm Supabase connection details are correct