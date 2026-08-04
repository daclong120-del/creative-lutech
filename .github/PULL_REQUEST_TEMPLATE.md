## Mô tả thay đổi

<!-- Mô tả ngắn gọn PR này làm gì. Tối đa 3 dòng. -->

### Loại thay đổi

<!-- Đánh dấu phù hợp, xóa các dòng không dùng -->

- [ ] 🐛 Bug fix (non-breaking change sửa lỗi)
- [ ] ✨ New feature (non-breaking change thêm chức năng)
- [ ] 💥 Breaking change (fix/feature phá contract hiện có)
- [ ] 📝 Documentation (chỉ đổi docs)
- [ ] 🎨 Refactor (không đổi behavior)
- [ ] ⚡ Performance (cải thiện hiệu năng)
- [ ] 🧪 Test (thêm/sửa test)
- [ ] 🔧 Build / CI / deps

### Module bị ảnh hưởng

<!-- Đánh dấu phù hợp -->

- [ ] Dashboard
- [ ] Crawler Pipeline
- [ ] Release Ops
- [ ] Supabase (migration)
- [ ] Auto-gen-image
- [ ] Desktop-app
- [ ] CI/CD
- [ ] Docs only

## Liên kết

<!-- Liên kết issue / ticket liên quan. Dùng Closes để auto-close khi merge. -->

- Closes #
- Refs #
- Related: #

## Context bổ sung

<!-- Bối cảnh: tại sao cần thay đổi này? Vấn đề đang giải quyết là gì? -->

## Cách test

<!-- PR review có thể test bằng cách nào? Liệt kê các bước cụ thể. -->

1.
2.
3.

## Checklist tác giả

<!-- Tự kiểm tra trước khi request review. Bỏ qua mục không liên quan. -->

### Code

- [ ] Đã chạy `npm run lint` ở các package bị ảnh hưởng, pass
- [ ] Đã chạy `npm run build` (cho dashboard), pass
- [ ] Không có `console.log` / `debugger` bỏ lại
- [ ] Không có `any` không có comment giải thích
- [ ] Function > 50 dòng đã tách nhỏ

### Test

- [ ] Có test đi kèm (unit / integration / manual test case)
- [ ] Test pass trên local
- [ ] Bug fix: có test tái tạo bug trước khi fix

### Tài liệu

- [ ] README / ADR / runbook liên quan đã cập nhật (nếu đổi behavior)
- [ ] Migration có comment giải thích (nếu có migration mới)
- [ ] JSDoc cho public API mới

### Bảo mật

- [ ] Không commit file nhạy cảm (`.env`, raw token, service account key)
- [ ] Không log token, cookie, signing URL
- [ ] RLS policy đã test với 2 user khác nhau (nếu đụng RLS)
- [ ] Token scope đúng với endpoint mới

### Deploy

- [ ] Migration đã test với `supabase db reset`
- [ ] Biến môi trường mới đã document trong README / runbook
- [ ] Có rollback plan nếu là breaking change

## Screenshot / Video

<!-- Nếu có thay đổi UI, attach screenshot hoặc gif. Xóa mục này nếu không liên quan. -->

## Ghi chú cho reviewer

<!-- Điểm cần reviewer chú ý đặc biệt, hoặc quyết định thiết kế cần xác nhận. -->