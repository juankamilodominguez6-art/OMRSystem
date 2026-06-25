# Sistema POS Backend - Autenticación JWT y Facturación DIAN

Sistema backend completo para gestión de usuarios y facturación electrónica colombiana con cumplimiento DIAN.

## Stack Tecnológico

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación con JSON Web Tokens
- **bcryptjs** - Cifrado de contraseñas
- **express-validator** - Validación de datos

## Características

### Autenticación y Seguridad
- Registro e inicio de sesión con JWT
- Cifrado de contraseñas con bcrypt
- Dos niveles de usuario: Dueño (Admin) y Cliente
- Middleware de autenticación y autorización
- Rate limiting para prevenir ataques
- Helmet para seguridad HTTP

### Facturación DIAN
- Cumplimiento con requisitos básicos DIAN
- Información del emisor y adquiriente
- Cálculo automático de IVA (19%, 5%, exento)
- Cálculo de Impuesto al Consumo (INC)
- Numeración consecutiva de facturas
- Soporte para múltiples formas de pago
- Anulación de facturas
- Estadísticas de facturación

### Gestión de Usuarios
- CRUD completo de usuarios (solo Dueño)
- Información fiscal por usuario
- Cambio de contraseña
- Activación/desactivación de usuarios

## Estructura de Carpetas

```
backend/
├── config/
│   └── database.js          # Conexión a MongoDB
├── controllers/
│   ├── authController.js   # Lógica de autenticación
│   ├── userController.js   # Lógica de gestión de usuarios
│   └── invoiceController.js # Lógica de facturación
├── middleware/
│   ├── auth.js             # Middleware JWT
│   └── errorHandler.js     # Manejo de errores
├── models/
│   ├── User.js             # Modelo de usuario
│   └── Invoice.js          # Modelo de factura
├── routes/
│   ├── auth.js             # Rutas de autenticación
│   ├── users.js            # Rutas de usuarios
│   └── invoices.js         # Rutas de facturación
├── .env.example            # Variables de entorno ejemplo
├── .gitignore
├── package.json
├── server.js               # Entry point
└── README.md
```

## Instalación

1. Clonar el repositorio
2. Navegar al directorio backend
3. Instalar dependencias:

```bash
npm install
```

4. Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

5. Configurar las variables de entorno en `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/pos-system
JWT_SECRET=tu-clave-secreta-jwt-aqui
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
DIAN_NIT=900123456-7
DIAN_REGIMEN=48
```

6. Iniciar MongoDB (local o en la nube)

7. Iniciar el servidor:

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## API Endpoints

### Autenticación

#### Registro
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "role": "cliente",
  "fiscalInfo": {
    "tipoDocumento": "CC",
    "numeroDocumento": "123456789",
    "direccion": "Calle 123",
    "telefono": "3001234567",
    "ciudad": "Bogotá"
  }
}
```

#### Iniciar Sesión
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

#### Obtener Usuario Actual
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Actualizar Información Fiscal
```http
PUT /api/auth/fiscal-info
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipoDocumento": "CC",
  "numeroDocumento": "123456789",
  "direccion": "Calle 123",
  "telefono": "3001234567",
  "ciudad": "Bogotá"
}
```

### Usuarios (Solo Dueño)

#### Obtener Todos los Usuarios
```http
GET /api/users
Authorization: Bearer <token>
```

#### Obtener Usuario por ID
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Crear Usuario
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "María García",
  "email": "maria@example.com",
  "password": "password123",
  "role": "cliente",
  "fiscalInfo": {
    "tipoDocumento": "CC",
    "numeroDocumento": "987654321"
  }
}
```

#### Actualizar Usuario
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "María García Actualizado",
  "isActive": true
}
```

#### Eliminar Usuario
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

#### Cambiar Contraseña
```http
PUT /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

### Facturas

#### Crear Factura
```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "emisor": {
    "nombre": "Mi Negocio",
    "nit": "900123456-7",
    "direccion": "Calle Principal #123",
    "telefono": "+57 300 123 4567",
    "ciudad": "Bogotá",
    "regimenTributario": "48"
  },
  "adquiriente": {
    "nombre": "Cliente Ejemplo",
    "tipoDocumento": "CC",
    "numeroDocumento": "123456789",
    "direccion": "Calle Cliente #456",
    "telefono": "3109876543",
    "ciudad": "Medellín",
    "email": "cliente@example.com"
  },
  "items": [
    {
      "descripcion": "Producto 1",
      "cantidad": 2,
      "valorUnitario": 50000,
      "ivaTarifa": 19,
      "incTarifa": 0
    },
    {
      "descripcion": "Producto 2",
      "cantidad": 1,
      "valorUnitario": 30000,
      "ivaTarifa": 5,
      "incTarifa": 0
    }
  ],
  "formaPago": {
    "tipo": "efectivo",
    "descripcion": "Efectivo"
  },
  "observaciones": "Venta de mostrador",
  "prefijo": "FV"
}
```

#### Obtener Facturas
```http
GET /api/invoices?estado=emitida&fechaInicio=2024-01-01&fechaFin=2024-12-31
Authorization: Bearer <token>
```

#### Obtener Factura por ID
```http
GET /api/invoices/:id
Authorization: Bearer <token>
```

#### Anular Factura (Solo Dueño)
```http
PUT /api/invoices/:id/anular
Authorization: Bearer <token>
```

#### Obtener Estadísticas (Solo Dueño)
```http
GET /api/invoices/stats?fechaInicio=2024-01-01&fechaFin=2024-12-31
Authorization: Bearer <token>
```

#### Generar PDF
```http
GET /api/invoices/:id/pdf
Authorization: Bearer <token>
```

### Ventas

