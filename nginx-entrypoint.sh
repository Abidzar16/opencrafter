#!/bin/sh
# Conditionally enable Anthropic CORS proxy based on env var.
CONF=/etc/nginx/conf.d/proxy-block.conf

if [ "${ENABLE_ANTHROPIC_PROXY}" = "true" ]; then
  echo "Anthropic proxy enabled."
  cat > "$CONF" << 'EOF'
location /api/anthropic-proxy/ {
  proxy_pass https://api.anthropic.com/;
  proxy_ssl_server_name on;
  proxy_set_header Host api.anthropic.com;
  # Strip the proxy prefix before forwarding
  rewrite ^/api/anthropic-proxy/(.*) /$1 break;
}
EOF
else
  # Empty file so the include directive in nginx.conf doesn't fail
  echo "" > "$CONF"
fi
