# Phương pháp — bộ tài liệu này được dựng như thế nào

File này không mô tả sản phẩm. Nó mô tả **luật viết tài liệu** cho `docs/`. Đọc trước khi thêm hoặc sửa bất kỳ file nào ở đây.

Bộ này được dựng lại từ đầu ngày **2026-08-13**, bằng cách đối chiếu `old-docs/` với code đang chạy. `old-docs/` là **bản ghi lịch sử**, không phải nguồn sự thật.

---

## 1. Khung phân loại — hai loại nội dung

| Loại | Ví dụ trong bộ này | Trôi không | Luật |
|---|---|---|---|
| **Kể lý do** | phương án đã loại ở [architecture.md](architecture.md), bài học ở [learn.md](learn.md), ranh giới ở [context.md](context.md) | Không bao giờ | Viết bao nhiêu cũng được |
| **Chép trạng thái** | bảng biến env, danh sách scope, cây thư mục, số trang, số bảng DB | Mỗi commit | Viết ít nhất mức cần, **mỗi bảng phải có lệnh sinh lại** |

Mọi bảng thuộc loại "chép trạng thái" trong bộ này đều có một dòng `<!-- gen: ... -->` ngay trên nó. Đó là lệnh chạy lại để kiểm bảng còn đúng không. [checklist.md](checklist.md) gom toàn bộ các lệnh đó thành một cổng chạy trước commit.

---

## 2. Nguồn dữ liệu — con số trong bộ này lấy từ đâu

Không con số nào được chép tay. Mọi con số đến từ một trong các lệnh sau, chạy tại **root repo**:

```bash
# Cây file (bỏ node_modules, build output)
find . -type f -not -path '*/node_modules/*' -not -path './.git/*' \
  -not -path '*/.next/*' -not -path '*/dist/*' -not -path './.gitnexus/*'

# Trang dashboard
find dashboard/app -name 'page.tsx' | sort

# Route handler (API)
find dashboard/app -name 'route.ts' | sort

# Scope worker gateway — nguồn duy nhất là hàm determineRequiredScopes()
grep -oE '"crawler:[a-z_]+"' dashboard/app/api/worker/rest/v1/\[...path\]/route.ts | sort -u

# Biến môi trường — PHẢI grep cả hai dạng, xem cạm bẫy §4
grep -rhoE 'process\.env\.[A-Z_0-9]+' dashboard/app dashboard/lib dashboard/components \
  dashboard/proxy.ts dashboard/next.config.ts | sort -u
grep -rhoE 'getEnv\("[A-Z_0-9]+"\)' crawler-pipeline/src | sort -u
grep -rhoE 'process\.env\.[A-Z_0-9]+' crawler-pipeline/src | sort -u

# Bảng có migration
grep -rhoiE 'create table (if not exists )?(public\.)?[a-z_"]+' supabase/migrations | sort -u

# Bảng thật sự tồn tại trên DB (từ type đã generate)
grep -oE '^      [a-z_]+: \{' dashboard/types/supabase.ts

# Hàm RPC có migration
grep -rhoiE 'create (or replace )?function [a-z_.]+' supabase/migrations | sort -u

# Số test thật
find automation-test/tests -name '*.spec.ts' | wc -l
grep -rcE '^\s*test\(' automation-test/tests/*/*.spec.ts
```

---

## 3. Thứ **cố ý không viết**, kèm lý do

Không có mục này thì sáu tuần nữa sẽ có người (hoặc AI) thêm vào cho "đủ bộ".

