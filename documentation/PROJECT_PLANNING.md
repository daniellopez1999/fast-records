# Fast Records - Project Idea and Planning

## Overall Vision

Fast Records an application to Organize Events, Track Days and meet people related to Motorbike world, which will allow:
- **Manage users** with secure authentication
- **Register events** with participants and photos
- **Organize circuits** with additional information
- **Real-time communication** (individual and group chats)
- **Personalized notifications**
- **File storage**
- **Complete audit** of actions (logging)
- **More Features**

All built as a modular microservices system that can grow without headaches.

## Main Modules

### 1. **Auth Module**
The entry point for security. Handles:
- Registration of new users
- JWT authentication
- Permission validation

### 2. **Users Module**
Manages all user information:
- User profiles
- Different user types (ADMIN, MODERATOR, USER)
- Personal information (name, photo, description)
- Access history

### 3. **Events Module**
Event registration with:
- Base information (title, description, date)
- Associated participants
- Event photos
- Many-to-many relationships with users

### 4. **Circuits Module**
Manages circuits (routes, processes, etc):
- Circuit information
- Associated photos
- Additional metadata


### 5. **Chat Module**
Real-time communication:
- **Individual Chat:** Direct messages between two users
- **Group Chat:** Conversations with multiple participants

### 6. **Notifications Module**
Notification system:
- Personalized notifications per user
- Different notification types
- Notification history

### 7. **Storage Module**
File handling:
- Secure upload/download
- Photo storage
- File type management

### 8. **Audit Module**
Complete audit and logging:
- Registers ALL HTTP requests
- Captures user_id, IP, device, browser
- Measures endpoint performance
- History of who did what, when

### 9. **Common Module**
Shared utilities:
- Custom decorators
- Guards (route protection)
- Common interfaces
- Custom exceptions
- Response utilities

### 10. **Config Module**
Centralized configuration:
- Environment variables
- Configuration validation with Zod
- Environment-specific config (dev, staging, prod)

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