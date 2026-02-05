FROM mysql:8.0

# Copy configuration
COPY ./conf/master.cnf /etc/mysql/conf.d/master.cnf

# Copy initialization script
COPY ./initmaster/init.sql /docker-entrypoint-initdb.d/init.sql
