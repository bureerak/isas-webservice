FROM node:20-alpine

WORKDIR /app

COPY package*.json .

RUN npm install
RUN apk add --no-cache zabbix-agent2

COPY . .

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]