-- create databases
CREATE DATABASE IF NOT EXISTS `central_ledger`;
CREATE DATABASE IF NOT EXISTS `account_lookup`;
-- create root user and grant rights
CREATE USER 'hub' @'%' identified WITH mysql_native_password by 'password';
GRANT ALL ON *.* TO 'hub' @'%';
FLUSH PRIVILEGES;