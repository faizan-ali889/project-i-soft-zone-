FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy remaining source code
COPY . .

# Create directory for uploads and logs
RUN mkdir -p uploads/employees uploads/documents uploads/certificates uploads/assets logs

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "index.js"]
