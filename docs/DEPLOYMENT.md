# Deployment Guide

This guide prepares the Private PDF Tool MVP for a private local server or VPS
deployment using Docker Compose.

The app is intentionally simple:

- frontend: Next.js on port `3000`
- backend: FastAPI on port `8000`
- auth: shared password sent as `x-app-password`
- storage: temporary files only, stored under the backend temp directory
- runtime tools: Ghostscript and Poppler inside the backend container

## Pre-deploy Checklist

- Docker and Docker Compose are installed on the server.
- The repository is cloned on the server.
- `.env` exists and is not committed to git.
- `APP_PASSWORD` is set to a long private value.
- `NEXT_PUBLIC_API_URL` matches the URL browsers will use for the backend.
- `ALLOWED_ORIGINS` includes the exact frontend origin.
- Ports `3000` and `8000` are reachable only where intended.
- HTTPS or a trusted private network is planned before public exposure.
- A smoke test run is planned after startup.

## Environment Variables

Create `.env` from the example:

```bash
cp .env.example .env
```

Required values:

```env
APP_PASSWORD=use-a-long-random-password
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Variable notes:

- `APP_PASSWORD` is required by Docker Compose and by the backend auth layer.
- `NEXT_PUBLIC_API_URL` is compiled into the frontend image at build time.
- `NEXT_PUBLIC_AUTH_ENABLED=true` enables the frontend login gate.
- `ALLOWED_ORIGINS` is read by the backend at startup for CORS.

For a VPS using raw IP and exposed ports:

```env
APP_PASSWORD=use-a-long-random-password
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8000
NEXT_PUBLIC_AUTH_ENABLED=true
ALLOWED_ORIGINS=http://YOUR_SERVER_IP:3000
```

For a domain with separate frontend and backend hosts:

```env
APP_PASSWORD=use-a-long-random-password
NEXT_PUBLIC_API_URL=https://api.pdf.example.com
NEXT_PUBLIC_AUTH_ENABLED=true
ALLOWED_ORIGINS=https://pdf.example.com
```

After changing `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_AUTH_ENABLED`, rebuild the
frontend image:

```bash
docker compose up -d --build
```

## Local Server Deployment

Use this when the app is running on a machine inside a trusted private network.

```bash
git clone https://github.com/GUZZBR1/PDF_READER.git
cd PDF_READER
cp .env.example .env
```

Edit `.env` and set:

```env
APP_PASSWORD=use-a-long-random-password
NEXT_PUBLIC_API_URL=http://LOCAL_SERVER_IP:8000
ALLOWED_ORIGINS=http://LOCAL_SERVER_IP:3000
```

Start:

```bash
docker compose up -d --build
```

Verify:

```bash
curl http://LOCAL_SERVER_IP:8000/health
docker compose ps
docker compose logs --tail=100 backend
```

Open:

```text
http://LOCAL_SERVER_IP:3000
```

## VPS Deployment

Use this for a small VPS where Docker Compose runs both services.

```bash
git clone https://github.com/GUZZBR1/PDF_READER.git
cd PDF_READER
cp .env.example .env
```

Edit `.env`:

```env
APP_PASSWORD=use-a-long-random-password
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8000
NEXT_PUBLIC_AUTH_ENABLED=true
ALLOWED_ORIGINS=http://YOUR_SERVER_IP:3000
```

Start:

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
curl http://YOUR_SERVER_IP:8000/health
```

Access:

```text
http://YOUR_SERVER_IP:3000
```

Run the manual smoke checklist in [SMOKE_TEST.md](SMOKE_TEST.md) before calling
the deployment ready.

## Reverse Proxy Notes

A reverse proxy is recommended for HTTPS and cleaner public URLs. The Compose
file does not add an nginx or Caddy container; run your proxy on the host or in
your existing infrastructure.

Recommended layout:

- `https://pdf.example.com` proxies to `http://127.0.0.1:3000`
- `https://api.pdf.example.com` proxies to `http://127.0.0.1:8000`
- `.env` uses `NEXT_PUBLIC_API_URL=https://api.pdf.example.com`
- `.env` uses `ALLOWED_ORIGINS=https://pdf.example.com`

### Caddy Example

```caddyfile
pdf.example.com {
	reverse_proxy 127.0.0.1:3000
}

api.pdf.example.com {
	reverse_proxy 127.0.0.1:8000
}
```

### Nginx Example

```nginx
server {
    listen 80;
    server_name pdf.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name api.pdf.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Terminate HTTPS with your normal certificate tooling, such as Caddy automatic
TLS, Certbot, or a managed proxy.

### Cloudflare Tunnel Notes

Map two public hostnames:

- `pdf.example.com` to `http://localhost:3000`
- `api.pdf.example.com` to `http://localhost:8000`

Then set:

```env
NEXT_PUBLIC_API_URL=https://api.pdf.example.com
ALLOWED_ORIGINS=https://pdf.example.com
```

Rebuild after changing these frontend build variables.

## HTTPS Notes

- Use HTTPS for any public or semi-public deployment.
- The shared password is sent in a request header, so plaintext HTTP exposes it
  to anyone who can observe the network.
- Browser `localStorage` is acceptable for this private MVP, but it is not a
  replacement for a full authentication system.

## Firewall Notes

For a direct IP deployment, only open ports you actually need:

- `22/tcp` for SSH from trusted addresses
- `3000/tcp` for frontend access, if not using a reverse proxy
- `8000/tcp` for backend access, if not using a reverse proxy
- `80/tcp` and `443/tcp` when using a host reverse proxy

When a reverse proxy is in place, keep ports `3000` and `8000` bound only to
localhost if your host setup supports it, or restrict them with firewall rules.

## Backup Notes

There is no database and no durable uploaded file storage in this MVP.

Back up:

- `.env`, stored securely outside git
- reverse proxy configuration
- any deployment notes specific to the server

Do not back up the backend temp directory as application data. It should contain
only temporary uploads and generated outputs.

## Update Process

From the repository directory on the server:

```bash
git checkout main
git pull origin main
docker compose up -d --build
```

Then verify:

```bash
docker compose ps
curl http://127.0.0.1:8000/health
docker compose logs --tail=100
```

Run [SMOKE_TEST.md](SMOKE_TEST.md) after updates that affect backend routes,
frontend request handling, Dockerfiles, or environment variables.

## Troubleshooting

Compose fails with `APP_PASSWORD` error:

- Create `.env`.
- Set `APP_PASSWORD` to a non-empty value.
- Start again with `docker compose up -d --build`.

Frontend loads but tool requests fail:

- Confirm `NEXT_PUBLIC_API_URL` is the public backend URL, not container DNS.
- Rebuild after changing `NEXT_PUBLIC_API_URL`.
- Confirm `/health` is reachable from the browser network.

Backend returns CORS errors:

- Set `ALLOWED_ORIGINS` to the exact frontend origin.
- Include protocol, host, and port.
- Restart the backend after changing it.

PDF-to-image fails:

- Check Poppler inside the backend container:
  `docker compose exec backend pdftoppm -v`

Compression fails:

- Check Ghostscript inside the backend container:
  `docker compose exec backend gs --version`

Login succeeds locally but tools return `401`:

- Confirm the password entered in the browser matches `APP_PASSWORD`.
- Use logout, then log in again after rotating `APP_PASSWORD`.
- Confirm the browser request includes the `x-app-password` header.
