# Python Code Judge - Render Deployment Guide

This guide explains how to deploy the Python Code Judge application to Render using the provided configuration file.

## Prerequisites

1. A [Render](https://render.com) account
2. Your Supabase project details:
   - Database URL
   - Supabase URL
   - Supabase Anon Key
   - Supabase Service Role Key
3. A JWT secret key (minimum 32 characters)

## Deployment Steps

### 1. Connect Your Repository

1. Log in to your Render account
2. Go to "Dashboard" and click "New +" → "Web Service"
3. Select your GitHub account and find the `python-code-judge` repository
4. Select the branch you want to deploy (e.g., `main` or `master`)

### 2. Configure Environment Variables

In the Render dashboard, set the following environment variables:

#### Required Environment Variables:
- `DATABASE_URL`: Your Supabase database connection string
- `SUPABASE_URL`: Your Supabase project URL (e.g., https://your-project.supabase.co)
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `JWT_SECRET`: Your JWT secret key (minimum 32 random characters)

#### Optional Environment Variables:
- `NODE_ENV`: Set to `production` (default)
- `PORT`: Render will set this automatically (should be left as `{{ PORT }}`)

### 3. Configure the Build and Start Commands

The `render.yaml` file included in this repository will automatically configure:
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`
- Health Check Path: `/api/health`

### 4. Environment-Specific Settings

- **Region**: The configuration uses `oregon` as the default region, but you can change this to your preferred region in the `render.yaml` file
- **Environment**: Automatically set to `production`
- **Health Check**: The application provides a health check endpoint at `/api/health`

## Important Notes

1. **Security**: Ensure that your Supabase service role key is kept secure. This key has full access to your database.
2. **JWT Secret**: Generate a strong secret key for JWT tokens (at least 32 random characters).
3. **Health Check**: The application provides a `/api/health` endpoint that returns the status of the application and database connection.
4. **Environment Variables**: Never commit sensitive environment variables to the repository. Use Render's dashboard to set them securely.

## Environment Variables Generation

To generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

1. If the build fails, check the logs in the Render dashboard for specific error messages
2. If the application crashes after deployment, ensure all required environment variables are set
3. If database connections fail, verify your Supabase credentials and connection string
4. Check the health endpoint `/api/health` to verify the application is running properly

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Project Repository](https://github.com/midopa-dept/python-code-judge)