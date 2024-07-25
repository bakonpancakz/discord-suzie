# Build Application
FROM node:lts-alpine3.19
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
RUN npm run prestart

# Expose Application
ENV WEB_HOSTNAME="0.0.0.0"
ENV WEB_PORT="1273"
ENV WEB_PASS="N/A"
ENV ROBLOX_COOKIE="N/A"
EXPOSE 1273
CMD ["node", "dist/index.js"]
