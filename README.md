# QR Menu SaaS - Complete Production-Ready System

A full-stack SaaS application that enables restaurants to create digital menus accessible via QR codes. Supports 100+ restaurants with multi-tenant architecture, Stripe recurring billing, and includes a web admin dashboard.

**Current Phase:** Web-based only (Mobile app development to be integrated in a later phase)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Database Setup](#database-setup)
- [Stripe Configuration](#stripe-configuration)
- [Deployment](#deployment)
- [Mobile App Deployment](#mobile-app-deployment)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### Backend API
- ✅ RESTful API with Express.js
- ✅ PostgreSQL database with multi-tenant architecture
- ✅ JWT authentication
- ✅ Stripe recurring subscription billing (₹500/month)
- ✅ Webhook handling for subscription events
- ✅ QR code generation (PNG & SVG)
- ✅ S3-compatible image upload
- ✅ Input validation and error handling

### Web Admin Dashboard
- ✅ Restaurant registration with Stripe checkout
- ✅ Login/authentication
- ✅ Menu item CRUD with image upload
- ✅ Category management
- ✅ QR code download
- ✅ Subscription management (Stripe billing portal)
- ✅ Restaurant settings
- ✅ Responsive design with Tailwind CSS

### Mobile App
- ✅ QR code scanner (Expo Camera)
- ✅ Menu viewer with categories
- ✅ Item photos and descriptions
- ✅ Dietary indicators (vegetarian, vegan, gluten-free)
- ✅ Allergen warnings
- ✅ Pull-to-refresh
- ✅ iOS and Android compatible
- ✅ Ready for Play Store and App Store submission

## 🛠 Tech Stack

### Backend
- Node.js v18+
- Express.js
- PostgreSQL
- JWT for authentication
- Stripe for payments
- AWS S3 (or compatible) for storage
- QRCode library

### Web Admin
- React 18
- Vite
- React Router v6
- Axios
- Tailwind CSS
- Lucide React Icons

### Mobile App
- React Native
- Expo SDK 51
- Expo Camera / Barcode Scanner
- React Navigation

## 📁 Project Structure

```
qr-menu-saas/
├── backend/
│   ├── server.js                 # Main server file
│   ├── db.js                     # Database connection
│   ├── package.json
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── restaurants.js       # Restaurant & QR routes
│   │   ├── menu.js              # Menu CRUD routes
│   │   └── webhooks.js          # Stripe webhooks
│   ├── middleware/
│   │   ├── auth.js              # JWT middleware
│   │   └── validator.js         # Validation middleware
│   ├── utils/
│   │   ├── s3Upload.js          # Image upload utility
│   │   └── stripe.js            # Stripe utilities
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_seed_data.sql
│       └── run-migrations.js
├── web-admin/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── DashboardHome.jsx
│   │       ├── MenuManager.jsx
│   │       ├── Categories.jsx
│   │       ├── QRCodePage.jsx
│   │       ├── SubscriptionPage.jsx
│   │       └── RestaurantSettings.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── mobile-app/
    ├── App.js
    ├── app.json
    ├── eas.json                 # Expo Application Services config
    ├── package.json
    ├── screens/
    │   ├── QRScannerScreen.js
    │   └── MenuViewerScreen.js
    └── .env.example
```

## 📦 Prerequisites

- Node.js v18 or higher
- PostgreSQL v12 or higher
- npm or yarn
- Stripe account (test mode for development)
- AWS S3 bucket or S3-compatible storage (DigitalOcean Spaces, Backblaze B2)
- Expo CLI (for mobile app): `npm install -g expo-cli eas-cli`

## 🚀 Installation

### 1. Clone/Navigate to Project

```bash
cd C:\Users\HimanshuWasnik\Downloads\qr-menu-saas
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

### 3. Web Admin Setup

```bash
cd ../web-admin
npm install
cp .env.example .env
# Edit .env with API URL
```

### 4. Mobile App Setup

```bash
cd ../mobile-app
npm install
cp .env.example .env
# Edit .env with API URL
```

## ⚙️ Configuration

### Backend (.env)

Edit `backend/.env` with your settings:

```env
PORT=5000
NODE_ENV=development
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=qr_menu_saas
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_monthly_price_id

AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=qr-menu-uploads
CDN_BASE_URL=https://qr-menu-uploads.s3.amazonaws.com
```

### Web Admin (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

### Mobile App (.env)

```env
API_BASE_URL=http://localhost:5000/api
```

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
psql -U postgres
CREATE DATABASE qr_menu_saas;
\q
```

### 2. Run Migrations

```bash
cd backend
npm run migrate
```

This will create all tables, indexes, and triggers.

## 💳 Stripe Configuration

### 1. Create Stripe Account

Go to https://stripe.com and create an account.

### 2. Create a Product and Price

1. Go to Stripe Dashboard → Products
2. Click "Add Product"
3. Name: "QR Menu Monthly Subscription"
4. Price: ₹500 or $7 (recurring monthly)
5. Copy the **Price ID** (starts with `price_`)
6. Add Price ID to `STRIPE_PRICE_ID` in backend `.env`

### 3. Get API Keys

1. Go to Developers → API Keys
2. Copy **Secret Key** to `STRIPE_SECRET_KEY`
3. For webhooks (see next step)

### 4. Configure Webhooks

#### Development (using Stripe CLI)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5000/api/webhooks/stripe
# Copy the webhook secret (whsec_...) to STRIPE_WEBHOOK_SECRET
```

#### Production

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy webhook secret to production `.env`

## 🏃 Running the Application

### Development Mode

#### Terminal 1: Backend

```bash
cd backend
npm run dev
```

Server runs on http://localhost:5000

#### Terminal 2: Web Admin

```bash
cd web-admin
npm run dev
```

Admin dashboard runs on http://localhost:3000

#### Terminal 3: Mobile App

```bash
cd mobile-app
npm start
# Press 'a' for Android or 'i' for iOS
# Or scan QR code with Expo Go app
```

### Production Mode

#### Backend

```bash
cd backend
NODE_ENV=production npm start
```

#### Web Admin

```bash
cd web-admin
npm run build
npm run preview
```

Deploy the `dist/` folder to hosting (Vercel, Netlify, etc.)

## 🚢 Deployment

### Backend Deployment (Render, Heroku, Railway, AWS)

#### Option 1: Render

1. Create new Web Service
2. Connect GitHub repo
3. Build Command: `cd backend && npm install`
4. Start Command: `cd backend && node server.js`
5. Add environment variables from `.env`
6. Add PostgreSQL database (or use external)

#### Option 2: Heroku

```bash
# Install Heroku CLI
heroku login
heroku create qr-menu-api
heroku addons:create heroku-postgresql:mini
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
# ... (set all env vars)
git push heroku main
```

### Web Admin Deployment

#### Vercel (Recommended)

```bash
cd web-admin
npm install -g vercel
vercel
# Follow prompts, set VITE_API_URL to production API
```

#### Netlify

```bash
cd web-admin
npm run build
# Drag and drop `dist` folder to Netlify
# Or connect GitHub and auto-deploy
```

### Database (Production)

Use managed PostgreSQL:
- **Render**: Built-in PostgreSQL
- **AWS RDS**: PostgreSQL instance
- **DigitalOcean**: Managed Databases
- **Supabase**: Free PostgreSQL with generous limits

## 📱 Mobile App Deployment

### Prerequisites

1. Create Expo account: https://expo.dev/signup
2. Install EAS CLI: `npm install -g eas-cli`
3. Login: `eas login`

### Configure App

Edit `mobile-app/app.json`:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "ios": {
      "bundleIdentifier": "com.yourcompany.qrmenu"
    },
    "android": {
      "package": "com.yourcompany.qrmenu"
    }
  }
}
```

### Build for Android (Play Store)

```bash
cd mobile-app
eas build --platform android --profile production
# Wait for build to complete (10-15 mins)
# Download AAB file from expo.dev
```

### Build for iOS (App Store)

```bash
cd mobile-app
eas build --platform ios --profile production
# Requires Apple Developer account ($99/year)
```

### Submit to Stores

#### Android Play Store

1. Go to https://play.google.com/console
2. Create new app
3. Upload AAB file
4. Fill out app details, screenshots
5. Submit for review

```bash
# Or use EAS Submit
eas submit --platform android
```

#### iOS App Store

1. Go to https://appstoreconnect.apple.com
2. Create new app
3. Upload IPA via Transporter or EAS

```bash
eas submit --platform ios
```

### Update API URL for Production

Edit `mobile-app/screens/MenuViewerScreen.js`:

```javascript
const API_BASE_URL = 'https://your-production-api.com/api';
```

## 📚 API Documentation

### Authentication

#### POST /api/auth/register
Register new restaurant with Stripe subscription

**Body:**
```json
{
  "restaurantName": "The Tasty Corner",
  "email": "owner@restaurant.com",
  "password": "secure123",
  "phone": "+1-555-0100",
  "address": "123 Main St"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "token": "jwt_token",
  "user": { ... },
  "restaurant": { ... },
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

#### POST /api/auth/login
Login with credentials

**Body:**
```json
{
  "email": "owner@restaurant.com",
  "password": "secure123"
}
```

### Restaurants

#### GET /api/restaurants/:slug/public
Get public menu (no auth required)

#### GET /api/restaurants/:slug/qr.png
Download QR code as PNG

#### GET /api/restaurants/:slug/qr.svg
Download QR code as SVG

#### GET /api/restaurants/me
Get current restaurant (requires auth)

#### PUT /api/restaurants/me
Update restaurant details

#### POST /api/restaurants/billing-portal
Get Stripe billing portal URL

### Menu

#### GET /api/menu/categories
Get all categories

#### POST /api/menu/categories
Create category

#### PUT /api/menu/categories/:id
Update category

#### DELETE /api/menu/categories/:id
Delete category

#### GET /api/menu/items
Get all menu items

#### POST /api/menu/items
Create menu item

#### PUT /api/menu/items/:id
Update menu item

#### DELETE /api/menu/items/:id
Delete menu item

#### POST /api/menu/items/:id/upload-photo
Upload photo for menu item (multipart/form-data)

### Webhooks

#### POST /api/webhooks/stripe
Stripe webhook endpoint (raw body required)

## 🔧 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo service postgresql status  # Linux
brew services list  # Mac

# Test connection
psql -h localhost -U postgres -d qr_menu_saas
```

### Stripe Webhook Not Working

- In development, use Stripe CLI: `stripe listen --forward-to localhost:5000/api/webhooks/stripe`
- Verify webhook secret matches in `.env`
- Check webhook endpoint is accessible publicly (in production)

### Image Upload Fails

- Verify AWS credentials in `.env`
- Check S3 bucket exists and has public read permissions
- Test bucket access with AWS CLI: `aws s3 ls s3://your-bucket`

### Mobile App Can't Connect to API

- If using localhost, use your computer's IP address instead
- Ensure backend is running and accessible
- Check firewall isn't blocking connections
- For Android emulator: use `10.0.2.2` instead of `localhost`
- For iOS simulator: use `localhost` or your IP

### QR Code Doesn't Scan

- Ensure restaurant subscription is `active` in database
- Check QR URL format is correct: `https://domain.com/menu/restaurant-slug`
- Test URL in browser first

## 📊 Subscription Status Management

The system automatically tracks subscription status through Stripe webhooks:

- **active**: Subscription is paid and current
- **past_due**: Payment failed, subscription in grace period
- **canceled**: Subscription was canceled
- **inactive**: Initial state before first payment

When subscription is not "active", the admin dashboard shows a warning and blocks menu editing.

### Viewing Subscription Renewal Date

The subscription renewal date is managed by Stripe. Restaurant owners can:
1. Go to Dashboard → Subscription
2. Click "Manage Billing" button
3. View next billing date in Stripe portal

To display renewal date in your app, you can:
- Fetch subscription details from Stripe API
- Store `current_period_end` in database via webhooks
- Display in admin dashboard

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Configure `.env` files
3. ✅ Setup PostgreSQL database
4. ✅ Run migrations
5. ✅ Configure Stripe
6. ✅ Test locally
7. ✅ Deploy backend
8. ✅ Deploy web admin
9. ✅ Build mobile app
10. ✅ Submit to app stores
11. ✅ Configure production webhooks
12. ✅ Launch! 🚀

## 📄 License

MIT License - Feel free to use for commercial or personal projects.

## 🤝 Support

For issues or questions:
- Check this README thoroughly
- Review code comments
- Check Stripe documentation: https://stripe.com/docs
- Check Expo documentation: https://docs.expo.dev

---

Built with ❤️ for restaurants worldwide
"# Qr-app" 
