# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --omit=dev
RUN cd frontend && npm ci --omit=dev

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"] 