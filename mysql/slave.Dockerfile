FROM mysql:8.0

# Copy configuration
COPY ./conf/slave.cnf /etc/mysql/conf.d/slave.cnf

# Copy initialization script
COPY ./initslave/init.sql /docker-entrypoint-initdb.d/init.sql
