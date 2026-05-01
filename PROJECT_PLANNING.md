# Fast Records - Project Idea and Planning

## Overall Vision

Fast Records is a modular backend that allows you to:
- **Manage users** with secure authentication
- **Register events** with participants and photos
- **Organize circuits** with additional information
- **Real-time communication** (individual and group chats)
- **Personalized notifications**
- **File storage**
- **Complete audit** of actions (logging)

All built as a modular microservices system that can grow without headaches.

## General Architecture

```
┌─────────────────────────────────────┐
│      FRONTEND (Not included)        │
│      (React, Angular, etc)          │
└────────────────────┬────────────────┘
                     │
                     ↓
┌─────────────────────────────────────┐
│      API REST (NestJS)              │
│   (Fast Records Backend)            │
└────────────────────┬────────────────┘
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │  Auth   │ │  Users  │ │ Events  │
   └─────────┘ └─────────┘ └─────────┘
        │            │            │
        └────────────┼────────────┘
                     ↓
          ┌──────────────────────┐
          │  PostgreSQL (DB)     │
          └──────────────────────┘
```

## Main Modules

### 1. **Auth Module**
The entry point for security. Handles:
- Registration of new users
- JWT authentication
- Permission validation

**Why separate:** Keeping authentication logic independent makes it easy to change it or add new methods (OAuth, etc) without touching the rest of the system.

### 2. **Users Module**
Manages all user information:
- User profiles
- Different user types (ADMIN, MODERATOR, USER)
- Personal information (name, photo, description)
- Access history

**Design rationale:** Users are the center of everything. All other modules need to know who is doing what.

### 3. **Events Module**
Event registration with:
- Base information (title, description, date)
- Associated participants
- Event photos
- Many-to-many relationships with users

**Use case:** Register meetings, conferences, social activities, etc. With the ability to know exactly who participated.

### 4. **Circuits Module**
Manages circuits (routes, processes, etc):
- Circuit information
- Associated photos
- Additional metadata

**Thinking behind it:** A circuit is a route or process that can have many points of interest or stages. It's flexible.

### 5. **Chat Module**
Real-time communication:
- **Individual Chat:** Direct messages between two users
- **Group Chat:** Conversations with multiple participants

**Architecture:** Separated into two sub-modules because needs are different (1-to-1 vs 1-to-many relationship).

### 6. **Notifications Module**
Notification system:
- Personalized notifications per user
- Different notification types
- Notification history

**Added value:** Allows users to be informed in real-time of important events.

### 7. **Storage Module**
File handling:
- Secure upload/download
- Photo storage
- File type management

**Advantage:** Centralizing storage logic allows changing the backend (local disk, AWS S3, etc) without touching the rest of the app.

### 8. **Audit Module**
Complete audit and logging:
- Registers ALL HTTP requests
- Captures user_id, IP, device, browser
- Measures endpoint performance
- History of who did what, when

**Why it matters:** In production, you need to know exactly what happened. Who accessed, when it failed, what took too long.

### 9. **Common Module**
Shared utilities:
- Custom decorators
- Guards (route protection)
- Common interfaces
- Custom exceptions
- Response utilities

**Philosophy:** DRY (Don't Repeat Yourself) - if something is used in multiple modules, it goes here.

### 10. **Config Module**
Centralized configuration:
- Environment variables
- Configuration validation with Zod
- Environment-specific config (dev, staging, prod)

**Reason:** We want to be explicit about what the app needs to run, without magic values scattered throughout the code.

## Important Technical Decisions

### 1. PostgreSQL
**Why:** Complex relationships, JSONB for dynamic data, and it's free. Better than SQLite for production.

### 2. TypeORM
**Why:** Gives us a strong ORM with relationships, migrations, and validation. Easy to change DB if needed.

### 3. JWT for Authentication
**Why:** Stateless, scalable. Token goes in the header and we don't need server sessions.

### 4. Independent Modules
**Why:** If something fails in one module, it doesn't bring down everything. Each module handles its own logic, DB schema, and validations.

### 5. Global Interceptors
**Why:** Automatic audit without touching each controller. Centralized logging.

### 6. QueryRunner for Transactions
**Why:** Allows fine-grained control - we can rollback if something explodes without losing everything.


---
