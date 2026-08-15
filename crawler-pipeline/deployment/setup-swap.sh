#!/bin/bash
# # Kịch bản thiết lập bộ nhớ ảo Swap 4GB cho VPS 2GB RAM để chống tràn bộ nhớ (OOM)

set -e

echo "=== ĐANG THIẾT LẬP BỘ NHỚ SWAP 4GB ==="

if [ -f /swapfile ]; then
    echo "Tệp swapfile đã tồn tại. Đang tắt và làm mới..."
    sudo swapoff /swapfile || true
    sudo rm -f /swapfile
fi

echo "Đang cấp phát tệp swapfile 4GB..."
sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096

echo "Thiết lập quyền truy cập bảo mật..."
sudo chmod 600 /swapfile

echo "Định dạng vùng nhớ swap..."
sudo mkswap /swapfile

echo "Kích hoạt vùng nhớ swap..."
sudo swapon /swapfile

echo "Cấu hình tự động nạp swap khi khởi động hệ thống..."
if ! grep -q "/swapfile" /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "=== THIẾT LẬP SWAP THÀNH CÔNG ==="
free -h
