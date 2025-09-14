#!/bin/sh
set -e

# Generate nginx config from template
export API_PORT=${RQM_APP_PORT:-8000}
export NGINX_PORT=${RQM_APP_NGINX_PORT:-7777}

echo "Configuring nginx: API port ${API_PORT}, nginx port ${NGINX_PORT}"
envsubst '${API_PORT},${NGINX_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start Litestar backend using CLI with config
cd /app/api
echo "Starting RQ Manager API server on port ${API_PORT}..."
python3 -m app.cli.main api &

# Wait for backend to start
sleep 2

# Start nginx
echo "Starting nginx on port ${NGINX_PORT}..."
nginx -g 'daemon off;'