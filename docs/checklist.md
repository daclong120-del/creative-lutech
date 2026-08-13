# Cổng chặn — chưa qua thì chưa xong

File này **là** định nghĩa của "xong". Nó gom mọi lệnh kiểm rải rác trong bộ docs về một chỗ.

---

## 1. Đổi X thì phải sửa doc nào

Bảng này chống chế độ hỏng phổ biến nhất: code đổi, doc ở lại.

| Đổi cái gì | Sửa doc |
|---|---|
| Thêm/xoá bảng, cột, RPC, RLS | [database-design.md](database-design.md) |
| Thêm/đổi endpoint worker, scope, luật lọc | [api-design.md](api-design.md) §2 §4 — **chủ sở hữu của danh sách scope** |
| Đổi `proxy.ts`, `auth-helper.ts`, `csrf.ts` | [auth-model.md](auth-model.md) + [security.md](security.md) |
| Thêm/xoá biến môi trường | [environment.md](environment.md) — **chủ sở hữu duy nhất** |
| Thêm/xoá trang | [ui-structure.md](ui-structure.md) §1 + [features.md](features.md) |
| Đổi Dockerfile, compose, systemd | [containerization.md](containerization.md) |
| Đổi workflow CI | [cicd.md](cicd.md) |
| Đổi quyết định kiến trúc | [architecture.md](architecture.md) — **kèm phương án đã loại** |
| Tính năng chạy được thật | [features.md](features.md) — đổi ⬜/🟨 → ✅ |
| Sửa một lỗi tốn hơn một giờ | [learn.md](learn.md) — **kèm hướng đã thử mà không hiệu quả** |
| Xong một mục T-xx | [task-plan.md](task-plan.md) + [changelog.md](changelog.md) |
| Thêm file mới vào `docs/` | Ba việc bắt buộc ở [docs-plan.md](docs-plan.md) §5 |

---

## 2. Cổng trước khi commit

### 2.1 Code

```bash
cd dashboard && npm run lint && npm run build
```

Không xanh cả hai → chưa xong. `npm run build` là thứ duy nhất bắt lỗi type ở toàn dự án, vì không có bước `tsc --noEmit` riêng.

### 2.2 Bảo mật — bốn lệnh, vài giây

```bash
# 1. Bí mật không lọt ra client
grep -rn "NEXT_PUBLIC_" dashboard --include=*.ts --include=*.tsx | grep -iE "service_role|secret|token"

# 2. Mọi action ghi đều có CSRF, và có kiểm kết quả trả về
grep -n "verifyCSRF" dashboard/lib/actions/*.ts | grep -v "if (!"

# 3. Không có .env bị commit
git ls-files | grep -E '\.env$|\.env\.local$'

# 4. Đường vòng đăng nhập dev đã bị chặn bằng cờ môi trường
grep -rn "dev-admin-id\|sinomedia_dev_user" dashboard --include=*.ts --include=*.tsx
```

Lệnh 1–3 phải **rỗng**. Lệnh 4 phải cho ra kết quả nằm trong một nhánh có kiểm `NODE_ENV`/cờ — hôm nay **chưa đạt**, xem [security.md](security.md) §2.1.

### 2.3 Test

```bash
cd automation-test && npx playwright test
```

Bắt buộc chạy khi đụng vào: `route.ts` của gateway · `token.guard.ts` · `csrf.ts` · `auth-helper.ts` · `proxy.ts` · `src/sign/`.

Nhanh hơn khi chỉ đụng gateway:

```bash
npx playwright test tests/crawler-contracts tests/api-tokens tests/video-proxy
```

### 2.4 Luật phụ thuộc

```bash
# Chỉ repository được chạm bảng
grep -rl '\.from("' dashboard/lib dashboard/app | grep -v repositories        # rỗng

# Chỉ realtime/ import browser client
grep -rl 'createClientBrowser' dashboard --include=*.ts --include=*.tsx       # 1 file

# Chỉ store/supabase_client.ts gọi gateway
grep -rl 'rest/v1' crawler-pipeline/src                                        # 1 file
```

### 2.5 Doc

```bash
cd docs

# Link gãy
for f in *.md; do
  grep -oE '\]\(([^)#]+)' "$f" | sed 's/](//' | while read -r l; do
    [ -e "$l" ] || echo "BROKEN: $f -> $l"
  done
done

# File mồ côi
for f in *.md; do
  [ "$f" = "README.md" ] && continue
  grep -q "$f" README.md || echo "MỒ CÔI: $f"
done
```

