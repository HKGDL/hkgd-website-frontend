#!/bin/bash
# Generate self-signed SSL certificates for development

CERT_DIR="certs"
mkdir -p $CERT_DIR

echo "Generating self-signed SSL certificate..."

openssl req -x509 -newkey rsa:4096 -keyout $CERT_DIR/key.pem -out $CERT_DIR/cert.pem \
  -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.ddns.net,IP:127.0.0.1"

echo "Certificates generated successfully in $CERT_DIR/"
echo ""
echo "Add these lines to your .env file:"
echo "SSL_KEY_PATH=./certs/key.pem"
echo "SSL_CERT_PATH=./certs/cert.pem"
echo ""
echo "Then restart your server"