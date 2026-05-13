# CareNow Client

Trang dành cho người dùng cuối (bệnh nhân) của hệ thống CareNow.

## Tech Stack

- React 19 + Vite
- React Router v7
- Axios
- CSS Variables (cùng color tokens với admin)

## Scripts

```bash
npm install
npm run dev      # http://localhost:5174
npm run build
npm run preview
```

## Cấu trúc

```
src/
├── api/             # Axios instance + API clients
├── assets/          # Hình ảnh, icon
├── components/      # Component dùng chung (Header, Footer, ...)
├── contexts/        # React Context (Auth, ...)
├── hooks/           # Custom hooks
├── layouts/         # Layout pages
├── pages/           # Các trang (Home, Login, BookAppointment, ...)
├── routes/          # Khai báo route
├── styles/          # Global CSS, styles theo trang
└── config/          # Cấu hình chung
```

## Backend

Trỏ tới `http://localhost:3000/api` (xem `src/api/axios.js`).
