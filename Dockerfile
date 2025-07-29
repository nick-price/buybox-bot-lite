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

# Copy frontend files explicitly
COPY frontend/public ./frontend/public
COPY frontend/src ./frontend/src
COPY frontend/tailwind.config.js ./frontend/
COPY frontend/postcss.config.js ./frontend/

# Copy backend files
COPY index.js ./
COPY config ./config
COPY db ./db
COPY routes ./routes
COPY services ./services
COPY utils ./utils

# Build frontend
RUN cd frontend && npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"] 