Cả hai phải rỗng.

---

## 3. Cổng khi đổi schema

Bỏ bước nào cũng cho ra lỗi khó lần.

- [ ] Có file trong `supabase/migrations/` — **kể cả** khi đã sửa tay trên Studio
- [ ] `supabase db reset` chạy sạch trên máy trắng
- [ ] `cd dashboard && npm run types:gen`
- [ ] Nếu worker cần cột mới: đã thêm vào `ALLOWED_COLUMNS` **và** `POST_WHITELISTS`/`PATCH_WHITELISTS`
- [ ] Nếu cần realtime: đã `alter publication supabase_realtime add table`
- [ ] Migration **tương thích ngược** — [deployment.md](deployment.md) §3
- [ ] Đã cập nhật [database-design.md](database-design.md)

---

## 4. Cổng khi đổi Worker Gateway

`route.ts` là bề mặt bảo mật. Sau khi token hợp lệ, **không còn hàng rào nào phía sau**.

- [ ] Đã thêm dòng vào `determineRequiredScopes()`
- [ ] Đã thêm bảng vào `ALLOWED_COLUMNS` nếu có `GET`/`order`/`select`
- [ ] Đã thêm whitelist body nếu có ghi
- [ ] **Không** nới `select` để cho phép `(`, `)`, `.`, `:` — đó là mở join sang mọi bảng, kể cả `api_tokens`
- [ ] **Không** nới hai chế độ của `crawler_accounts` — đó là mở đường rút cookie
- [ ] Đã cấp scope cho token trong `api_tokens.scopes`
- [ ] Đã thêm test hợp đồng vào `automation-test/tests/crawler-contracts/`
- [ ] Đã cập nhật bảng scope ở [api-design.md](api-design.md) §2

---

## 5. Cổng trước khi deploy production

- [ ] Đã verify trên Preview hoặc Review
- [ ] Biến môi trường đủ trên Vercel — đối chiếu bằng lệnh ở [environment.md](environment.md) §6
- [ ] Migration đã đẩy **trước** khi deploy code
- [ ] [changelog.md](changelog.md) đã cập nhật
- [ ] Có đường rollback — [deployment.md](deployment.md) §4
- [ ] Sau khi deploy: chạy 6 bước kiểm ở [deployment.md](deployment.md) §6, **không bỏ bước 3** (tạo một task thật)

---

## 6. Cổng của một thay đổi — vòng đầy đủ

| Trạng thái | Cổng ra — chưa qua thì cấm sang bước sau |
|---|---|
| **Phân loại** | Đã đối chiếu [requirements.md](requirements.md). Nằm ngoài phạm vi → sửa bảng Out of scope **trước**, không đi thẳng sang thiết kế |
| **Thiết kế** | Doc hợp đồng sửa xong (api / database / auth tuỳ loại). Đã ghi **phương án đã loại**. Kịch bản hỏng đã thành case test có ID |
| **Duyệt** | **Người** duyệt. Đây là cổng bị bỏ nhiều nhất — sửa doc và code trong cùng một lượt rồi mới đưa duyệt thì lúc duyệt code đã viết, không ai muốn bỏ nữa |
| **Code** | Code khớp thiết kế. Lệch nhỏ → sửa **ngược** vào doc. Lệch lớn → quay lại bước duyệt |
| **Kiểm** | §2.1–§2.4 xanh. Đã chạy cả **đường hỏng**, không chỉ đường thành công |
| **Đồng bộ** | §1 xong, §2.5 rỗng. **Xong bước này mới là xong** |

---

## 7. Cổng nào hiện **không** được tự động cưỡng chế

Nói thẳng, vì một checklist mà không ai kiểm thì chỉ là danh sách nguyện vọng.

| Cổng | Ai cưỡng chế hôm nay |
|---|---|
| §2.1 lint + build | **Không ai.** Vercel build sau khi merge — quá muộn |
| §2.2 kiểm bảo mật | **Không ai** |
| §2.3 test | **Không ai.** CI chỉ build image Docker |
| §2.4 luật phụ thuộc | **Không ai** |
| §2.5 link doc | **Không ai** |
| §3–§5 | **Không ai** |

Toàn bộ file này hiện là **kỷ luật của con người**. Biến §2.1–§2.4 thành job CI là việc rẻ nhất có tác động lớn nhất trong toàn bộ [task-plan.md](task-plan.md) — xem T-04 và [cicd.md](cicd.md) §4.
