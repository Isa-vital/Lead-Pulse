# Lead Pulse CRM

A full-featured Customer Relationship Management system built with **Laravel 12** (API) and **React 19** (SPA). Designed for managing customers, leads, orders, marketing campaigns, support tickets, and more — all from a single dashboard.

![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)

---

## Features

### Core CRM
- **Dashboard** — Real-time KPIs, revenue charts, recent activity
- **Customer Management** — Full CRUD, tiers (regular/silver/gold/platinum), timeline, tags, source tracking
- **Lead & Pipeline Management** — Kanban pipeline board, drag-and-drop stage progression
- **Interactions** — Calls, emails, meetings, notes linked to customers
- **Product Catalog** — Products with categories, pricing, inventory tracking

### Sales & Orders
- **Order Management** — Full order lifecycle, status history, invoice generation (PDF)
- **Abandoned Cart Recovery** — Track abandoned carts, send reminders, recovery analytics
- **Coupons & Discounts** — Percentage, fixed amount, and free shipping coupons with usage limits

### Marketing
- **Campaign Management** — Email/SMS campaigns with segment-based targeting, open/click rate tracking
- **Customer Segments** — Dynamic rule-based segmentation with preview and recalculation
- **Email Templates** — Template CRUD, preview, and duplication
- **Loyalty Program** — Points ledger, customer balance tracking, leaderboard

### Support
- **Support Tickets** — Ticket creation, priority/SLA tracking, internal/external replies
- **Returns & Refunds** — Return requests with reason tracking, refund processing
- **Live Chat** — Real-time messaging interface with conversation management

### Automation & Analytics
- **Automations** — Trigger-based automation rules with execution logs
- **Reports** — Revenue, sales performance, customer, and product reports with charts
- **Activity Log** — System-wide audit trail

### System
- **User Management** — Role-based access control (Spatie Permissions)
- **Import/Export** — CSV import/export for customers, products, and orders
- **Notifications** — In-app notification system with read/unread tracking
- **Settings** — Configurable system settings
- **Global Search** — Search across all entities

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Laravel 12, PHP 8.2, Sanctum (API auth), Spatie Permissions |
| **Frontend** | React 19, TypeScript 5.9, Vite 7.3 |
| **Styling** | Tailwind CSS 4.2 |
| **State** | Zustand 5, TanStack React Query 5 |
| **Charts** | Recharts 3.7 |
| **Icons** | Lucide React |
| **Database** | PostgreSQL |
| **PDF** | DomPDF |

---

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+ & npm
- PostgreSQL 15+

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Isa-vital/Lead-Pulse.git
cd Lead-Pulse
```

### 2. Backend setup

```bash
cd backend

# Install dependencies
composer install

# Environment config
cp .env.example .env
php artisan key:generate
```

Configure your `.env` file with database credentials:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=lead_pulse
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

Run migrations:

```bash
php artisan migrate
```

### 3. Frontend setup

```bash
cd ../frontend

# Install dependencies
npm install
```

### 4. Start development servers

**Backend** (from `backend/` directory):
```bash
php artisan serve
```

**Frontend** (from `frontend/` directory):
```bash
npm run dev
```

The API runs at `http://localhost:8000` and the frontend at `http://localhost:5173`.

---

## Project Structure

```
Lead Pulse/
├── backend/                    # Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/   # API controllers (17)
│   │   └── Models/                     # Eloquent models (26)
│   ├── database/migrations/           # 30 migration files
│   ├── routes/api.php                 # 137+ API routes
│   └── ...
├── frontend/                   # React 19 SPA
│   ├── src/
│   │   ├── api/               # Axios client & endpoint modules
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # 20 page modules
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # TypeScript interfaces
│   │   └── App.tsx            # Route definitions
│   └── ...
└── README.md
```

---

## API Overview

All API routes are prefixed with `/api/v1` and require authentication via Laravel Sanctum (except login).

| Module | Endpoints | Description |
|---|---|---|
| **Auth** | 5 | Login, logout, profile, password |
| **Dashboard** | 1 | KPI aggregation |
| **Customers** | 6 | CRUD + timeline, sources, tags |
| **Products** | 5 | Full CRUD |
| **Categories** | 4 | CRUD (no show) |
| **Orders** | 7 | CRUD + status, invoice, history |
| **Leads & Pipeline** | 7 | CRUD + board, move, stages |
| **Interactions** | 6 | CRUD + complete |
| **Support Tickets** | 7 | CRUD + reply, stats |
| **Returns** | 6 | CRUD + stats |
| **Coupons** | 5 | Full CRUD |
| **Loyalty** | 5 | Points, balance, leaderboard, stats |
| **Campaigns** | 7 | CRUD + send, stats |
| **Abandoned Carts** | 5 | List, view, update, remind, stats |
| **Automations** | 7 | CRUD + toggle, logs, stats |
| **Segments** | 7 | CRUD + recalculate, customers, preview |
| **Chat** | 5 | Conversations, messages, send, receive, unread |
| **Reports** | 4 | Revenue, sales, customers, products |
| **Email Templates** | 7 | CRUD + preview, duplicate |
| **Import/Export** | 5 | CSV import/export |
| **Notifications** | 4 | List, unread count, read, mark-all |
| **Settings** | 3 | Get, update, activity log |
| **Users** | 6 | Register, CRUD, toggle active |
| **Search** | 1 | Global search |

**Total: 137+ endpoints**

---

## Models

The application uses 26 Eloquent models:

`ActivityLog` · `Automation` · `AutomationLog` · `Campaign` · `CampaignRecipient` · `Cart` · `CartItem` · `Category` · `ChatMessage` · `Coupon` · `Customer` · `EmailTemplate` · `Interaction` · `Lead` · `LoyaltyPoint` · `Order` · `OrderItem` · `OrderStatusHistory` · `PipelineStage` · `Product` · `ReturnRequest` · `Segment` · `Setting` · `SupportTicket` · `TicketReply` · `User`

---

## Frontend Pages

| Page | Path | Description |
|---|---|---|
| Dashboard | `/` | KPIs, charts, recent activity |
| Customers | `/customers` | Customer list with filters & detail view |
| Products | `/products` | Product catalog management |
| Orders | `/orders` | Order management with status tracking |
| Pipeline | `/pipeline` | Kanban lead pipeline |
| Communications | `/communications` | Interaction tracking |
| Reports | `/reports` | Revenue, sales, customer & product reports |
| Email Templates | `/email-templates` | Template management |
| Support Tickets | `/support-tickets` | Ticket management with replies |
| Returns | `/returns` | Return request processing |
| Coupons | `/coupons` | Coupon creation & tracking |
| Loyalty | `/loyalty` | Points program management |
| Campaigns | `/campaigns` | Campaign creation & analytics |
| Abandoned Carts | `/abandoned-carts` | Cart recovery tools |
| Automations | `/automations` | Automation rule builder |
| Segments | `/segments` | Customer segmentation |
| Live Chat | `/chat` | Real-time messaging |
| Settings | `/settings` | System configuration |
| Profile | `/profile` | User profile management |

---

## Currency

The application uses **UGX** (Ugandan Shilling) as the default currency throughout the system.

---

## Build for Production

```bash
cd frontend
npm run build
```

The production build outputs to `frontend/dist/`.

---

## License

MIT
