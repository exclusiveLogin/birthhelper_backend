FROM node:12.20.2
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm i
RUN mkdir dist && cd dist mkdir upload

RUN npm install pm2 -g
ENV PM2_PUBLIC_KEY smyrbcl05x8u5yo
ENV PM2_SECRET_KEY m84owwtipe5nhoa

ENTRYPOINT npm run deploy:docker
EXPOSE 3000
