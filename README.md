# 🛒 CloudMart Backend (E-commerce API)

A production-ready backend system for an e-commerce platform built with **Node.js, TypeScript, Express, Prisma, PostgreSQL, and Redis**.

This project demonstrates scalable backend architecture, authentication, role-based access control, caching, and transactional business logic.

---

## 🚀 Features

### 🔐 Authentication & Authorization

- User registration & login
- JWT-based authentication
- Refresh token implementation (stored in DB)
- Logout with token revocation
- Role-Based Access Control (RBAC)
  - ADMIN
  - VENDOR
  - CUSTOMER

---

### 📦 Product Module

- Create product (VENDOR / ADMIN)
- Get all products (public)
- Get single product
- Update product (owner/admin only)
- Delete product (owner/admin only)

#### Advanced Features

- Pagination (`page`, `limit`)
- Search (`title`, `description`)
- Price filtering (`minPrice`, `maxPrice`)
- Sorting (`price`, `createdAt`, `title`)
- Redis caching for:
  - product list
  - single product

- Cache invalidation on create/update/delete

---

### 🧾 Order Module

- Create order (CUSTOMER)
- Get my orders
- Get single order (with access control)

#### Business Logic

- Stock validation
- Automatic stock reduction
- Order total calculation
- Prisma transaction (atomic operations)

---

### 🧱 System Features

- Modular architecture (controller/service pattern)
- Centralized error handling
- Request validation using Zod
- Logging with request IDs (Pino)
- Security middleware (Helmet, Rate Limiting)
- Redis integration
- Health & readiness endpoints

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Caching:** Redis
- **Validation:** Zod
- **Authentication:** JWT
- **Logging:** Pino

---

## 📁 Project Structure

```
src/
├── config/
├── common/
├── middlewares/
├── modules/
│   ├── auth/
│   ├── product/
│   ├── order/
├── routes/
├── server.ts
```

---

## ⚙️ Setup Instructions

### 1. Clone repository

```bash
git clone https://github.com/your-username/cloudmart-backend.git
cd cloudmart-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cloudmart
PORT=5000
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

---

### 4. Run database

Using Docker:

```bash
docker run --name cloudmart-postgres \
-e POSTGRES_USER=postgres \
-e POSTGRES_PASSWORD=postgres \
-e POSTGRES_DB=cloudmart \
-p 5432:5432 -d postgres:16
```

---

### 5. Run Redis

```bash
docker run --name cloudmart-redis -p 6379:6379 -d redis:7-alpine
```

---

### 6. Run migrations

```bash
npx prisma migrate dev
npx prisma generate
```

---

### 7. Start server

```bash
npm run dev
```

---

## 🔌 API Endpoints

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/logout`

---

### Products

- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PATCH /api/v1/products/:id`
- `DELETE /api/v1/products/:id`

---

### Orders

- `POST /api/v1/orders`
- `GET /api/v1/orders/my-orders`
- `GET /api/v1/orders/:id`

---

## 📊 Example Query

```http
GET /api/v1/products?page=1&limit=10&search=iphone&sortBy=price&sortOrder=asc
```

---

## 🧠 Key Highlights

- Scalable architecture with separation of concerns
- Efficient data fetching with pagination and filtering
- Redis caching to reduce database load
- Transaction-safe order processing
- Secure authentication with refresh token flow
- Role-based authorization for multi-user system

---

## 🚀 Future Improvements

- Payment integration (Stripe)
- Background jobs (BullMQ)
- Email notifications
- Admin dashboard APIs
- Docker Compose setup
- Unit & integration testing

---

## 📌 Author

**Kasim Syed Anwar**
Backend Developer | Node.js | TypeScript | AWS

---
