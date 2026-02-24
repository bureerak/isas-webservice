FROM mysql:8.0

# Install zabbix-agent2 (Oracle Linux 9 / x86_64 - using direct RPM approach)
RUN microdnf install -y rpm && \
    rpm -Uvh https://repo.zabbix.com/zabbix/6.0/rhel/9/x86_64/zabbix-release-6.0-4.el9.noarch.rpm && \
    sed -i 's/enabled=1/enabled=0/g' /etc/yum.repos.d/zabbix-agent2-plugins.repo && \
    microdnf install -y zabbix-agent2 && \
    microdnf clean all

# Copy configuration
COPY ./conf/master.cnf /etc/mysql/conf.d/master.cnf

# Copy initialization script
COPY ./init/init.sql /docker-entrypoint-initdb.d/init.sql

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/custom-entrypoint.sh
RUN chmod +x /usr/local/bin/custom-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["mysqld"]
