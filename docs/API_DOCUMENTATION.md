# E-Sim By ELECTRON - API Documentation

**Version:** 2.0 | **Base URL:** `https://api.esim-electron.com` | **Status:** Active

---

## 🔐 Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## 🛒 Orders

### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    { "productId": "fr-1" },
    { "productId": "us-1" }
  ]
}
```

### Get User Orders
```http
GET /api/users/orders
Authorization: Bearer <token>
```

### Cancel Order
```http
POST /api/orders/:id/cancel
Authorization: Bearer <token>
```

---

## 📱 eSIM Management

### Generate eSIM
```http
POST /api/esim/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order-id"
}
```

### Get User eSIMs
```http
GET /api/esim
Authorization: Bearer <token>
```

### Activate eSIM
```http
POST /api/esim/:id/activate
Authorization: Bearer <token>
```

### Top Up eSIM
```http
POST /api/esim/:id/topup
Authorization: Bearer <token>
Content-Type: application/json

{
  "dataPackage": "5GB"
}
```

---

## 💳 Payments

### Create Payment Session
```http
POST /api/payment/create-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order-id"
}
```

### Verify Payment
```http
POST /api/payment/verify
Content-Type: application/json

{
  "orderId": "order-id",
  "sessionId": "session-id",
  "status": "paid"
}
```

---

## 🔧 Reseller API

### Get Products (Reseller)
```http
GET /api/reseller/products?resellerTier=gold
X-API-Key: your-api-key
```

### Create Order (Reseller)
```http
POST /api/reseller/orders
X-API-Key: your-api-key
Content-Type: application/json

{
  "items": [{ "productId": "fr-1" }],
  "customerEmail": "customer@example.com",
  "resellerOrderId": "RES-12345"
}
```

---

## ⚙️ Automation

### List Automations
```http
GET /api/automation
```

### Trigger Automation
```http
POST /api/automation/:id/trigger
```

### Get Automation Logs
```http
GET /api/automation/:id/logs
```

---

## 🔗 Webhooks

### Register Webhook
```http
POST /api/webhooks/register
Content-Type: application/json

{
  "event": "order.paid",
  "url": "https://your-app.com/webhook",
  "secret": "your-secret"
}
```

### Stripe Webhook
```http
POST /api/webhooks/stripe
Stripe-Signature: <signature>
Content-Type: application/json

{
  "type": "checkout.session.completed",
  "data": { "object": {...} }
}
```

---

## 📊 Products

### Get All Products
```http
GET /api/products
```

### Get Product by ID
```http
GET /api/products/:id
```

### Filter by Region
```http
GET /api/products?region=europe
```

### Search Products
```http
GET /api/products/search/:query
```

---

## 👤 User Profile

### Get Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name"
}
```

### Get Dashboard Stats
```http
GET /api/users/dashboard
Authorization: Bearer <token>
```

---

## ❌ Error Responses

```json
{
  "error": "Error message description"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |

---

## 📝 Rate Limits

| Endpoint | Limit |
|----------|-------|
| Authentication | 10/minute |
| Orders | 60/minute |
| eSIM | 30/minute |
| General | 100/minute |

---

## 🔒 Security

- All endpoints (except `/health`, `/products`) require authentication
- Use HTTPS in production
- Rotate API keys regularly
- Implement webhook signature verification
