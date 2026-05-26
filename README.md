# Nobelian Admin

Nobelian Admin is the internal backoffice/administration tool for managing the Nobelian luxury brand webshop.

Administrators can manage products, collections, media files, and orders without modifying the frontend source code.

---

## Overview

The admin panel provides:

- **Products** – Create, edit, delete products with full metadata (price, images, materials, category, stock status)
- **Collections** – Create and delete product collections
- **Media** – Upload and manage product images with folders, drag & drop reorder, rename/alt text editing, and image optimization (resize, WebP conversion)
- **Orders** – View all orders, update order status, delete orders, export to CSV/Excel
- **Customers** – Browse, search, and manage registered customers with order history stats
- **Analytics** – Revenue trends, order status breakdown, top products, customer growth
- **Dashboard** – Overview with product/collection/media counts

---

## System Architecture

| Component | Technology | URL |
|-----------|-----------|-----|
| Admin Panel (this repo) | Vanilla HTML/CSS/JS | Static hosting |
| Backend API | Rust (Axum) | https://nobelian-be.fly.dev |
| Database | MongoDB | MongoDB Atlas |
| File Storage | Local cloud directory (served via backend) | /cloud/* |
| Frontend Website | Vanilla HTML/CSS/JS | https://nobelian.com |

---

## Technology Stack

**Admin Frontend**
- Vanilla HTML5, CSS3, JavaScript (no framework)
- Static files, no build step required

**Backend API (separate repo: Nobelian-BE)**
- Rust with Axum web framework
- MongoDB driver
- JWT authentication
- Deployed on Fly.io

---

## Project Structure

```
Nobelian-admin/
├── index.html          # Redirect to login/dashboard
├── login.html          # Admin login page
├── dashboard.html      # Dashboard with stats
├── products.html       # Product list
├── product-edit.html   # Product create/edit form
├── collections.html    # Collections management
├── media.html          # Media upload & library
├── orders.html         # Order management + CSV/Excel export
├── customers.html      # Customer database management
├── analytics.html      # Analytics dashboard
├── css/
│   └── admin.css       # All admin styles
└── js/
    ├── security.js     # XSS escape, JWT decode, session timeout (loaded first)
    ├── api.js          # API helper (base URL, auth headers, 401 handling)
    ├── auth.js         # Authentication (token validation, expiry, idle timeout)
    ├── app.js          # Dashboard initialization & stats
    ├── products.js     # Products list logic
    ├── collections.js  # Collections logic
    └── media.js        # Media upload/list logic
```

---

## API Endpoints Used

All endpoints are prefixed with `https://nobelian-be.fly.dev/api`

**Authentication**
- `POST /api/auth/login` – Admin login (returns JWT token)

**Products**
- `GET /api/products` – List all products
- `GET /api/products/:id` – Get single product
- `POST /api/products` – Create product (admin)
- `PUT /api/products/:id` – Update product (admin)
- `DELETE /api/products/:id` – Delete product (admin)

**Collections**
- `GET /api/collections` – List all collections
- `POST /api/collections` – Create collection (admin)
- `DELETE /api/collections/:id` – Delete collection (admin)

**Media**
- `GET /api/media` – List all media files (supports `?folder=` filter)
- `GET /api/media/folders` – List all unique folder names
- `POST /api/media` – Upload image (multipart/form-data, admin) — supports `folder` and `alt_text` fields
- `PUT /api/media/:id` – Update media metadata (alt_text, original_name, folder, sort_order)
- `PUT /api/media/reorder` – Bulk reorder media items (admin)
- `POST /api/media/:id/optimize` – Optimize image: resize and/or convert format (admin)
- `DELETE /api/media/:id` – Delete media file (admin)

**Orders (Admin)**
- `GET /api/admin/orders` – List all orders
- `PUT /api/admin/orders/:id/status` – Update order status
- `DELETE /api/admin/orders/:id` – Delete order
- `GET /api/admin/orders/export/csv` – Export orders as CSV file

**Customers (Admin)**
- `GET /api/admin/customers` – List all customers (with search, role filter, pagination)
- `GET /api/admin/customers/:id` – Get customer details
- `DELETE /api/admin/customers/:id` – Delete customer

**Analytics (Admin)**
- `GET /api/admin/analytics` – Get analytics data (revenue, orders, top products, etc.)

---

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-repo/nobelian-admin.git
```

2. Serve the static files with any HTTP server:
```bash
# Using Python
python3 -m http.server 8080

# Using Node.js (npx)
npx serve .
```

3. Open `http://localhost:8080` in your browser.

No build step or npm install required — it's plain HTML/CSS/JS.

---

## Configuration

The API base URL is configured in a single place — `js/api.js`:

```javascript
const API_BASE = "https://nobelian-be.fly.dev/api";
```

All pages load this file, and all API calls reference `API_BASE`. To change the backend URL, only this one file needs updating.

---

## CORS Setup (Backend)

The backend requires the admin panel's origin in the `ALLOWED_ORIGINS` environment variable. This is configured in the backend's `fly.toml`:

```toml
[env]
  ALLOWED_ORIGINS = "https://admin.nobelian.com,https://nobelian.com,http://localhost:3000,http://localhost:8080"
```

If you host the admin panel on a different domain, add it to this comma-separated list and redeploy the backend.

---

## Authentication

The admin panel uses JWT tokens stored in `localStorage` under the key `admin_token`. All protected API calls include the token as a `Bearer` authorization header.

Admin endpoints on the backend require a valid JWT with admin role.

### Security Features

- **Token validation**: Client-side JWT decode checks structure, expiry, and admin role before granting UI access
- **Auto-logout on 401**: If the backend rejects a token, the user is immediately redirected to login
- **Session idle timeout**: 30 minutes of inactivity triggers automatic logout (with 2-minute warning)
- **Periodic expiry check**: Token expiry is checked every 60 seconds during active sessions
- **XSS prevention**: All API data is HTML-escaped before DOM insertion via `escapeHtml()` / `escapeAttr()`
- **Content Security Policy**: CSP meta tags restrict script sources, block iframes, and limit network connections
- **Input validation**: Client-side length limits and format checks on all form inputs
- **URL encoding**: All dynamic URL path segments use `encodeURIComponent()`

---

## Future Features

- Inventory tracking
- Role-based permissions
- Content management system
