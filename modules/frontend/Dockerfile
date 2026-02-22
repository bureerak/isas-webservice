# Install zabbix-agent2
RUN apk add --no-cache zabbix-agent2

# Copy static HTML files
COPY ./html /usr/share/nginx/html

# Copy Nginx configuration
COPY ./nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
