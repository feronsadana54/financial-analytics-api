# Financial Analytics API

Financial Analytics API adalah backend REST untuk aplikasi Business Intelligence Dashboard. API ini menyediakan data ringkasan keuangan, tren pendapatan, tren profit, pengeluaran, performa produk, distribusi kategori, serta CRUD untuk produk, kategori, transaksi penjualan, dan expense.

## Features

- Authentication (login, register, current user) dengan JWT dan bcrypt password hashing
- Role-based access control (USER, MANAGER, SUPER_ADMIN)
- User management dengan soft deactivation
- Dashboard summary: revenue, expense, gross profit, net profit, margin, orders, products sold, average order value, growth
- Analytics endpoint untuk chart revenue, profit, expense breakdown, category distribution, top products, dan revenue vs expense
- Product, category, sales transaction, dan expense management
- PostgreSQL schema dengan Prisma ORM
- DTO validation dengan `class-validator`
- Consistent API response format
- Swagger documentation di `/docs` dengan Bearer auth
- Docker setup untuk PostgreSQL dan backend
- Seed data realistis untuk dashboard portfolio
- Jest unit test untuk finance calculation, auth, dan user management

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Jest
- Swagger/OpenAPI
- Docker

## Architecture Overview

Project memakai struktur modular NestJS. Controller menerima request HTTP, DTO melakukan validasi input, service menjalankan business logic, dan Prisma menjadi data access layer. Analytics endpoint menghitung agregasi dari tabel transaksi penjualan, item transaksi, produk, kategori, dan expense.

## Folder Structure

```text
prisma/
  schema.prisma
  seed.ts
  migrations/
src/
  auth/            # JWT strategy, guards, decorators, DTO
  users/           # User management
  common/
  prisma/
  dashboard/
  products/
  categories/
  sales/
  expenses/
test/
```

## Environment Variables

Salin `.env.example` menjadi `.env`.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/financial_analytics_db?schema=public"
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace-this-with-a-strong-random-string
JWT_EXPIRES_IN=12h
```

`JWT_SECRET` wajib di-set untuk production. Untuk development bisa pakai string panjang acak apa pun.

## Docker Installation Guide for Windows

Docker adalah platform untuk menjalankan aplikasi dan dependency dalam container. Dengan Docker, PostgreSQL bisa berjalan lokal tanpa instalasi PostgreSQL langsung di Windows.

Docker Desktop adalah aplikasi resmi Docker untuk Windows. Docker Desktop menyediakan Docker Engine, Docker CLI, Docker Compose, dashboard container, dan integrasi WSL2.

WSL2 adalah Windows Subsystem for Linux versi 2. Docker Desktop di Windows modern menggunakan WSL2 agar container Linux berjalan lebih stabil dan cepat.

### Install WSL2

1. Buka PowerShell sebagai Administrator.
2. Jalankan:

```powershell
wsl --install
```

3. Restart Windows jika diminta.
4. Setelah restart, buka Ubuntu dari Start Menu dan buat username serta password Linux.
5. Cek versi WSL:

```powershell
wsl --status
wsl --list --verbose
```

Jika distro masih WSL1, ubah ke WSL2:

```powershell
wsl --set-version Ubuntu 2
```

### Install Docker Desktop

1. Download Docker Desktop dari `https://www.docker.com/products/docker-desktop/`.
2. Jalankan installer.
3. Aktifkan opsi WSL2 backend.
4. Buka Docker Desktop.
5. Tunggu sampai status Docker running.

### Check Docker

```powershell
docker version
docker compose version
```

## Run PostgreSQL with Docker

```powershell
docker compose up -d postgres
```

Melihat container:

```powershell
docker ps
```

Melihat logs:

```powershell
docker compose logs -f postgres
```

Menghentikan container:

```powershell
docker compose stop
```

Menghapus container:

```powershell
docker compose down
```

Reset database local development:

```powershell
docker compose down -v
docker compose up -d postgres
npm run db:setup
```

## Local Development

```powershell
npm install
copy .env.example .env
docker compose up -d postgres
npm run prisma:generate
npm run db:setup
npm run start:dev
```

API berjalan di `http://localhost:3000`.

Swagger berjalan di `http://localhost:3000/docs`.

## Docker App

Menjalankan PostgreSQL dan backend:

```powershell
docker compose up -d
```

## Database Commands

```powershell
npm run db:migrate
npm run db:seed
npm run db:setup
npm run db:reset
npm run prisma:generate
```

## Test

```powershell
npm run test
npm run test:cov
```

## Demo Accounts (Local Only)

Seed otomatis membuat tiga akun. Hanya untuk development local, jangan dipakai di production.

