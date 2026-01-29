# Hướng dẫn cấu hình LINE Login với Supabase Edge Function

## Tổng quan

Do hạn chế về thuật toán mã hóa (HS256) của LINE Login không tương thích trực tiếp với chuẩn OIDC của Supabase (yêu cầu RS256), chúng ta sử dụng **Supabase Edge Function** làm trung gian để xác thực và tạo session.

Hệ thống hoạt động như sau:
1. Mobile App: Mở browser cho user login LINE -> Nhận `authorization_code`.
2. Mobile App: Gửi `code` lên Edge Function `line-login`.
3. Edge Function:
   - Trao đổi `code` lấy `access_token` từ LINE.
   - Lấy thông tin user (Profile) từ LINE.
   - Tạo/Cập nhật user trong Supabase Database (sử dụng Admin API).
   - Tạo Custom JWT (Session) của Supabase.
   - Trả về Session cho App.
4. Mobile App: Lưu session và đăng nhập thành công.

## Bước 1: Setup LINE Channel (Đã có)

Bạn đã có:
- **Channel ID**: `2009005123`
- **Channel Secret**: `f82916710eb60b17e6cdbbd58a100919`

### Cấu hình Callback URL
Trong LINE Developers Console > LINE Login > Callback URL, thêm:
```
didi-mobile://auth/callback
```
(Và `exp://localhost:8081/--/auth/callback` nếu chạy dev client)

## Bước 2: Deploy Edge Function

Mã nguồn Edge Function đã được tạo tại: `supabase/functions/line-login/index.ts`

### 2.1. Cài đặt biến môi trường (Secrets)
Chạy lệnh sau trong terminal để lưu các khóa bí mật lên Supabase (thay thế bằng giá trị thực nếu cần):

```bash
supabase secrets set LINE_CHANNEL_ID=2009005123
supabase secrets set LINE_CHANNEL_SECRET=f82916710eb60b17e6cdbbd58a100919
supabase secrets set SUPABASE_JWT_SECRET=<Lấy từ Supabase Dashboard > Settings > API > JWT Secret>
```

> **Lưu ý**: `SUPABASE_JWT_SECRET` rất quan trọng để ký token.

### 2.2. Deploy Function
Chạy lệnh deploy:

```bash
supabase functions deploy line-login --no-verify-jwt
```
(Flag `--no-verify-jwt` để cho phép gọi function mà không cần login trước - vì user chưa login mà).

## Bước 3: Cấu hình App (Đã cập nhật)

Code trong `AuthManager.ts` và `auth.config.ts` đã được cập nhật để sử dụng Edge Function này.

### `src/services/config/auth.config.ts`
Đã thêm `LINE_CHANNEL_ID`.

### `src/services/auth/AuthManager.ts`
Method `signInWithLINE` đã chuyển sang luồng:
1. `WebBrowser.openAuthSessionAsync` tới LINE.
2. `supabase.functions.invoke('line-login', ...)` để trao đổi code.
3. `supabase.auth.setSession` với token trả về.

## Troubleshooting

### Lỗi: "Functions fetch failed"
- Kiểm tra xem bạn đã deploy function chưa.
- Kiểm tra xem đã set đủ secrets (`LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `SUPABASE_JWT_SECRET`) chưa.

### Lỗi: "Redirect URI mismatch" (400 Bad Request từ LINE)
- Đảm bảo `redirect_uri` gửi đi (thường là `didi-mobile://...`) **TRÙNG KHỚP HOÀN TOÀN** với cái khai báo trong LINE Console.
