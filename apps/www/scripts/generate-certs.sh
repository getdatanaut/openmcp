#!/bin/bash

if ! which mkcert > /dev/null 2>&1; then
  echo "mkcert is not installed. Please install it using the following commands:"
  echo "brew install mkcert"
  echo "brew install nss # Required for Firefox support"
  exit 1
fi

cd "$(dirname "$0")/.."
mkdir -p .certs && cd .certs

CERT_FILE="./localhost.pem"
CERT_FILE_KEY="./localhost-key.pem"

is_cert_valid_cert() {
  if [[ ! -f "$CERT_FILE" ]] || [[ ! -f "$CERT_FILE_KEY" ]]; then
    return 1
  fi

  EXPIRATION_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
  CURRENT_DATE=$(date -u +"%b %d %H:%M:%S %Y GMT")

  if [[ "$CURRENT_DATE" > "$EXPIRATION_DATE" ]]; then
    return 1
  fi

  return 0
}

if ! is_cert_valid_cert; then
  mkcert -cert-file $CERT_FILE -key-file $CERT_FILE_KEY localhost 127.0.0.1 ::1
fi