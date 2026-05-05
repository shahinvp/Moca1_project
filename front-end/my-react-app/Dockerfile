# front-end/my-react-app/Dockerfile

# Step 1: Build the React application
FROM node:20-slim AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Step 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy the build artifacts from the build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy a custom nginx configuration to handle React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
