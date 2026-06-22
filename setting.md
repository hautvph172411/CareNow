# Hướng dẫn cài đặt và chạy dự án CareNow (Setup Guide)

Dự án CareNow là hệ thống được thiết kế theo mô hình Microservices/Modular, bao gồm 5 sub-project chạy độc lập nhưng liên kết với nhau thông qua API và Database. Dưới đây là hướng dẫn chi tiết để thiết lập và chạy toàn bộ hệ thống trên máy tính local.

## 1. Yêu cầu hệ thống (Prerequisites)
- **Node.js**: Phiên bản 18.x trở lên.
- **PostgreSQL**: Phiên bản 14.x trở lên (đã cài đặt và đang chạy).
- **Git** để clone source code.
- Môi trường: MacOS, Linux hoặc Windows.

---

## 2. Thiết lập Database (PostgreSQL)

1. Mở PostgreSQL (qua pgAdmin hoặc Terminal) và tạo một database mới:
   ```sql
   CREATE DATABASE carenow_db;
   ```
2. Database Schema và Migrations:
   Dự án sử dụng file `.sql` để tạo bảng và dữ liệu mẫu. Bạn cần chạy các file sql nằm trong thư mục `carenow-backend/src/config/migrations/` hoặc import trực tiếp từ file backup của dự án (nếu có).

---

## 3. Cài đặt các thư mục Backend

Hệ thống có 2 backend chuyên biệt. Bạn cần thực hiện cài đặt cho từng backend một.

### 3.1. CareNow Backend (Backend Chính)
Phục vụ API cho Admin hệ thống và Bệnh nhân. Chạy ở Port **5000**.

1. Di chuyển vào thư mục:
   ```bash
   cd carenow-backend
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường:
   Tạo file `.env` ngang hàng với thư mục `src` với nội dung:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=carenow_db

   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES=8h

   # Cấu hình lưu trữ ảnh Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```
4. Khởi chạy:
   ```bash
   npm run dev
   ```

### 3.2. Partner Backend (Backend Đối tác)
Phục vụ API cho đối tác (phòng khám, bệnh viện, bác sĩ hợp tác). Chạy ở Port **5001**.

1. Di chuyển vào thư mục:
   ```bash
   cd partner-backend
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Cấu hình file `.env` tương tự như Backend Chính.
4. Khởi chạy:
   ```bash
   npm run dev
   ```

---

## 4. Cài đặt các thư mục Frontend (React/Vite)

Dự án có 3 frontend chạy bằng Vite, đóng vai trò hiển thị giao diện cho 3 đối tượng người dùng khác nhau.

### 4.1. Frontend Admin (Trang quản trị hệ thống)
Dành cho quản trị viên tối cao. Chạy ở Port **5173**.

1. Di chuyển vào thư mục:
   ```bash
   cd frontend
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Khởi chạy:
   ```bash
   npm run dev
   ```

### 4.2. CareNow Client (Trang dành cho bệnh nhân)
Website chính thức đặt lịch cho khách hàng. Chạy ở Port **5174**.

1. Di chuyển vào thư mục:
   ```bash
   cd carenow-client
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```
4. Khởi chạy:
   ```bash
   npm run dev
   ```

### 4.3. Frontend Partner (Trang dành cho đối tác)
Cổng thông tin cho phòng khám và đối tác quản lý. Chạy ở Port **5175**.

1. Di chuyển vào thư mục:
   ```bash
   cd frontend-partner
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env`:
   ```env
   VITE_API_URL=http://localhost:5001
   ```
4. Khởi chạy:
   ```bash
   npm run dev
   ```

---

## 5. Tóm tắt các Port hoạt động

Để hệ thống hoạt động hoàn chỉnh với đầy đủ chức năng, bạn cần mở 5 terminal (hoặc sử dụng tmux/pm2) và chạy đồng thời cả 5 service:

| Service | Thư mục | Lệnh khởi chạy | Port | URL truy cập Local |
|---|---|---|---|---|
| **Backend Admin/Client** | `carenow-backend` | `npm run dev` | 5000 | `http://localhost:5000` |
| **Backend Đối tác** | `partner-backend` | `npm run dev` | 5001 | `http://localhost:5001` |
| **Frontend Admin** | `frontend` | `npm run dev` | 5173 | `http://localhost:5173` |
| **Frontend Client** | `carenow-client` | `npm run dev` | 5174 | `http://localhost:5174` |
| **Frontend Đối tác** | `frontend-partner` | `npm run dev` | 5175 | `http://localhost:5175` |

Chúc bạn cài đặt thành công!
