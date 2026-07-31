FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --only=production || npm install

FROM deps AS dev
ENV NODE_ENV=development
RUN npm install
COPY . .
RUN mkdir -p logs && chown -R node:node /app
USER node
EXPOSE 5000
CMD ["npm", "run", "dev"]
