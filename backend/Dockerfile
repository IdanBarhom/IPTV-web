# ============================================
# Multi-stage Dockerfile for IPTV Backend
# ============================================

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# ============================================
# Stage 2: Production
# ============================================
FROM node:18-alpine AS production

# Install dumb-init (for signal handling)
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies from stage 1
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/index.js"]




# Dependencies:

# FROM node:22-alpine AS dependencies


# WORKDIR /app

# COPY package*.json ./

# RUN npm ci --only=production


# # Production:

# FROM node:22-alpine AS production

# # creating non-root user, we adding a group by the name of nodejs with 1001 id and same for user
# RUN addgroup -g 1001 -S nodejs && \
#     adduser -S nodejs -u 1001

# WORKDIR /app

# COPY --from=dependencies /app/node_modules ./node_modules

# COPY . .

# # switch to non-root user
# RUN chown -R nodejs:nodejs /app

# USER nodejs

# EXPOSE 5000

# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:5000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"


# CMD ["node", "src/index.js"]



#OLD ONE BEFORE SPLITTING TO DEPENDENCIES AND PRODUCTION

# FROM node:22-alpine

# # cd /app ... workdir- creats /app folder and enters it 
# WORKDIR /app

# # copy package.json from my computer 
# COPY package.json .

# # running npm install while building its downloading all the dependencies from the package.json that we copy earlier.
# RUN npm install

# # copy all files from current folder to the container
# COPY . .

# EXPOSE 5000

# # run when container is ready - its acts like node src/index.js
# CMD ["node", "src/index.js"]

# RUN VS CMD 
# RUN= run when building the image
# CMD= runs when turning on the container


# to build an image we can do in the termial: docker build -t iptv-backend .
# "docker build" = build an image
#"-t iptv-backend" = give it a name- iptv-backend
# "." = the DockerFile is here


# and after it you can run the container: docker run -p 5000:5000 iptv-backend
# "docker run" = run the container
# " -p 5000:5000" = connect your computer port (that is 5000) to the container port (5000 aswell.. )
# "iptv-backend" = name of the image