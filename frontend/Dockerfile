# BUILD

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:5000/api/v1

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build


# PRODUCTION: 

FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]