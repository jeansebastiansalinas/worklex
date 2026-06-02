#!/bin/sh
echo "Esperando a PostgreSQL en $DB_HOST:$DB_PORT..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done
echo "PostgreSQL listo!"