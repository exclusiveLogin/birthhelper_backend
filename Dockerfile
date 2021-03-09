FROM node:12.20.2
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm i

ENTRYPOINT npm run deploy:docker && mkdir dist/out-tsc/upload
EXPOSE 3000
