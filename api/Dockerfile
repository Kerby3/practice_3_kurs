FROM node
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 443
CMD sleep 20 && node app.js
