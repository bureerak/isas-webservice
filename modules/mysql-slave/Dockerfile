# Install zabbix-agent2
RUN apt-get update && \
    apt-get install -y wget && \
    wget https://repo.zabbix.com/zabbix/6.0/debian/pool/main/z/zabbix-release/zabbix-release_6.0-4%2Bdebian11_all.deb && \
    dpkg -i zabbix-release_6.0-4+debian11_all.deb && \
    apt-get update && \
    apt-get install -y zabbix-agent2 && \
    rm -rf /var/lib/apt/lists/*

# Copy configuration
COPY ./conf/slave.cnf /etc/mysql/conf.d/slave.cnf

# Copy initialization script
COPY ./init/init.sql /docker-entrypoint-initdb.d/init.sql

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/custom-entrypoint.sh
RUN chmod +x /usr/local/bin/custom-entrypoint.sh

ENTRYPOINT ["custom-entrypoint.sh"]
CMD ["mysqld"]
