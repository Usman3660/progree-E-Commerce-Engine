# ⚡ VORTEX APEX // Secure E-Commerce Engine with Checkout Sandbox

A production-grade, full-stack cybernetic hardware atelier built with **Node.js, Express, React, Vite, TailwindCSS**, and an ACID-safe transactional inventory engine.

---

## 🌟 Key Architecture & Requirements Fulfilled

### 1. 🛡️ Cryptographic JWT Authentication & Hashed Database Credentials
- **JSON Web Tokens (JWT)**: Cryptographically signed access tokens (`HS256 256-bit`) with automatic persistence and expiration handling.
- **Bcrypt Password Hashing**: Passwords stored using salted cryptographic hashes (no plain-text passwords).
- **Guest-to-Authenticated Cart Migration**: Guest carts automatically merge seamlessly into the user's persistent server profile upon login or registration.
- **Role-Based Access Control (RBAC)**: Support for customers (`netrunner`) and administrative operators (`admin`).

### 2. 🛒 Persistent Shopping Cart State Engine
- **Server & Local Synchronized State**: Cart contents persist across page refreshes and browser sessions.
- **Real-Time Live Stock Validation**: Prevents adding quantities exceeding warehouse inventory.
- **Dynamic Pricing & Tax Engine**: Real-time calculation of subtotal, Neo-City sales tax (8.25%), customizable shipping tiers (Standard, Cyber-Express, Orbital Drone), and promotional coupons (`NEO2026`, `SANDBOX100`, `CYBER50`).

### 3. 💳 Secure Payment Sandbox Module (Stripe API Simulation)
- **Interactive Multi-Stage Checkout Pipeline**:
  - **Stage 1**: Identity verification and shipping destination (with 1-click demo autofill).
  - **Stage 2**: Delivery protocol selection.
  - **Stage 3**: Interactive Payment Sandbox with 3D Secure 2.0 biometric/SMS challenges, simulated latency controls (0–3000ms), and real-time failure simulations (Declines, Insufficient Funds, Radar Fraud Blocks).
  - **Stage 4**: Settlement confirmation, raw webhook/intent inspector, and downloadable invoice receipt.
- **1-Click Injectable Sandbox Test Cards**:
  - `4242 4242 4242 4242`: Standard Immediate Settlement (200 OK)
  - `4000 0002 0000 0002`: 3D Secure OTP Challenge Trigger (Hint: `777999`)
  - `4000 0000 0000 0069`: Card Declined (`do_not_honor`)
  - `4000 0000 0000 0127`: Insufficient Funds
  - `4000 0000 0000 0005`: Radar Anti-Fraud Block

### 4. 📦 Backend Inventory Adjustment Logic Paths
- **Atomic Stock Deduction**: Automatically decrements product inventory upon successful payment authorization, rejecting any race conditions or overselling.
- **Immutable Inventory Audit Trail (`inventory_logs`)**: Records timestamp, product name, change amount, previous stock &rarr; new stock, and reason (`ORDER_CHECKOUT`, `ADMIN_ADJUSTMENT`, `ORDER_REFUND`).
- **Restock Logic Paths**: Refunding an order atomically restores the purchased quantities back to active inventory with a corresponding `ORDER_REFUND` audit log entry.
- **Operator & Sandbox Debug Console**: Live matrix allowing inline stock adjustments, instant restocks, and raw Stripe payload inspection.

---

## 🚀 Getting Started

### 1. Run Development Server
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

### 2. Run Automated Test Suite
```bash
node test_suite.js
```

### 3. Build Production Bundle
```bash
npm run build
```

---

## 🔑 Pre-Configured Demo Accounts

| Account Role | Email | Default Password |
| :--- | :--- | :--- |
| **Admin (Operator)** | `admin@vortexapex.io` | `ApexSecure2026!` |
| **Customer (Netrunner)** | `netrunner@matrix.io` | `ApexSecure2026!` |

*(Both accounts can be switched with 1-click in the UI via the "FAST DEMO PROFILES" section in the Sign In modal).*
