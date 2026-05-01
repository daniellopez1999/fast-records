# Project Structure - Fast Records API

Modular architecture by domain (DDD) with NestJS + TypeORM + PostgreSQL

## Folder Hierarchy

```
fast-records/
├── src/
│   ├── config/                                  # Environment variable 
│   │   ├── config.service.ts                   # Service with Zod validation
│   │   ├── config.module.ts                    # Exportable module
│   │   ├── env.schema.ts                       # Zod schema with validations
│   │   └── README.md                           # Usage documentation
│   │
│   ├── audit/                                    # Audit / Logging with Interceptors
│   │   ├── controllers/
│   │   ├── guards/
│   │   ├── interfaces/
│   │   ├── services/
│   │   ├── dto/
│   │   └── auth.module.ts
│   │
│   ├── auth/                                    # Authentication and JWT
│   │   ├── strategies/
│   │   ├── guards/
│   │   ├── interfaces/
│   │   ├── services/
│   │   ├── dto/
│   │   └── auth.module.ts
│   │
│   ├── common/                                  # Shared code
│   │   ├── decorators/                         # Custom decorators
│   │   ├── exceptions/                         # Custom exceptions
│   │   ├── guards/                             # Global guards
│   │   ├── interfaces/                         # Global interfaces
│   │   ├── utils/                              # Generic utilities
│   │   └── constants/                          # Constants
│   │
│   ├── users/                                   # Module: Users
│   │   ├── controllers/
│   │   │   └── users.controller.ts
│   │   ├── services/
│   │   │   └── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts                  # Implemented with TypeORM
│   │   ├── repositories/
│   │   │   └── users.repository.ts
│   │   ├── dto/
│   │   │   └── create-user.dto.ts              # Implemented with class-validator
│   │   └── users.module.ts                     # Configures TypeOrmModule
│   │
│   ├── events/                                  # Module: Events
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   │   ├── event.entity.ts                 # Implemented
│   │   │   ├── participant-event.entity.ts     # Implemented
│   │   │   └── event-photo.entity.ts           # Implemented
│   │   ├── repositories/
│   │   ├── dto/
│   │   │   └── create-event.dto.ts             # Implemented
│   │   └── events.module.ts                    # Configures TypeOrmModule
│   │
│   ├── circuits/                                # Module: Circuits
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   │   ├── circuit.entity.ts               # Implemented
│   │   │   └── circuit-photo.entity.ts         # Implemented
│   │   ├── repositories/
│   │   ├── dto/
│   │   │   └── create-circuit.dto.ts           # Implemented
│   │   └── circuits.module.ts                  # Configures TypeOrmModule
│   │
│   ├── records/                                 # Module: Records
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   │   └── record.entity.ts                # Implemented
│   │   ├── repositories/
│   │   ├── dto/
│   │   │   └── create-record.dto.ts            # Implemented
│   │   └── records.module.ts                   # Configures TypeOrmModule
│   │
│   ├── chat/                                    # Module: Chat
│   │   ├── individual/                         # 1-to-1 Chat
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   │   ├── individual-chat.entity.ts              # Implemented
│   │   │   │   └── individual-message.entity.ts           # Implemented
│   │   │   ├── repositories/
│   │   │   ├── dto/
│   │   │   │   └── create-message.dto.ts                  # Implemented
│   │   │   └── individual.module.ts            # Configures TypeOrmModule
│   │   ├── grupal/                             # Group chat (events)
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   │   ├── group-chat.entity.ts                   # Implemented
│   │   │   │   └── group-message.entity.ts                # Implemented
│   │   │   ├── repositories/
│   │   │   ├── dto/
│   │   │   │   └── create-message.dto.ts                  # Implemented
│   │   │   └── grupal.module.ts                # Configures TypeOrmModule
│   │   └── chat.module.ts                      # Sub-module aggregator
│   │
│   ├── notifications/                          # Module: Notifications
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   │   └── notification.entity.ts          # Implemented
│   │   ├── repositories/
│   │   ├── dto/
│   │   │   └── create-notification.dto.ts      # Implemented
│   │   └── notifications.module.ts             # Configures TypeOrmModule
│   │
│   ├── storage/                                # Module: Storage (Minio/S3)
│   │   ├── services/
│   │   │   └── storage.service.ts              # Agnostic (Minio/S3/Azure)
│   │   ├── interfaces/
│   │   └── storage.module.ts
│   │
│   ├── main.ts                                 # Bootstrap with validation
│   ├── app.module.ts                           # Root module with TypeORM async
│   ├── app.controller.ts
│   └── app.service.ts
│
├── test/                                       # E2E Tests
├── .env.example                                # Variables template
├── .env                                        # Local variables (DO NOT COMMIT)
├── package.json                                # Updated dependencies
├── tsconfig.json
├── nest-cli.json
├── STRUCTURE.md                                # This file
├── ENTITIES_DTOS.md                            # Entities reference
└── README.md
```

## Architecture - Pattern by Module


```
users/
├── controllers/
│   └── users.controller.ts          → HTTP Endpoints
├── services/
│   └── users.service.ts             → Business logic
├── entities/
│   └── user.entity.ts               → Database model (TypeORM)
├── repositories/
│   └── users.repository.ts          → Database access
├── dto/
│   ├── create-user.dto.ts           → Input validation (class-validator)
│   └── update-user.dto.ts           → Update validation
└── users.module.ts                  → Module declaration
```

