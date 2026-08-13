# vps-web-sh

This project provides a simple WebSocket -> SSH proxy with a browser terminal (xterm.js), Dockerized and ready to run behind Caddy for automatic TLS. It also includes a GitHub Actions workflow to deploy to a VPS via SSH.

IMPORTANT SECURITY NOTES
- Use this for testing and internal tools only. For production, harden authentication and auditing.
- Always use HTTPS/WSS in production. Caddy in this compose file will provision TLS certs if your domain points to the VPS.
- Do not store sensitive keys in the repo. Use GitHub Secrets for deployment.

Quick start
1. Create a VPS and point your domain A record to its public IP.
2. Install Docker & Docker Compose on the VPS (Ubuntu example):

```bash
sudo apt update && sudo apt install -y ca-certificates curl gnupg lsb-release git
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
