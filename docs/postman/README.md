# Postman Collection — Financial Analytics API

Dokumen ini menjelaskan cara memakai Postman Collection dan Environment yang ada di folder `docs/postman/` untuk mencoba seluruh endpoint backend `financial-analytics-api`.

## File

- `financial-analytics-api.postman_collection.json` — koleksi request dikelompokkan per resource.
- `financial-analytics-api.postman_environment.json` — environment dengan variable seperti `baseUrl`, `accessToken`, demo credentials, dan placeholder ID.

## Cara Import ke Postman

1. Buka aplikasi Postman (desktop atau web).
2. Klik tombol **Import** di kiri atas.
3. Tarik (drag) atau pilih kedua file di atas, atau klik **Choose Files** lalu pilih:
   - `financial-analytics-api.postman_collection.json`
   - `financial-analytics-api.postman_environment.json`
4. Klik **Import**.
5. Setelah import, di kiri sidebar Anda akan melihat koleksi **Financial Analytics API**.
6. Di kanan atas Postman, pilih dropdown environment dan ganti ke **Financial Analytics Local**.

## Cara Menjalankan Backend Lokal

Pastikan backend sudah dijalankan di `http://localhost:3000`.

```powershell
cd financial-analytics-api
npm install
copy .env.example .env
docker compose up -d postgres
npm run prisma:generate
npm run db:setup
npm run start:dev
```

`npm run db:setup` akan menjalankan migrasi dan seed otomatis, termasuk pembuatan tiga akun demo.

Jika port atau host backend berbeda, ubah variable `baseUrl` di environment.

## Akun Demo (Local Only)

| Role        | Email                     | Password      |
| ----------- | ------------------------- | ------------- |
| SUPER_ADMIN | admin@financial.local     | Admin12345    |
| MANAGER     | manager@financial.local   | Manager12345  |
| USER        | user@financial.local      | User12345     |

Akun ini hanya untuk development local. Jangan dipakai di production.

## Login dan Penyimpanan Token Otomatis

1. Buka folder **Auth** > **Login Admin**.
2. Klik **Send**.
3. Test script akan otomatis:
   - Memvalidasi status code 200/201.
   - Mengambil token dari `response.data.accessToken`.
   - Menyimpan token ke environment variable `accessToken`.
4. Cek environment di pojok kanan atas, variable `accessToken` sekarang terisi.

Login Manager dan Login User memakai variable kredensial yang sama (managerEmail/managerPassword, userEmail/userPassword) dan ikut menyimpan token ke `accessToken`.

## Menggunakan Endpoint Protected

Setelah login, semua request lain otomatis memakai header `Authorization: Bearer {{accessToken}}`. Tidak ada langkah manual yang perlu dilakukan.

Jika menerima respons `401 Unauthorized`, jalankan ulang request login. Token JWT default expired dalam 12 jam (kontrol via env `JWT_EXPIRES_IN` backend).

Jika menerima respons `403 Forbidden`, berarti role akun saat ini tidak cukup. Login ulang dengan akun yang lebih tinggi (mis. admin) sesuai matriks role di bawah.

## Mengambil ID dari Endpoint List

Sebagian besar endpoint detail/update/delete memerlukan ID. Test script di endpoint **Get** otomatis mengisi variable ID berdasarkan response pertama:

- **Get Users** → mengisi `userId` dengan user pertama.
- **Get Products** → mengisi `productId` dan `categoryId`.
- **Get Categories** → mengisi `categoryId`.
- **Get Sales** → mengisi `saleId`.
- **Get Expenses** → mengisi `expenseId` dan `expenseCategoryId`.
- **Get Expense Categories** → mengisi `expenseCategoryId`.
- **Create** *(per resource)* → mengisi variable ID resource baru yang dibuat.

Anda juga bisa membuka tab **Environment** di kanan dan menyalin ID manual dari response.

## Urutan Rekomendasi Mencoba API

1. **Auth → Login Admin**
2. **Auth → Get Current User**
3. **Dashboard → Get Dashboard Summary**
4. **Categories → Get Categories** (mengisi `categoryId`)
5. **Categories → Create Category** (opsional, mengganti `categoryId` ke yang baru)
6. **Products → Get Products** (mengisi `productId`)
7. **Products → Create Product** (memakai `categoryId`)
8. **Sales → Create Sale** (memakai `productId`)
9. **Dashboard → Get Revenue Trend**
10. **Expenses → Get Expense Categories** (mengisi `expenseCategoryId`)
11. **Expenses → Create Expense** (memakai `expenseCategoryId`)
12. **Dashboard → Get Expense Breakdown**
13. **Users → Get Users** (perlu login admin)

## Matriks Role per Resource

| Akses                                   | USER | MANAGER | SUPER_ADMIN |
| --------------------------------------- | :--: | :-----: | :---------: |
| Dashboard / GET produk, kategori, sales, expenses | ✓ | ✓ | ✓ |
| POST sales                              |  ✓   |    ✓    |      ✓      |
| POST / PATCH / DELETE products, categories, expenses | – | ✓ | ✓ |
| PATCH / DELETE sales                    |  –   |    ✓    |      ✓      |
| GET users / users/:id                   |  –   |    ✓    |      ✓      |
| POST / PATCH / DELETE users             |  –   |    –    |      ✓      |
| PATCH /users/:id/role                   |  –   |    –    |      ✓      |
| PATCH /users/:id/status                 |  –   |    –    |      ✓      |

## Catatan Penting

- **Soft delete user**: `DELETE /users/:id` tidak menghapus row; status user diubah menjadi `INACTIVE`. User dengan status INACTIVE tidak bisa login.
- **Self protection**: SUPER_ADMIN tidak dapat mengubah role/status akunnya sendiri.
- **Sales items**: backend menghitung `unitPrice`, `unitCost`, `subtotal`, dan `profit` dari master produk pada saat `POST /sales`. Request body cukup mengirim `productId` dan `quantity`.
- **Sales update**: implementasi update dengan items mengganti ID transaksi (delete + create). Untuk hanya mengubah header (customerName, transactionDate) tanpa items, jangan kirim field items.
- **Category delete**: kategori yang masih dipakai produk akan ditolak oleh foreign key.
- **Tanggal**: gunakan format ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`) untuk field `transactionDate` dan `expenseDate`.
- **Filter dashboard**: query opsional `year`, `month`, `startDate`, `endDate`, `categoryId`, `productId`. Query yang tidak dipakai dapat dinonaktifkan dari panel Params di Postman.

## Response Envelope

Semua response sukses memakai format:

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": { ... }
}
```

Test script di collection ini selalu membaca payload dari `body.data`. Jika sistem response berubah, sesuaikan path di test script masing-masing request.

## Troubleshooting

- **`Could not get response`**: backend belum berjalan atau port salah. Pastikan `npm run start:dev` aktif dan `baseUrl` sesuai.
- **`401 Unauthorized`**: token kosong atau expired. Jalankan ulang request login.
- **`403 Forbidden`**: role tidak cukup. Login dengan akun MANAGER atau SUPER_ADMIN sesuai kebutuhan.
- **`409 Conflict` saat create user atau register**: email sudah terdaftar. Ganti nilai email pada body request.
- **`400 Bad Request`**: validasi DTO gagal. Periksa pesan `message` di response untuk detail field yang invalid.
