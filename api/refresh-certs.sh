#!/bin/bash
# Auto-refresh certificates from Let's Encrypt
# Run this via cron after certbot renew

CERT_DIR="/etc/letsencrypt/live/hkgdl.ddns.net"
DEST_DIR="$(dirname "$0")/certs"

if [ -f "$CERT_DIR/privkey.pem" ]; then
    cp "$CERT_DIR/privkey.pem" "$DEST_DIR/key.pem"
    cp "$CERT_DIR/fullchain.pem" "$DEST_DIR/cert.pem"
    chown $(stat -c '%U:%G' "$DEST_DIR") "$DEST_DIR/key.pem" "$DEST_DIR/cert.pem"
    chmod 600 "$DEST_DIR/key.pem"
    chmod 644 "$DEST_DIR/cert.pem"
    echo "[$(date)] Certificates refreshed successfully" >> "$DEST_DIR/../logs/cert-refresh.log"
else
    echo "[$(date)] ERROR: Let's Encrypt certificates not found" >> "$DEST_DIR/../logs/cert-refresh.log"
    exit 1
fi
