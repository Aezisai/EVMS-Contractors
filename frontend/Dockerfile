# Stage 1: Build the React Application
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
# We use a placeholder for the API URL during build; it can be replaced at runtime if needed, 
# but Vite bakes it in. For Cloud Run, you should ideally pass build args, 
# or for a simple approach, we build with standard env vars.
RUN npm run build

# Stage 2: Serve the Application with NGINX
FROM nginx:alpine

# Copy the nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
