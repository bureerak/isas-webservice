#!/bin/sh

# Update Zabbix Agent configuration with environment variables
if [ -n "$ZBX_SERVER_HOST" ]; then
    sed -i "s/^Server=127.0.0.1/Server=$ZBX_SERVER_HOST/" /etc/zabbix/zabbix_agent2.conf
    sed -i "s/^ServerActive=127.0.0.1/ServerActive=$ZBX_SERVER_HOST/" /etc/zabbix/zabbix_agent2.conf
fi

if [ -n "$ZBX_HOSTNAME" ]; then
    sed -i "s/^Hostname=Zabbix server/Hostname=$ZBX_HOSTNAME/" /etc/zabbix/zabbix_agent2.conf
fi

# Start Zabbix Agent 2 in the background
zabbix_agent2 -c /etc/zabbix/zabbix_agent2.conf &

# Start Nginx in the foreground
nginx -g "daemon off;"
