FROM node:16 as build

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with specific versions to avoid conflicts
RUN npm install --legacy-peer-deps && \
    npm install ajv@8.11.0 ajv-keywords@5.1.0 --legacy-peer-deps

# Force reinstall of problematic packages
RUN rm -rf node_modules/ajv node_modules/ajv-keywords && \
    npm install ajv@8.11.0 ajv-keywords@5.1.0 --legacy-peer-deps

# Now copy the source code
COPY public ./public
COPY src ./src

# Set environment variables
ENV BROWSER=none
ENV CI=false

# Build with specific flags
RUN NODE_OPTIONS=--max_old_space_size=4096 npm run build || npm rebuild && npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Add a basic nginx configuration for React SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]