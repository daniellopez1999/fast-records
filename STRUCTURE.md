# Project Structure - Fast Records API

Modular architecture by domain (DDD) with NestJS + TypeORM + PostgreSQL

## 📁 Folder Hierarchy

```
fast-records/
├── src/
│   ├── config/                                  # ✅ Environment variable management
│   │   ├── config.service.ts                   # Service with Zod validation
│   │   ├── config.module.ts                    # Exportable module
│   │   ├── env.schema.ts                       # Zod schema with validations
│   │   └── README.md                           # Usage documentation
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
│   ├── users/                                   # ✅ Module: Users
│   │   ├── controllers/
│   │   │   └── users.controller.ts
│   │   ├── services/
│   │   │   └── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts                  # ✅ Implemented with TypeORM
│   │   ├── repositories/
│   │   │   └── users.repository.ts
│   │   ├── dto/
│   │   │   └── create-user.dto.ts              # ✅ Implemented with class-validator
│   │   └── users.module.ts                     # ✅ Configures TypeOrmModule
│   │
│   ├── events/                                  # ✅ Module: Events
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   │   ├── event.entity.ts                 # ✅ Implemented
│   │   │   ├── participant-event.entity.ts     # ✅ Implemented
│   │   │   └── event-photo.entity.ts           # ✅ Implemented
│   │   ├── repositories/
│   │   ├── dto/
│   │   │   └── create-event.dto.ts             # ✅ Implemented
│   │   └── events.module.ts                    # ✅ Configures TypeOrmModule
│   │
│   ├── circuits/                                # ✅ Module: Circuits
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   │   ├── circuit.entity.ts               # ✅ Implemented
│   │   │   └── circuit-photo.entity.ts         # ✅ Implemented
│   │   ├── repositories/
│   │   ├── dto/
│   │   │   └── create-circuit.dto.ts           # ✅ Implemented
│   │   └── circuits.module.ts                  # ✅ Configures TypeOrmModule
│   │
│   ├── records/                                 # ✅ Module: Records
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   │   └── record.entity.ts                # ✅ Implemented
│   │   ├── repositories/
│   │   ├── dto/
│   │   │   └── create-record.dto.ts            # ✅ Implemented
│   │   └── records.module.ts                   # ✅ Configures TypeOrmModule
│   │
│   ├── chat/                                    # ✅ Module: Chat
│   │   ├── individual/                         # ✅ 1-to-1 Chat
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   │   ├── individual-chat.entity.ts              # ✅ Implemented
│   │   │   │   └── individual-message.entity.ts           # ✅ Implemented
│   │   │   ├── repositories/
│   │   │   ├── dto/
│   │   │   │   └── create-message.dto.ts                  # ✅ Implemented
│   │   │   └── individual.module.ts            # ✅ Configures TypeOrmModule
│   │   ├── grupal/                             # ✅ Group chat (events)
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   │   ├── group-chat.entity.ts                   # ✅ Implemented
│   │   │   │   └── group-message.entity.ts                # ✅ Implemented
│   │   │   ├── repositories/
│   │   │   ├── dto/
│   │   │   │   └── create-message.dto.ts                  # ✅ Implemented
│   │   │   └── grupal.module.ts                # ✅ Configures TypeOrmModule
│   │   └── chat.module.ts                      # Sub-module aggregator
│   │
│   ├── notifications/                          # ✅ Module: Notifications
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   │   └── notification.entity.ts          # ✅ Implemented
│   │   ├── repositories/
│   │   ├── dto/
│   │   │   └── create-notification.dto.ts      # ✅ Implemented
│   │   └── notifications.module.ts             # ✅ Configures TypeOrmModule
│   │
│   ├── storage/                                # 📋 Module: Storage (Minio/S3)
│   │   ├── services/
│   │   │   └── storage.service.ts              # Agnostic (Minio/S3/Azure)
│   │   ├── interfaces/
│   │   └── storage.module.ts
│   │
│   ├── main.ts                                 # ✅ Bootstrap with validation
│   ├── app.module.ts                           # ✅ Root module with TypeORM async
│   ├── app.controller.ts
│   └── app.service.ts
│
├── test/                                       # E2E Tests
├── .env.example                                # ✅ Variables template
├── .env                                        # Local variables (DO NOT COMMIT)
├── package.json                                # ✅ Updated dependencies
├── tsconfig.json
├── nest-cli.json
├── STRUCTURE.md                                # This file
├── ENTITIES_DTOS.md                            # ✅ Entities reference
└── README.md
```

