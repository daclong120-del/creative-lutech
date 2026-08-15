# 🐳 Docker Help — Crawler Pipeline

> Hướng dẫn thực dụng dùng Docker cho dự án này. Chỉ chứa những gì cần dùng thật.

docker compose logs -f         # Xem log
docker compose down            # Dừng
docker compose up -d --build   # Build lại khi sửa code

---

## Mục lục

1. [Cấu trúc file Docker](#1-cấu-trúc-file-docker)
2. [Setup lần đầu (Local)](#2-setup-lần-đầu-local)
3. [Các lệnh hàng ngày](#3-các-lệnh-hàng-ngày)
4. [Deploy lên VPS](#4-deploy-lên-vps)
5. [Update code trên VPS](#5-update-code-trên-vps)
6. [Debug & Xử lý lỗi](#6-debug--xử-lý-lỗi)
7. [Giải thích Dockerfile](#7-giải-thích-dockerfile)
8. [Giải thích docker-compose.yml](#8-giải-thích-docker-composeyml)
9. [Cheat Sheet](#9-cheat-sheet)

---

## 1. Cấu trúc file Docker

```
crawler-pipeline/
├── Dockerfile           ← Công thức đóng gói (Node + code)
├── docker-compose.yml   ← Config chạy container (RAM, log, restart)
├── .dockerignore        ← File bỏ qua khi build (như .gitignore)
├── .env.example         ← Mẫu biến môi trường
├── .env                 ← Biến môi trường thật (KHÔNG commit lên git)
└── src/                 ← Code crawler
```

---

## 2. Setup lần đầu (Local)

```bash
# Bước 1: Vào thư mục crawler-pipeline
cd crawler-pipeline

# Bước 2: Tạo file .env từ mẫu
cp .env.example .env
# Mở .env và điền các key thật (Supabase, R2, ...)

# Bước 3: Build image + chạy container
docker compose up -d --build

# Bước 4: Xem log kiểm tra
docker compose logs -f
# Nhấn Ctrl+C để thoát xem log (container vẫn chạy)
```

---

## 3. Các lệnh hàng ngày

### Khởi động / Dừng

```bash
# Chạy (nếu đã build rồi)
docker compose up -d

# Chạy + build lại (khi thay đổi code)
docker compose up -d --build

# Dừng container (giữ dữ liệu)
docker compose down

# Restart
docker compose restart
```

### Xem log

```bash
# Xem log realtime (follow)
docker compose logs -f

# Xem 100 dòng log cuối
docker compose logs --tail 100

# Xem 50 dòng cuối + follow
docker compose logs --tail 50 -f
```

### Kiểm tra trạng thái

```bash
# Container đang chạy hay dừng?
docker compose ps

# Xem CPU/RAM đang dùng (realtime, như Task Manager)
docker stats
```

---

## 4. Deploy lên VPS

### Lần đầu tiên

```bash
# === TRÊN MÁY LOCAL ===

# 1. Đẩy code lên VPS (thay YOUR_VPS_IP bằng IP thật)
rsync -avz --exclude 'node_modules' --exclude 'output' --exclude '.git' \
  ./crawler-pipeline/ root@YOUR_VPS_IP:/opt/crawler-pipeline/
```

```bash
# === SSH VÀO VPS ===
ssh root@YOUR_VPS_IP

# 2. Cài Docker (chỉ cần 1 lần)
curl -fsSL https://get.docker.com | sh

# 3. Tạo file .env
cd /opt/crawler-pipeline
cp .env.example .env
nano .env
# Điền các key thật, save (Ctrl+X → Y → Enter)

# 4. Build + chạy
docker compose up -d --build

# 5. Kiểm tra
docker compose logs -f
```

### Cấu trúc trên VPS sau khi deploy

```
/opt/crawler-pipeline/
├── Dockerfile
├── docker-compose.yml
├── .env                 ← Chứa key thật
├── src/                 ← Code
└── output/              ← Dữ liệu crawl (mount volume, không mất khi restart)
```

---

## 5. Update code trên VPS

Mỗi khi sửa code xong, chỉ cần 2 lệnh:

```bash
# === TRÊN MÁY LOCAL ===
# 1. Đẩy code mới lên VPS
rsync -avz --exclude 'node_modules' --exclude 'output' --exclude '.git' \
  ./crawler-pipeline/ root@YOUR_VPS_IP:/opt/crawler-pipeline/

# === SSH VÀO VPS ===
# 2. Build lại + restart
cd /opt/crawler-pipeline
docker compose up -d --build
```

> **Lưu ý:** Docker cache dependencies (npm install). Nếu chỉ đổi code trong `src/`, build lại rất nhanh (~10 giây). Chỉ khi đổi `package.json` mới phải cài lại dependencies (~2-5 phút).

---

## 6. Debug & Xử lý lỗi

### Container không chạy / restart liên tục

```bash
# Xem log để biết lỗi gì
docker compose logs --tail 100

# Các lỗi phổ biến:
# - "Cannot find module" → Code copy thiếu file
# - "SUPABASE_SERVICE_ROLE_KEY" rỗng → Chưa điền .env
# - "ERR_SOCKET_TIMEOUT" → VPS không có internet / firewall chặn
```

### Vào bên trong container (như SSH)

```bash
# Mở shell bên trong container
docker exec -it crawler-worker bash

# Bên trong container, có thể chạy:
ls src/            # Xem file code
cat .env           # Xem biến môi trường (đã load)
node -v            # Xem version Node

# Thoát: gõ exit
```

### Container bị OOM Killed (hết RAM)

```bash
# Kiểm tra RAM đang dùng
docker stats

# Nếu bị kill → tăng memory limit trong docker-compose.yml:
#   limits:
#     memory: 3g    ← tăng từ 2g lên 3g

# Hoặc tạo swap trên VPS:
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Hết dung lượng disk

```bash
# Xem Docker đang chiếm bao nhiêu
docker system df

# Dọn dẹp image/container cũ không dùng
docker system prune -a
# Nhập "y" để xác nhận
```

### Không kết nối được Supabase

```bash
# Kiểm tra từ bên trong container
docker exec -it crawler-worker bash
curl -s https://ejwqyycoycyzuxseecck.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY" | head -20

# Nếu timeout → VPS bị firewall chặn outbound
# Nếu 401 → Key sai
```

---

## 7. Giải thích Dockerfile

```dockerfile
# Dùng Node.js 18 trên Debian bookworm-slim
FROM node:18-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app                    # cd /app

# --- Cache layer: dependencies ---
COPY package.json package-lock.json ./    # Copy file khai báo deps trước
RUN npm ci --omit=dev                     # Cài deps (CACHE nếu không đổi)

# --- Code layer: thay đổi thường xuyên ---
COPY src/ ./src/                          # Copy code
COPY tsconfig.json ./

ENV NODE_ENV=production

CMD ["npx", "tsx", "src/index.ts", "crawl"]   # Lệnh chạy khi start container
```

**Tại sao tách 2 layer?**

```
Lần build 1:  npm install (5 phút) → copy code → xong
Lần build 2:  package.json KHÔNG ĐỔI → dùng cache (0s) → copy code mới → 10 giây
```

---

## 8. Giải thích docker-compose.yml

```yaml
services:
  crawler:
    build: .                      # Build từ Dockerfile cùng thư mục
    container_name: crawler-worker
    restart: unless-stopped       # Tự restart khi crash, KHÔNG restart khi tự tay stop

    env_file: .env                # Load biến môi trường

    volumes:
      - ./output:/app/output      # Nối thư mục: VPS ↔ Container
                                  # Dữ liệu crawl không mất khi restart

    deploy:
      resources:
        limits:
          memory: 2g              # Tối đa 2GB RAM (tránh crash VPS)

    logging:
      options:
        max-size: "50m"           # Log tối đa 50MB/file
        max-file: "3"             # Giữ 3 file (tổng 150MB, không phình disk)
```

---

## 9. Cheat Sheet

```
╔══════════════════════════════════════════════════════════════╗
║  DOCKER COMPOSE — LỆNH HAY DÙNG                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  docker compose up -d --build   Build + chạy nền             ║
║  docker compose down            Dừng tất cả                  ║
║  docker compose restart         Restart                      ║
║  docker compose logs -f         Xem log realtime             ║
║  docker compose logs --tail 50  Xem 50 dòng cuối             ║
║  docker compose ps              Xem trạng thái               ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  DEBUG                                                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  docker exec -it crawler-worker bash   Vào trong container   ║
║  docker stats                          Xem CPU/RAM           ║
║  docker system df                      Xem disk Docker       ║
║  docker system prune -a                Dọn rác               ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  DEPLOY LÊN VPS                                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  # Từ local:                                                 ║
║  rsync -avz --exclude 'node_modules' --exclude 'output' \    ║
║    --exclude '.git' ./crawler-pipeline/ \                    ║
║    root@IP:/opt/crawler-pipeline/                            ║
║                                                              ║
║  # Trên VPS:                                                 ║
║  cd /opt/crawler-pipeline                                    ║
║  docker compose up -d --build                                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```
