# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files first
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm ci --omit=dev

# Copy backend source code
COPY backend ./backend

# Expose port
EXPOSE 5000

# Start the backend application
CMD ["node", "backend/index.js"] 