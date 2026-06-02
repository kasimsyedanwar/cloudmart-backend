# CloudMart Backend

CloudMart V2 is a production-style multi-vendor e-commerce backend built with Node.js, Express.js, TypeScript, PostgreSQL, Prisma ORM, Redis, Docker, CI/CD, and AWS deployment.

## Current Phase

Phase 1: Project Setup + Production Architecture

## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- Docker
- GitHub Actions CI/CD
- AWS ECS/Fargate, ECR, RDS, ElastiCache, CloudWatch

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Phase 2: Core Config Foundation

CloudMart now includes:

- Zod-based environment validation
- Pino structured logger
- Request ID middleware
- Centralized AppError class
- Centralized error handler
- JSON 404 handler
- Request validation middleware foundation
- Consistent success/error API response shape

### Environment Variables

Create a `.env` file:

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=*
LOG_LEVEL=info
```

## Phase 3: Local Infra + Prisma Init

CloudMart now includes local infrastructure for PostgreSQL and Redis using Docker Compose.

### Start Infrastructure

```bash
npm run infra:up
```
