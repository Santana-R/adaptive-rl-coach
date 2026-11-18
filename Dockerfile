FROM node:22.19.0-bookworm-slim

ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 REPLAY_TEMP_DIR=/app/data/replays
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY src ./src
COPY public ./public
COPY planning ./planning
RUN mkdir -p /app/data/replays && chown -R node:node /app/data
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1));"
CMD ["node", "src/app.js"]