| Role        | Email                      | Password      |
| ----------- | -------------------------- | ------------- |
| SUPER_ADMIN | admin@financial.local      | Admin12345    |
| MANAGER     | manager@financial.local    | Manager12345  |
| USER        | user@financial.local       | User12345     |

## Role Matrix

| Endpoint                         | USER | MANAGER | SUPER_ADMIN |
| -------------------------------- | :--: | :-----: | :---------: |
| GET /dashboard/\*                |  ✓   |    ✓    |      ✓      |
| GET /products, /categories       |  ✓   |    ✓    |      ✓      |
| POST/PATCH/DELETE /products      |  -   |    ✓    |      ✓      |
| POST/PATCH/DELETE /categories    |  -   |    ✓    |      ✓      |
| GET /sales                       |  ✓   |    ✓    |      ✓      |
| POST /sales                      |  ✓   |    ✓    |      ✓      |
| PATCH/DELETE /sales              |  -   |    ✓    |      ✓      |
| GET /expenses                    |  ✓   |    ✓    |      ✓      |
| POST/PATCH/DELETE /expenses      |  -   |    ✓    |      ✓      |
| GET /users                       |  -   |    ✓    |      ✓      |
| POST /users                      |  -   |    -    |      ✓      |
| PATCH /users/\*                  |  -   |    -    |      ✓      |
| DELETE /users/:id (deactivate)   |  -   |    -    |      ✓      |

SUPER_ADMIN tidak bisa mengubah status atau role akunnya sendiri. Hanya SUPER_ADMIN yang bisa membuat atau memodifikasi SUPER_ADMIN lain.

## Auth Quick Start

1. Login via Swagger atau Postman dengan akun demo:

   ```http
   POST /auth/login
   {
     "email": "admin@financial.local",
     "password": "Admin12345"
   }
   ```

2. Salin `data.accessToken` dari response.
3. Di Swagger UI, klik tombol **Authorize** kanan atas, paste token (tanpa prefix `Bearer`), Authorize, Close.
4. Semua endpoint protected sekarang sudah membawa header `Authorization: Bearer <token>`.

Register publik (default role USER):

```http
POST /auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPass123"
}
```

Cek user yang sedang login:

```http
GET /auth/me
Authorization: Bearer <token>
```

## API Endpoints

Auth:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`

Users (SUPER_ADMIN only kecuali ditandai):

- `GET /users` (MANAGER+)
- `GET /users/:id` (MANAGER+)
- `POST /users`
- `PATCH /users/:id`
- `PATCH /users/:id/role`
- `PATCH /users/:id/status`
- `DELETE /users/:id` (soft delete → status = INACTIVE)

Dashboard:

- `GET /dashboard/summary`
- `GET /dashboard/revenue-trend`
- `GET /dashboard/profit-trend`
- `GET /dashboard/expense-breakdown`
- `GET /dashboard/product-performance`
- `GET /dashboard/category-distribution`
- `GET /dashboard/top-products`
- `GET /dashboard/revenue-vs-expense`

Products:

- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PATCH /products/:id`
- `DELETE /products/:id`

Categories:

- `GET /categories`
- `GET /categories/:id`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

Sales:

- `GET /sales`
- `GET /sales/:id`
- `POST /sales`
- `PATCH /sales/:id`
- `DELETE /sales/:id`

Expenses:

- `GET /expenses`
- `GET /expenses/:id`
- `POST /expenses`
- `PATCH /expenses/:id`
- `DELETE /expenses/:id`

## Response Format

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {}
}
```

## Database Schema Overview

- `categories`: master kategori produk
- `products`: master produk dengan price, cost, dan stock
- `sales_transactions`: header transaksi penjualan
- `sales_transaction_items`: detail produk per transaksi
- `expense_categories`: master kategori pengeluaran
- `expenses`: transaksi pengeluaran operasional

Struktur ini memisahkan data master dan transaksi agar analytics bisa dihitung dari data operasional yang realistis.

## Troubleshooting

Jika database tidak bisa diakses, pastikan Docker Desktop sudah running dan container PostgreSQL aktif.

Jika Prisma client error, jalankan:

```powershell
npm run prisma:generate
```

Jika tabel belum terbentuk, jalankan:

```powershell
npm run db:setup
```

Jika port 5432 bentrok, ubah mapping port PostgreSQL di `docker-compose.yml`.

## Roadmap

- Pagination dan search untuk management endpoint
- Refresh token rotation
- Export analytics ke CSV
- Audit log perubahan data
- Integration test untuk controller dan database
- Deployment profile untuk cloud environment

## Screenshot Placeholder

Tambahkan screenshot Swagger dan response dashboard setelah API berjalan lokal.
