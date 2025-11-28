# Use the official Node.js runtime as the base image
FROM node:24-alpine

# Set the working directory in the container
WORKDIR /app

# Install dependencies
# Copy package.json and package-lock.json (if available) to the container
COPY backend/package*.json ./
RUN npm ci --only=production

# Install Python and psutil for judging engine
RUN apk add --no-cache python3 py3-psutil

# Python executable path
ENV PATH="/usr/bin:$PATH"

# Copy the rest of the application code to the container
COPY backend/ .

# Expose the port that the app runs on
EXPOSE $PORT

# Define the command to run the application
CMD [ "npm", "start" ]