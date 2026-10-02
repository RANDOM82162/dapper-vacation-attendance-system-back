FROM node:20 AS build

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20 AS runtime

WORKDIR /app

COPY --from=build /app/dist ./dist

COPY package*.json ./

RUN npm ci --omit=dev

EXPOSE 8080

CMD ["node", "dist/index.js"]