| Không viết | Vì sao |
|---|---|
| `prototype.md` (wireframe, kịch bản dùng) | Dashboard đã chạy thật với 39 trang. UI thật là nguồn sự thật; wireframe vẽ lại chỉ để trôi sau một sprint. Cấu trúc UI nằm ở [ui-structure.md](ui-structure.md) |
| `output-contract.md` | Hệ thống **không** bàn giao file/dữ liệu ra ngoài. Dữ liệu ở lại trong Supabase; hình dạng của nó do [database-design.md](database-design.md) sở hữu |
| `public-access.md` riêng | Đường ra Internet chỉ có một: Vercel + domain. Gộp vào [deployment.md](deployment.md) §5 là đủ, tách ra thì thành file 20 dòng |
| Tài liệu cho từng hàm / JSDoc đầy đủ | Comment giải thích **vì sao** trong code đã đủ. JSDoc lặp lại tên hàm là nhiễu — xem [code-rules.md](code-rules.md) §6 |
| Doc bảng màu / design system | UI dùng Tailwind utility trực tiếp, không có token hệ thống. Viết design system bây giờ là viết cho thứ chưa tồn tại |
| SLA / on-call rotation | Chưa có cam kết vận hành với ai. [runbook.md](runbook.md) lo triệu chứng → hành động, không lo lịch trực |
| Sơ đồ deploy riêng cho từng môi trường | Bốn môi trường khác nhau ở đúng 5 điểm. Một bảng trong [environment.md](environment.md) §3 diễn đạt tốt hơn bốn sơ đồ |
| Tài liệu cho `auto-gen-image/`, `desktop-app/`, `external/`, `builds/`, `init-design/` | Ngoài ranh giới hệ thống — xem [context.md](context.md) §3. Chúng ở chung repo nhưng không thuộc luồng vận hành chính |

---

## 4. Cạm bẫy đã dính khi dựng bộ này

Ghi lại vì nó sẽ lặp lại.

**Lệnh grep biến env bỏ sót một nửa.** Lệnh `grep -rhoE 'process\.env\.[A-Z_]+' crawler-pipeline/src` chạy sạch và trả về 21 biến — trông rất thuyết phục. Nhưng hai biến **quan trọng nhất** của crawler, `INTERNAL_API_URL` và `API_TOKEN`, không nằm trong đó: chúng được đọc qua helper `getEnv()` trong [config.ts](../crawler-pipeline/src/config.ts), không qua `process.env.X` trực tiếp. Lệnh sinh dữ liệu đúng cú pháp vẫn có thể sai kết quả. Luôn đọc chỗ khai báo config, đừng chỉ tin grep.

**File `.env.example` là doc, không phải code — và nó đã nói dối.** [crawler-pipeline/.env.example](../crawler-pipeline/.env.example) liệt kê `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, trong khi `config.ts` **throw ngay khi khởi động** nếu thiếu `INTERNAL_API_URL`/`API_TOKEN`. Làm theo `.env.example` thì worker không chạy được. Xem [learn.md](learn.md) §1.

**Doc cũ mô tả thứ chưa build như thể đã build.** `old-docs/ARCHITECTURE_MASTER.md` vẽ đầy đủ `/api/release-ops/worker/v1/*` với 9 endpoint và 8 scope. Route đó **không tồn tại**. Bộ mới dùng ký hiệu ⬜/🟨/✅ ở mọi bảng có thành phần chưa xong.

---

## 5. Ba việc **bắt buộc** khi thêm một file mới vào `docs/`

1. Thêm dòng vào bảng phân loại ở §1 hoặc bảng "cố ý không viết" ở §3 của file này.
2. Thêm vào [README.md](README.md) — **cả** bảng "đọc gì trước" **lẫn** bảng toàn bộ tài liệu **lẫn** bảng chủ sở hữu nếu file nắm một sự thật mới.
3. Nối vào sơ đồ quan hệ ở [README.md](README.md) §4.

Kiểm file mồ côi:

```bash
cd docs && for f in *.md; do
  [ "$f" = "README.md" ] && continue
  grep -q "$f" README.md || echo "MỒ CÔI: $f"
done
```

---

## 6. Luật chống trùng

Một sự thật có **đúng một chủ**. Bảng chủ sở hữu nằm ở [README.md](README.md) §3.

Trước khi viết một đoạn, hỏi: *thứ này đã có chủ chưa?* Có rồi thì trỏ link, không chép lại — kể cả khi chép chỉ mất ba dòng. Chép ba dòng vào file thứ tư nghĩa là lần sau đổi một cờ phải sửa bốn chỗ; và doc chép lại không sai lúc viết, nó sai sáu tuần sau.

Dấu hiệu trùng quá mức:

```bash
for t in INTERNAL_API_URL requireAdmin claim_next_crawler_task release_ops_jobs; do
  echo "$t: $(grep -rl "$t" docs/ | wc -l) file"
done
```

Trên 3 file cho một khái niệm là đáng nghi — trừ khi các file kia chỉ **link** tới chủ.
