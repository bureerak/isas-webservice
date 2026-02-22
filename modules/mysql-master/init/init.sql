CREATE USER 'replica_user'@'%' IDENTIFIED WITH mysql_native_password BY 'replica_password';
GRANT REPLICATION SLAVE ON *.* TO 'replica_user'@'%';

-- Zabbix Monitoring User
CREATE USER 'zabbix'@'%' IDENTIFIED WITH mysql_native_password BY 'zabbix_password';
GRANT REPLICATION CLIENT, PROCESS, SHOW DATABASES, SHOW VIEW ON *.* TO 'zabbix'@'%';

FLUSH PRIVILEGES;
