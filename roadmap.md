cloudmart-backend/
├── prisma/
│ └── schema.prisma
├── src/
│ ├── app.ts
│ ├── server.ts
│ ├── config/
│ │ ├── db.ts
│ │ ├── env.ts
│ │ ├── logger.ts
│ │ └── redis.ts
│ ├── common/
│ │ ├── errors/
│ │ │ ├── AppError.ts
│ │ │ └── errorTypes.ts
│ │ └── utils/
│ │ └── sendResponse.ts
│ ├── middlewares/
│ │ ├── error.middleware.ts
│ │ ├── notFound.middleware.ts
│ │ └── requestId.middleware.ts
│ └── routes/
│ └── index.ts
├── .env
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
