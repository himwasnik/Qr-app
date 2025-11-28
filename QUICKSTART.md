# Quick Start Guide

Get your QR Menu SaaS running in 10 minutes!

## Step 1: Install Dependencies (3 minutes)

```bash
# Backend
cd backend
npm install

# Web Admin
cd ../web-admin
npm install
```

**Note:** Mobile app development will be integrated in a later phase. Currently supporting web-based only.

## Step 2: Configure Environment (2 minutes)

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` - **Minimum required**:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=qr_menu_saas
JWT_SECRET=any_random_32_character_string_here
```

**For full features, also add:**
- Stripe keys (for subscriptions)
- AWS S3 credentials (for image uploads)

### Web Admin

```bash
cd ../web-admin
cp .env.example .env
```

Content should be:
```env
VITE_API_URL=http://localhost:5000/api
```

## Step 3: Setup Database (2 minutes)

```bash
# Create database
psql -U postgres
CREATE DATABASE qr_menu_saas;
\q

# Run migrations
cd backend
npm run migrate
```

## Step 4: Start Development Servers (2 minutes)

Open 2 terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Web Admin:**
```bash
cd web-admin
npm run dev
```

## Step 5: Test It Out!

1. **Open web admin**: http://localhost:3000
2. **Register** a restaurant (you can skip Stripe for now)
3. **Create** some menu items
4. **View** QR code for your restaurant

## Without Stripe (Development)

If you want to test without Stripe:

1. Register a restaurant - it will fail at Stripe checkout
2. Manually update database:
   ```sql
   UPDATE restaurants SET subscription_status = 'active' WHERE id = '<your-restaurant-id>';
   ```
3. Now login and use all features

## With Stripe (Full Testing)

1. Create Stripe account: https://stripe.com
2. Get test API keys
3. Create a test product with monthly price
4. Add keys to backend `.env`
5. Install Stripe CLI: https://stripe.com/docs/stripe-cli
6. Run: `stripe listen --forward-to localhost:5000/api/webhooks/stripe`
7. Use test card: `4242 4242 4242 4242`

## Common Issues

### "Cannot connect to database"
- Check PostgreSQL is running: `pg_ctl status`
- Verify credentials in `.env`

### "Port 5000 already in use"
- Change `PORT=5001` in backend `.env`
- Update `VITE_API_URL` in web-admin `.env`

### Mobile app can't reach API
- Use your computer's IP instead of localhost
- Windows: `ipconfig` → IPv4 Address
- Mac/Linux: `ifconfig` → inet address
- Update `API_BASE_URL` in mobile app code

## Next Steps

Once everything is running:

1. Read full [README.md](./README.md) for production setup
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for going live
3. Configure Stripe properly for real subscriptions
4. Set up S3 for image uploads
5. Deploy to production!

## Need Help?

- Check the main README.md
- Review code comments
- Check logs in terminals
- Verify environment variables

---

Happy coding! 🚀
