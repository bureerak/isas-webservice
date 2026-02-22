#!/bin/bash

# Start Zabbix Agent 2
if [ -f /etc/zabbix/zabbix_agent2.conf ]; then
    if [ -n "$ZBX_SERVER_HOST" ]; then
        sed -i "s/^Server=127.0.0.1/Server=$ZBX_SERVER_HOST/" /etc/zabbix/zabbix_agent2.conf
        sed -i "s/^ServerActive=127.0.0.1/ServerActive=$ZBX_SERVER_HOST/" /etc/zabbix/zabbix_agent2.conf
    fi
    if [ -n "$ZBX_HOSTNAME" ]; then
        sed -i "s/^Hostname=Zabbix server/Hostname=$ZBX_HOSTNAME/" /etc/zabbix/zabbix_agent2.conf
    fi
    zabbix_agent2 -c /etc/zabbix/zabbix_agent2.conf &
fi

# Run the original entrypoint
exec /usr/local/bin/docker-entrypoint.sh "$@"