#### Crear Venta
```http
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer": {
    "id": "user_id_opcional",
    "name": "Cliente Ejemplo",
    "document": "123456789",
    "documentType": "CC"
  },
  "items": [
    {
      "productId": "product_id",
      "productName": "Producto 1",
      "sku": "SKU-001",
      "category": "Frutas",
      "quantity": 2,
      "unitPrice": 50000
    },
    {
      "productId": "product_id",
      "productName": "Producto 2",
      "sku": "SKU-002",
      "category": "Granos",
      "quantity": 1,
      "unitPrice": 30000
    }
  ],
  "paymentMethod": "cash",
  "paidAmount": 100000,
  "notes": "Venta de mostrador",
  "taxRate": 0.19
}
```

#### Obtener Ventas
```http
GET /api/sales?status=completed&paymentMethod=cash&fechaInicio=2024-01-01&fechaFin=2024-12-31
Authorization: Bearer <token>
```

#### Obtener Venta por ID
```http
GET /api/sales/:id
Authorization: Bearer <token>
```

#### Obtener Ventas de Hoy
```http
GET /api/sales/today
Authorization: Bearer <token>
```

#### Cancelar Venta (Solo Dueño)
```http
PUT /api/sales/:id/cancel
Authorization: Bearer <token>
```

#### Reembolsar Venta (Solo Dueño)
```http
PUT /api/sales/:id/refund
Authorization: Bearer <token>
```

#### Obtener Estadísticas de Ventas (Solo Dueño)
```http
GET /api/sales/stats?periodo=hoy&fechaInicio=2024-01-01&fechaFin=2024-12-31
Authorization: Bearer <token>
```

Parámetros de periodo: `hoy`, `semana`, `mes`, `anio`

## Modelos de Base de Datos

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'dueño' | 'cliente',
  fiscalInfo: {
    tipoDocumento: 'CC' | 'NIT' | 'CE' | 'TI' | 'PP',
    numeroDocumento: String,
    direccion: String,
    telefono: String,
    ciudad: String
  },
  isActive: Boolean,
  createdAt: Date,
  lastLogin: Date
}
```

### Invoice
```javascript
{
  consecutivo: Number (unique),
  prefijo: String,
  emisor: {
    nombre: String,
    nit: String,
    direccion: String,
    telefono: String,
    ciudad: String,
    regimenTributario: '48' | '49'
  },
  adquiriente: {
    nombre: String,
    tipoDocumento: String,
    numeroDocumento: String,
    direccion: String,
    telefono: String,
    ciudad: String,
    email: String
  },
  fechaEmision: Date,
  items: [{
    descripcion: String,
    cantidad: Number,
    valorUnitario: Number,
    ivaTarifa: 0 | 5 | 19,
    ivaValor: Number,
    incTarifa: 0 | 4 | 8,
    incValor: Number,
    valorTotal: Number
  }],
  subtotal: Number,
  baseImponible: Number,
  ivaTotal: Number,
  incTotal: Number,
  total: Number,
  formaPago: {
    tipo: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito',
    descripcion: String
  },
  estado: 'emitida' | 'anulada',
  usuario: ObjectId (ref: User),
  observaciones: String,
  moneda: String
}
```

### Sale
```javascript
{
  saleNumber: Number (unique),
  customer: {
    id: ObjectId (ref: User),
    name: String,
    document: String,
    documentType: String
  },
  user: ObjectId (ref: User),
  items: [{
    productId: ObjectId,
    productName: String,
    sku: String,
    category: String,
    quantity: Number,
    unitPrice: Number,
    subtotal: Number
  }],
  subtotal: Number,
  tax: Number,
  taxRate: Number,
  total: Number,
  paymentMethod: 'cash' | 'card' | 'credit' | 'transfer',
  paidAmount: Number,
  changeAmount: Number,
  status: 'completed' | 'cancelled' | 'refunded',
  notes: String,
  invoiceId: ObjectId (ref: Invoice),
  saleDate: Date
}
```

## Seguridad

- Contraseñas cifradas con bcrypt (salt rounds: 10)
- JWT tokens con expiración configurable
- Validación de datos con express-validator
- Rate limiting (100 requests por 15 minutos)
- Helmet para headers de seguridad HTTP
- CORS configurado
- Protección contra inyección SQL (MongoDB es NoSQL)

## Roles y Permisos

### Dueño (Administrador)
- Acceso completo a todas las rutas
- Gestión de usuarios (CRUD)
- Gestión de todas las facturas
- Anulación de facturas
- Acceso a estadísticas

### Cliente
- Registro e inicio de sesión
- Crear facturas propias
- Ver solo sus facturas
- Actualizar su información fiscal
- Cambiar su contraseña

## Consideraciones DIAN

El sistema cumple con los requisitos básicos de facturación electrónica colombiana:

- Información completa del emisor y adquiriente
- Tipos de documento: CC, NIT, CE, TI, PP
- Cálculo de IVA: 19%, 5%, 0% (exento)
- Cálculo de INC: 8%, 4%, 0%
- Numeración consecutiva automática
- Prefijos configurables (FV, NC, ND)
- Régimen tributario: 48 (Común), 49 (Simplificado)
- Anulación de facturas con registro

## Desarrollo

Para desarrollo con hot-reload:

```bash
npm run dev
```

## Producción

Para producción:

```bash
npm start
```

Asegúrese de:
- Configurar `NODE_ENV=production`
- Usar una cadena de conexión MongoDB segura
- Usar un JWT_SECRET fuerte
- Configurar CORS apropiadamente
- Usar HTTPS
- Implementar logging adicional
- Configurar backups de base de datos

## Testing

```bash
npm test
```

## Licencia

ISC
