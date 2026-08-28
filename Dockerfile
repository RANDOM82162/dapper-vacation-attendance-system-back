FROM node:16 AS build

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:16 AS runtime

WORKDIR /app

COPY --from=build /app/dist ./dist

COPY package*.json ./

RUN npm install --omit=dev

# ts-node-dev for fast TypeScript restarts
RUN npm install -g ts-node-dev

EXPOSE 8080

CMD ["ts-node-dev", "--respawn", "--transpile-only", "--poll", "src/index.ts"]