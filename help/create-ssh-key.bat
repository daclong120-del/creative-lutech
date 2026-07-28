@echo off
chcp 65001 > nul
echo ==================================================
echo ĐANG TẠO SSH KEY (ED25519) CHO conghieu@lutech.vn
echo ==================================================

:: Tao thu muc .ssh neu chua co
if not exist "%USERPROFILE%\.ssh" mkdir "%USERPROFILE%\.ssh"

:: Chay lenh tao SSH key tu dong (passphrase de trong, khong can hoi vi tri)
ssh-keygen -t ed25519 -C "conghieu@lutech.vn" -f "%USERPROFILE%\.ssh\id_ed25519" -N ""

echo.
echo ==================================================
echo DA TAO XONG SSH KEY THANH CONG!
echo ==================================================
echo.

:: Sao chep noi dung Public Key vao Clipboard
type "%USERPROFILE%\.ssh\id_ed25519.pub" | clip

echo [!] Noi dung Public Key (id_ed25519.pub) da duoc tu dong COPY vao Clipboard!
echo [!] Ban chi can nhan tin cho anh kia va nhan Ctrl+V (Dan) la xong.
echo.
echo Neu Ctrl+V khong duoc, ban co the copy doan ma duoi day:
echo --------------------------------------------------
type "%USERPROFILE%\.ssh\id_ed25519.pub"
echo --------------------------------------------------
echo.
echo Thu muc chua SSH key cung da duoc mo len.
echo File can gui la: id_ed25519.pub (tuyet doi khong gui file khong co duoi .pub)
echo.
pause

:: Mo thu muc .ssh
explorer "%USERPROFILE%\.ssh"
