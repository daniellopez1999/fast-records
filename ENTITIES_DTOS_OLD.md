# Entities & DTOs Reference - Fast Records

## 📋 Entities Implementadas

### Core Entities

#### 1. **User** (`users/entities/user.entity.ts`)
```typescript
- id: UUID (PK)
- email: string (UK)
- password: string (hashed)
- nombre: string
- apellido: string
- foto_perfil?: string
- tipo_usuario: string (user|admin|moderator)
- descripcion?: string
- fecha_registro: Date (auto)
- ultimo_acceso?: Date
- activo: boolean (default: true)
- updated_at: Date (auto)

Relations:
- eventos_creados: Event[] (1:N)
- records: Record[] (1:N)
- participaciones: ParticipantEvent[] (1:N)
- notificaciones: Notification[] (1:N)
- notificaciones_enviadas: Notification[] (1:N)
- fotos_circuitos: CircuitPhoto[] (1:N)
- fotos_eventos: EventPhoto[] (1:N)
- chats_iniciados: IndividualChat[] (1:N)
- chats_recibidos: IndividualChat[] (1:N)
```

#### 2. **Circuit** (`circuits/entities/circuit.entity.ts`)
```typescript
- id: UUID (PK)
- nombre: string (UK)
- ubicacion: string
- pais: string (ISO code)
- ciudad: string
- latitud: decimal(10,6)
- longitud: decimal(10,6)
- descripcion?: string
- foto_principal?: string
- sitio_web?: string
- num_vueltas: number
- longitud_pista: decimal(8,2) (en km)
- fecha_creacion: Date (auto)

Relations:
- eventos: Event[] (1:N)
- records: Record[] (1:N)
- fotos: CircuitPhoto[] (1:N)
```

#### 3. **Event** (`events/entities/event.entity.ts`)
```typescript
- id: UUID (PK)
- circuito_id: UUID (FK)
- creador_id: UUID (FK)
- titulo: string
- fecha_evento: Date
- hora_inicio: string (HH:mm)
- hora_fin: string (HH:mm)
- max_participantes: number
- tipo_evento: string (carrera|entrenamiento|amistoso)
- estado: string (programado|en_vivo|finalizado|cancelado)
- descripcion?: string
- fecha_creacion: Date (auto)

Relations:
- circuito: Circuit (N:1)
- creador: User (N:1)
- participantes: ParticipantEvent[] (1:N)
- chat_grupal: GroupChat[] (1:N)
- fotos: EventPhoto[] (1:N)
```

### Junction Tables

#### 4. **ParticipantEvent** (`events/entities/participant-event.entity.ts`)
```typescript
- id: UUID (PK)
- evento_id: UUID (FK)
- usuario_id: UUID (FK)
- fecha_inscripcion: Date (auto)
- estado_participacion: string (inscrito|completado|retirado)
- posicion_final?: number
- tiempo_mejor_vuelta?: string (mm:ss.ms)

Relations:
- evento: Event (N:1)
- usuario: User (N:1)
```

#### 5. **Record** (`records/entities/record.entity.ts`)
```typescript
- id: UUID (PK)
- usuario_id: UUID (FK)
- circuito_id: UUID (FK)
- tiempo_mejor: string (mm:ss.ms)
- num_vueltas: number
- fecha_record: Date (auto)

Relations:
- usuario: User (N:1)
- circuito: Circuit (N:1)
```

### Photo Entities (Intermediate between Events/Circuits and Storage)

#### 6. **CircuitPhoto** (`circuits/entities/circuit-photo.entity.ts`)
```typescript
- id: UUID (PK)
- circuito_id: UUID (FK)
- usuario_id: UUID (FK)
- url_foto: string (Minio/S3 URL)
- descripcion?: string
- num_likes: number (default: 0)
- fecha_subida: Date (auto)
- destacada: boolean (default: false)

Relations:
- circuito: Circuit (N:1)
- usuario: User (N:1)
```

#### 7. **EventPhoto** (`events/entities/event-photo.entity.ts`)
```typescript
- id: UUID (PK)
- evento_id: UUID (FK)
- usuario_id: UUID (FK)
- url_foto: string (Minio/S3 URL)
- descripcion?: string
- num_likes: number (default: 0)
- fecha_subida: Date (auto)
- destacada: boolean (default: false)

Relations:
- evento: Event (N:1)
- usuario: User (N:1)
```

### Chat Entities

#### 8. **IndividualChat** (`chat/individual/entities/individual-chat.entity.ts`)
```typescript
- id: UUID (PK)
- usuario_1_id: UUID (FK)
- usuario_2_id: UUID (FK)
- fecha_creacion: Date (auto)
- ultimo_mensaje?: string

Relations:
- usuario_1: User (N:1)
- usuario_2: User (N:1)
- mensajes: IndividualMessage[] (1:N)
```

#### 9. **IndividualMessage** (`chat/individual/entities/individual-message.entity.ts`)
```typescript
- id: UUID (PK)
- chat_individual_id: UUID (FK)
- usuario_id: UUID (FK)
- contenido: string
- timestamp: Date (auto)
- leido: boolean (default: false)

Relations:
- chat: IndividualChat (N:1)
- usuario: User (N:1)
```

#### 10. **GroupChat** (`chat/grupal/entities/group-chat.entity.ts`)
```typescript
- id: UUID (PK)
- evento_id: UUID (FK)
- nombre: string
- fecha_creacion: Date (auto)

Relations:
- evento: Event (N:1)
- mensajes: GroupMessage[] (1:N)
```

