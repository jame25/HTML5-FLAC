FROM node:18-alpine

# Install dependencies required for music-metadata
RUN apk add --no-cache python3 make g++ ffmpeg

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"] 