# Pipeline — cái gì **đang** chạy tự động

<!-- gen: ls .github/workflows -->

**Đúng một workflow.** Không có gì khác.

---

## 1. `deploy-crawler.yml`

| Mục | Giá trị |
|---|---|
| Kích hoạt | `push` lên `main` khi đường dẫn khớp `crawler-pipeline/**` hoặc chính file workflow; và `workflow_dispatch` |
| Runner | `ubuntu-latest` |
| Quyền | `contents: read`, `packages: write` |
| Bước | checkout → setup Buildx → login `ghcr.io` bằng `GITHUB_TOKEN` → `build-push-action@v6` |
| Đích | `ghcr.io/daclong120-del/sinomedia-crawler:latest` |
| Cache | GitHub Actions cache (`type=gha`, `mode=max`) |

Chỉ một tag: `:latest`. Không tag theo commit SHA, không tag theo phiên bản.

**Hệ quả:** không quay lại được một bản image cụ thể. Rollback crawler nghĩa là build lại từ commit cũ, không phải kéo một tag cũ. Đây là chỗ rẻ nhất để cải thiện — thêm `${{ github.sha }}` vào danh sách tag. Ghi ở [task-plan.md](task-plan.md) T-05.

Workflow **chỉ build và đẩy image**. Nó không chạm tới VPS. Bước kéo về là thao tác tay — [deployment.md](deployment.md) §2.

---

## 2. Cái gì **không** có

Đây là phần quan trọng của file này. Nói thẳng để không ai đọc chữ "CI/CD" rồi giả định có hàng rào.

| Không có | Hệ quả |
|---|---|
| Chạy test trên PR | 42 test Playwright **không bao giờ chạy tự động**. Chúng chỉ chạy khi có người gõ lệnh |
| `npm run lint` trong CI | Lỗi lint chỉ hiện ở máy dev, và chỉ khi ai đó nhớ chạy |
| `npm run build` cho dashboard trong CI | Lỗi build chỉ hiện khi Vercel build — tức là **sau** khi merge |
| Kiểm type (`tsc --noEmit`) | — |
| Quét bí mật | `.env` bị commit nhầm sẽ không ai chặn |
| Deploy migration | Hoàn toàn tay |
| Workflow cho dashboard | Vercel tự deploy; không có cổng nào trước đó |
| Bảo vệ branch với status check | Không có check nào để bắt buộc |

**Kết luận thẳng: pipeline hiện tại không chặn được gì cả.** Nó là một pipeline *đóng gói*, không phải pipeline *chất lượng*.

Đây là mục ⬜ R-14 ở [requirements.md](requirements.md) §3 và là một trong ba tiêu chí "xong" ở §6 của file đó.

---

## 3. Vì sao khoảng trống này đắt

Bình thường thiếu CI test là bất tiện. Ở dự án này nó đắt gấp đôi, vì hai lý do:

**Code được viết cùng AI.** Nghĩa là đang nhận về code mà không tự suy ra từng dòng. Thứ bù cho việc đó không phải doc mô tả ý định — mà là hàng rào bắt được lúc AI làm sai. Hàng rào đó hiện không tồn tại.

**Bảo mật của đường worker nằm gọn trong một file.** 9 lớp lọc trong `route.ts` **là** toàn bộ bảo mật sau khi token hợp lệ ([security.md](security.md) §3). Có sẵn `automation-test/tests/crawler-contracts/` để kiểm chúng — nhưng không có gì bắt bộ test đó chạy trước khi merge. Nới lỏng một dòng trong `route.ts` hôm nay sẽ **không** bị chặn.

Tỉ lệ dòng doc : dòng test đo được:

```bash
find docs -name '*.md' | xargs wc -l | tail -1
find automation-test/tests -name '*.spec.ts' | xargs wc -l | tail -1
```

Tỉ lệ vượt khoảng 5:1 nghĩa là đã dồn vốn vào tầng **mô tả** và bỏ tầng **cưỡng chế**. Bộ docs này làm tỉ lệ đó tệ đi, không tốt lên. Đừng coi việc viết xong docs là xong việc.

---

## 4. Pipeline tối thiểu nên dựng trước

Xếp theo tỉ lệ giá trị / công sức. Chi tiết ở [task-plan.md](task-plan.md) T-04.

| # | Việc | Bắt được cái gì | Công |
|---|---|---|---|
| 1 | Workflow chạy `npm run lint` + `npm run build` trên PR động tới `dashboard/**` | Lỗi build **trước** khi merge, không phải sau | Thấp |
| 2 | Chạy `tests/crawler-contracts` + `tests/api-tokens` trên PR động tới `route.ts` hoặc `token.guard.ts` | Nới lỏng bảo mật gateway | Thấp |
| 3 | Bốn lệnh kiểm bảo mật ở [security.md](security.md) §6 thành một job | Lộ bí mật, thiếu CSRF, `.env` bị commit | Thấp |
| 4 | Bật branch protection, bắt buộc các check trên | Biến chúng thành cổng thật thay vì thông tin | Rất thấp |
| 5 | Thêm tag `${{ github.sha }}` cho image crawler | Rollback được về một bản cụ thể | Rất thấp |

Bốn mục đầu chạy trong dưới hai phút và không cần hạ tầng mới. Bộ Playwright đầy đủ cần một dashboard đang chạy nên phức tạp hơn — để sau, đừng lấy nó làm lý do trì hoãn bốn mục trên.

---

## 5. Chạy tay những gì CI nên chạy

Cho tới khi có pipeline, đây là danh sách người merge phải tự chạy:

```bash
# Dashboard
cd dashboard && npm run lint && npm run build

# Test
cd ../automation-test && npx playwright test

# Chỉ test hợp đồng gateway (nhanh)
npx playwright test tests/crawler-contracts tests/api-tokens

# Kiểm bảo mật — security.md §6
cd .. && grep -rn "NEXT_PUBLIC_" dashboard --include=*.ts --include=*.tsx | grep -iE "service_role|secret|token"
grep -L "verifyCSRF" dashboard/lib/actions/*.ts
git ls-files | grep -E '\.env$|\.env\.local$'
```

Cổng đầy đủ trước commit: [checklist.md](checklist.md).