#### 11. **GroupMessage** (`chat/grupal/entities/group-message.entity.ts`)
```typescript
- id: UUID (PK)
- chat_grupal_id: UUID (FK)
- usuario_id: UUID (FK)
- contenido: string
- timestamp: Date (auto)
- leido: boolean (default: false)

Relations:
- chat: GroupChat (N:1)
- usuario: User (N:1)
```

### Notifications

#### 12. **Notification** (`notifications/entities/notification.entity.ts`)
```typescript
- id: UUID (PK)
- usuario_id: UUID (FK)
- usuario_origen_id: UUID (FK)
- tipo: string (participacion|invitacion|mensaje|like|etc)
- titulo: string
- contenido: string
- referencia_id?: UUID (referencia al evento, foto, etc)
- leida: boolean (default: false)
- fecha_creacion: Date (auto)

Relations:
- usuario: User (N:1)
- usuario_origen: User (N:1)
```

---

## 📝 DTOs Implementados

### Users DTOs

#### **CreateUserDto**
```typescript
- email: string @IsEmail
- password: string @MinLength(8)
- nombre: string @MinLength(2) @MaxLength(50)
- apellido: string @MinLength(2) @MaxLength(50)
- foto_perfil?: string
- descripcion?: string @MaxLength(500)
```

#### **UpdateUserDto**
```typescript
- nombre?: string @MinLength(2) @MaxLength(50)
- apellido?: string @MinLength(2) @MaxLength(50)
- foto_perfil?: string
- descripcion?: string @MaxLength(500)
- activo?: boolean
```

### Circuits DTOs

#### **CreateCircuitDto**
```typescript
- nombre: string @MinLength(3) @MaxLength(100)
- ubicacion: string @MinLength(3)
- pais: string (ISO code) @MinLength(2) @MaxLength(2)
- ciudad: string @MinLength(2)
- latitud: number @Min(-90) @Max(90)
- longitud: number @Min(-180) @Max(180)
- descripcion?: string @MaxLength(500)
- foto_principal?: string
- sitio_web?: string
- num_vueltas: number @Min(1)
- longitud_pista: number @Min(0.1)
```

#### **UpdateCircuitDto**
```typescript
- nombre?: string
- ubicacion?: string
- descripcion?: string
- foto_principal?: string
- sitio_web?: string
- num_vueltas?: number
- longitud_pista?: number
```

### Events DTOs

#### **CreateEventDto**
```typescript
- circuito_id: UUID @IsUUID
- titulo: string @MinLength(3) @MaxLength(100)
- fecha_evento: Date @IsDateString
- hora_inicio: string (HH:mm)
- hora_fin: string (HH:mm)
- max_participantes: number @Min(1)
- tipo_evento: string
- descripcion?: string @MaxLength(500)
```

#### **UpdateEventDto**
```typescript
- titulo?: string
- hora_inicio?: string
- hora_fin?: string
- max_participantes?: number
- estado?: string
- descripcion?: string
```

### Records DTOs

#### **CreateRecordDto**
```typescript
- circuito_id: UUID @IsUUID
- tiempo_mejor: string (mm:ss.ms)
- num_vueltas: number @Min(1)
```

### Notifications DTOs

#### **CreateNotificationDto**
```typescript
- usuario_id: UUID @IsUUID
- tipo: string
- titulo: string @MinLength(3) @MaxLength(100)
- contenido: string @MinLength(3) @MaxLength(500)
- referencia_id?: UUID
```

### Chat DTOs

#### **CreateIndividualChatDto**
```typescript
- usuario_2_id: UUID @IsUUID
```

#### **CreateIndividualMessageDto**
```typescript
- chat_individual_id: UUID @IsUUID
- contenido: string @MinLength(1) @MaxLength(5000)
```

#### **CreateGroupChatDto**
```typescript
- evento_id: UUID @IsUUID
- nombre: string @MinLength(1) @MaxLength(100)
```

#### **CreateGroupMessageDto**
```typescript
- chat_grupal_id: UUID @IsUUID
- contenido: string @MinLength(1) @MaxLength(5000)
```

---

## 🔗 Relaciones Principales

```
User
├── 1:N eventos_creados → Event
├── 1:N records → Record
├── 1:N participaciones → ParticipantEvent
├── 1:N notificaciones → Notification (recibidas)
├── 1:N notificaciones_enviadas → Notification (enviadas)
├── 1:N fotos_circuitos → CircuitPhoto
├── 1:N fotos_eventos → EventPhoto
├── 1:N chats_iniciados → IndividualChat
└── 1:N chats_recibidos → IndividualChat

Circuit
├── 1:N eventos → Event
├── 1:N records → Record
└── 1:N fotos → CircuitPhoto

Event
├── N:1 circuito → Circuit
├── N:1 creador → User
├── 1:N participantes → ParticipantEvent
├── 1:N chat_grupal → GroupChat
└── 1:N fotos → EventPhoto

Storage (Minio/S3)
├── CircuitPhoto.url_foto
└── EventPhoto.url_foto
```

---

## 🚀 Próximos Pasos

1. ✅ Entities implementadas con TypeORM
2. ✅ DTOs implementados con class-validator
3. ✅ Módulos configurados con TypeOrmModule
4. ⏭️ Implementar Repositories
5. ⏭️ Implementar Services con lógica de negocio
6. ⏭️ Implementar Controllers con endpoints
7. ⏭️ Configurar Minio en StorageService
8. ⏭️ Configurar JWT en AuthService
9. ⏭️ Agregar tests