## 🏗️ Architecture - Pattern by Module

Each domain module follows a clean 3-layer architecture:

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

### Data Flow

```
HTTP Request
    ↓
Controller (receives and validates with DTO)
    ↓
Service (business logic)
    ↓
Repository (database access)
    ↓
Entity (TypeORM model)
    ↓
PostgreSQL
```

## 🔧 ConfigService - Centralized Variable Management

### ✅ Implemented Features

- **Zod Validation**: Variables validated on startup
- **Typed Schema**: IDE autocomplete
- **Injectable**: Available in any service
- **Convenience Getters**: Helper methods for quick access
- **Auto-loaded**: Automatically loaded in app.module.ts

### 📝 How to Use

```typescript
// In any service
constructor(private configService: ConfigService) {}

// Ways to access
const port = this.configService.get('PORT');                    // Typed
const isDev = this.configService.isDevelopment();               // Helper
const dbConfig = this.configService.getDatabaseConfig();        // Subsystem
```

### 🚀 Bootstrap Initialization

In `main.ts`:
```typescript
const configService = app.get(ConfigService);
configService.validateEnvironmentVariables();  // ← Validates on startup
```

## ✅ TypeORM + PostgreSQL

### Configuration in app.module.ts

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USER'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    autoLoadEntities: true,        // ← Auto-discovers entities
    synchronize: configService.isDevelopment(),
    logging: configService.isDevelopment(),
  }),
})
```

### Features

✅ **Auto-loading**: Entities auto-discovered  
✅ **Async configuration**: Uses ConfigService for values  
✅ **Synchronize**: Syncs schema in development  
✅ **Logging**: Queries visible in development  

## 📦 Modules and their Entities

| Module | Entities |
|--------|----------|
| **users** | `User` |
| **circuits** | `Circuit`, `CircuitPhoto` |
| **events** | `Event`, `ParticipantEvent`, `EventPhoto` |
| **records** | `Record` |
| **chat.individual** | `IndividualChat`, `IndividualMessage` |
| **chat.grupal** | `GroupChat`, `GroupMessage` |
| **notifications** | `Notification` |

### Entity Relationships (Unidirectional)

All relationships are defined only on the side with the Foreign Key:

```
User ← (no @OneToMany)
  ↑
  └─ Event.created_by (N:1) ← (only defined here)
  └─ Record.user (N:1) ← (only defined here)
  └─ Notification.user (N:1) ← (only defined here)
  └─ CircuitPhoto.user (N:1) ← (only defined here)
  └─ EventPhoto.user (N:1) ← (only defined here)
  └─ ParticipantEvent.user (N:1) ← (only defined here)
  └─ IndividualChat.user_1 (N:1) ← (only defined here)
```

## 🔌 How to Import Modules

### Case 1: Use ConfigService

```typescript
// storage.service.ts
import { ConfigService } from '../config/config.service';

@Injectable()
export class StorageService {
  constructor(private configService: ConfigService) {}
  
  async initialize() {
    const minioConfig = this.configService.getMinioConfig();
    // ...
  }
}
```

### Case 2: Use a module in another

```typescript
// events.module.ts - Needs UsersModule
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/services/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    UsersModule,  // ← Import to access UsersService
  ],
  providers: [EventsService],
})
export class EventsModule {}
```

### Case 3: Use Repository with TypeORM

```typescript
// users.service.ts
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.usersRepository.find();
  }
}
```

## 📋 Environment Variables

### 🔴 Required (no default)

```env
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_min_32_characters_required
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### 🟢 Optional (with defaults)

```env
NODE_ENV=development                    # default: development
PORT=3000                               # default: 3000
DB_HOST=localhost                       # default: localhost
DB_PORT=5432                            # default: 5432
DB_USER=postgres                        # default: postgres
DB_NAME=fast_records                    # default: fast_records
JWT_EXPIRATION=24h                      # default: 24h
MINIO_ENDPOINT=localhost                # default: localhost
MINIO_PORT=9000                         # default: 9000
MINIO_USE_SSL=false                     # default: false
MINIO_BUCKET_NAME=fast-records          # default: fast-records
LOG_LEVEL=log                           # default: log
API_URL=http://localhost:3000           # optional
CORS_ORIGIN=http://localhost:3000       # optional
```

