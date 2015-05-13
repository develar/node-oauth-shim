FROM develar/nodejs
MAINTAINER Vladimir Krivosheev <develar@gmail.com>

WORKDIR app
COPY package.json ./
RUN npm install
COPY src ./

EXPOSE 80
ENTRYPOINT ["node", "main.js"]