FROM node:lts-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false
COPY . ./
RUN yarn build
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "build/index.js"]