See `.env.example` for complete list.

## 🚀 Initialization Flow

```
1. npm run start:dev
   ↓
2. main.ts bootstrap()
   ↓
3. app = NestFactory.create(AppModule)
   ↓
4. ConfigService.validateEnvironmentVariables()  ← Validates against Zod schema
   ↓
5. GlobalPipes (ValidationPipe) - Validates DTOs
   ↓
6. app.module imports:
   - ConfigModule
   - TypeOrmModule.forRootAsync()  ← Connects to PostgreSQL
   - AuthModule
   - UsersModule
   - EventsModule
   - CircuitsModule
   - ChatModule
   - NotificationsModule
   - RecordsModule
   - StorageModule
   ↓
7. All modules initialized and entities loaded
   ↓
8. app.listen(PORT)
   ↓
9. 🟢 Server listening
```

## ✅ Project Status

### Phase 1: Structure ✅
- [x] Folders created
- [x] Base modules implemented

### Phase 2: Entities & DTOs ✅
- [x] 12 Entities implemented with TypeORM
- [x] All 1:N relationships configured
- [x] DTOs with class-validator
- [x] Modules with TypeOrmModule.forFeature()

### Phase 3: ConfigService ✅
- [x] Zod schema with validations
- [x] ConfigService with helper methods
- [x] Async integration in app.module.ts
- [x] Validation on bootstrap
- [x] Complete documentation

### Phase 4: Internationalization ✅
- [x] All entity properties converted to English
- [x] All DTOs converted to English
- [x] All table names converted to English
- [x] All comments converted to English

### Phase 5: Next (TODO)
- [ ] Implement Repositories with CRUD methods
- [ ] Implement Services with complete logic
- [ ] Implement Controllers with all endpoints
- [ ] Configure StorageService (Minio)
- [ ] Implement JWT Strategy
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Swagger/OpenAPI documentation

## 📚 Reference Files

- **ENTITIES_DTOS.md** - Complete reference of all entities
- **config/README.md** - Detailed ConfigService documentation
- **.env.example** - Template with all variables

## 💡 Conventions

### File Names
- Controllers: `{resource}.controller.ts`
- Services: `{resource}.service.ts`
- Entities: `{resource}.entity.ts`
- DTOs: `create-{resource}.dto.ts`, `update-{resource}.dto.ts`
- Repositories: `{resource}.repository.ts`
- Modules: `{resource}.module.ts`

### Table Names (Database)
- users
- events
- circuits
- records
- circuit_photos
- event_photos
- event_participants
- notifications
- individual_chats
- individual_messages
- group_chats
- group_messages

### Entity Properties (Database Columns)

**User:**
- id, email, password, first_name, last_name, profile_photo, user_type, description, registration_date, last_access, active, updated_at

**Event:**
- id, circuit_id, created_by, title, event_date, start_time, end_time, max_participants, event_type, status, description, created_at

**Circuit:**
- id, name, location, country, city, latitude, longitude, description, main_photo, website, num_laps, track_length_km, created_at

**Record:**
- id, user_id, circuit_id, best_time, num_laps, record_date

**Notification:**
- id, user_id, from_user_id, type, title, content, reference_id, is_read, created_at

### Typical Module Structure

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([MyEntity]),   // Register entities
    ConfigModule,                           // If uses ConfigService
    OtherModule,                            // If depends on other services
  ],
  controllers: [MyController],
  providers: [MyService],
  exports: [MyService],                    // If other modules need it
})
export class MyModule {}
```

## 🔐 Security

✅ JWT_SECRET: Minimum 32 characters  
✅ DB_PASSWORD: Required  
✅ MINIO_ACCESS_KEY/SECRET_KEY: Required  
✅ Sensitive variables: NOT in git (use `.env.example`)  
✅ Input validation: DTOs + class-validator  
✅ Auto-sanitization: ValidationPipe  

## 📊 Installed Dependencies

```json
"@nestjs/common": "^10.0.0",
"@nestjs/core": "^10.0.0",
"@nestjs/typeorm": "^10.0.0",
"@nestjs/jwt": "^10.0.0",
"@nestjs/passport": "^10.0.0",
"typeorm": "^0.3.19",
"pg": "^8.11.3",
"zod": "^3.22.4",
"class-validator": "^0.14.1",
"class-transformer": "^0.5.1",
"passport": "^0.7.0",
"passport-jwt": "^4.0.1"
```
