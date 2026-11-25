# GearHive – Equipment Rental Platform (Server)

REST API for **GearHive**, an equipment rental marketplace where equipment owners list items and customers book and pay for them.
Built with **Express.js**, **MongoDB**, **JWT** and **Stripe**.

> Client repository: see `client/` (Next.js). This repository is the **server** part.

## 🔗 Links

| What | Link |
| --- | --- |
| Live site (client) | `https://YOUR-CLIENT-URL.vercel.app` ← replace after deployment |
| Live API (server) | `https://YOUR-SERVER-URL.vercel.app` ← replace after deployment |
| Client repository | `https://github.com/YOUR-USERNAME/gearhive-client` |
| Server repository | `https://github.com/YOUR-USERNAME/gearhive-server` |

**Admin login for the examiner**

| Email | Password |
| --- | --- |
| `admin@gearhive.com` | `Admin@123` |

## 🎯 Purpose

The server provides the secure backend for the platform:
it stores users' equipment, bookings, payments and favorites, protects every private route with **JWT + role based access control**, calculates rental prices, checks availability, takes payments with **Stripe**, and produces dashboard **analytics**.

## ✨ Key Features

- **JWT authentication** – every private request needs `Authorization: Bearer <token>`.
- **Role Based Access Control** with custom middlewares: `verifyToken`, `verifyRenter`, `verifyOwner`, `verifyAdmin`.
- **Equipment API** – public list with **server-side search, filters, sorting and pagination**, featured items (MongoDB `$limit`), recent items, category counts.
- **Booking API** – validates dates, checks availability for the chosen dates, calculates the total on the server.
- **Stripe Checkout** – creates the payment session, confirms the payment with Stripe, saves the transaction in the `payments` collection and marks the booking as paid. Includes an optional **webhook**.
- **Favorites API** for customers.
- **Admin API** – users (change role, block, delete), equipment approval (approve / reject), all rentals (manage status).
- **Dashboard analytics** for Admin, Owner and Customer (totals + monthly charts data).
- **Cron job (node-cron)** – automatically marks finished rentals as `completed`.
- **E-mail notifications (nodemailer)** – sent to the customer and the owner when a rental is completed (optional).
- Environment variables for **every secret** (MongoDB, JWT, Stripe, SMTP). Nothing secret is written in the code.

## 🧰 npm Packages Used

| Package | Why |
| --- | --- |
| `express` | Web server and routing |
| `mongodb` | Official MongoDB driver |
| `jsonwebtoken` | Create / verify JWT tokens |
| `cors` | Allow only our website to call the API |
| `dotenv` | Load secrets from the `.env` file |
| `stripe` | Stripe Checkout payments |
| `node-cron` | Scheduled job (auto-complete rentals) |
| `nodemailer` | E-mail notifications |

## 📁 Folder Structure

```
server/
├── api/index.js              # Entry point for Vercel (serverless)
├── scripts/
│   ├── seed.js               # Demo data (equipment, bookings, payments)
│   └── test-logic.js         # Tiny self-test for price/date helpers
├── src/
│   ├── app.js                # Express app (CORS, JSON, routes, errors)
│   ├── server.js             # Starts the server + cron job
│   ├── config/               # env.js, db.js, constants.js
│   ├── middlewares/          # auth.js (JWT + roles), error handlers
│   ├── routes/               # URL -> controller mapping
│   ├── controllers/          # Request handling logic
│   ├── services/             # Pricing, availability, Stripe, analytics, e-mail
│   ├── validators/           # Input checking
│   ├── jobs/                 # node-cron job
│   └── utils/                # Small helper functions
├── .env.example
└── vercel.json
```

## 🚀 Run on Your Computer

```bash
# 1. install packages
npm install

# 2. create your environment file and fill in the values
cp .env.example .env

# 3. start the server (auto restarts when you save a file)
npm run dev
```

The API runs at `http://localhost:5000`.

### Environment variables (`.env`)

| Name | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `MONGODB_DB` | – | Database name (default `gearhive`). **Use the same name in the client project.** |
| `JWT_SECRET` | ✅ | Long random text. **Must be identical in the client project.** |
| `CLIENT_URL` | ✅ | Website address allowed by CORS (comma separate if more than one) |
| `STRIPE_SECRET_KEY` | ✅ | Stripe **test** secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | – | Only if you use the Stripe webhook |
| `ENABLE_CRON`, `CRON_SCHEDULE` | – | Turn the cron job on/off and set its schedule |
| `SMTP_*`, `EMAIL_FROM` | – | Optional e-mail notifications |

### Add demo data

1. In the **client** project run `npm run seed:users` (creates the admin, 2 owners and a customer).
2. In this project run `npm run seed` (creates equipment, bookings and payments).

Check the helper logic any time with `npm run test:logic`.

## 🔐 How Authentication Works

1. The user logs in with **BetterAuth** in the Next.js client (email/password or Google).
2. The client asks its own Next.js route (`/api/token`) for an **access token**. That route checks the BetterAuth session and signs a **JWT** with `JWT_SECRET`.
3. The client sends the token to this API: `Authorization: Bearer <token>`.
4. `verifyToken` checks the token and loads the user (and the current **role**) from MongoDB.
5. `verifyRenter` / `verifyOwner` / `verifyAdmin` allow or block the route by role.

## 📡 API Overview

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/equipment` (`q, category, rentalType, minPrice, maxPrice, availability, sort, page, limit`) | Public |
| GET | `/api/equipment/featured` · `/recent` · `/categories` | Public |
| GET | `/api/equipment/:id` · `/:id/availability` | Logged in |
| POST | `/api/equipment` | Owner |
| PUT / DELETE | `/api/equipment/:id` | Owner of the item or Admin |
| GET / POST / DELETE | `/api/favorites` | Customer |
| POST | `/api/bookings` | Customer |
| GET | `/api/bookings/my` · `/api/bookings/:id` | Customer |
| POST | `/api/payments/create-checkout-session` · `/api/payments/confirm` | Customer |
| POST | `/api/payments/webhook` | Stripe |
| GET | `/api/owner/equipment` · `/api/owner/rentals` | Owner |
| GET | `/api/analytics/admin` · `/owner` · `/customer` | Admin / Owner / Customer |
| GET / PATCH / DELETE | `/api/admin/users…` | Admin |
| GET / PATCH | `/api/admin/equipment…` | Admin |
| GET / PATCH / POST | `/api/admin/rentals…` | Admin |

## ☁️ Deployment (Vercel)

1. Push this repository to GitHub and import it in Vercel.
2. Add every variable from `.env.example` in **Project → Settings → Environment Variables**.
3. Set `CLIENT_URL` to your live client address (no trailing slash).
4. Deploy and open the live URL – you should see `{"name":"GearHive API","status":"running"}`.

> **Cron job note:** Vercel (serverless) cannot keep a cron job running. The Admin dashboard has an **“Update finished rentals”** button that runs the same job on demand. On a normal host (Render, Railway, VPS) the cron job runs automatically every day.

## 💳 Stripe test card

Use `4242 4242 4242 4242`, any future date, any CVC and any ZIP.
