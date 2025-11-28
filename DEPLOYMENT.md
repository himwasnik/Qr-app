# Deployment Guide - QR Menu SaaS

## Quick Deployment Checklist

- [ ] PostgreSQL database setup
- [ ] Stripe account configured
- [ ] S3 bucket created
- [ ] Backend deployed
- [ ] Web admin deployed
- [ ] Environment variables configured
- [ ] Stripe webhooks configured
- [ ] Mobile app built and submitted

## 1. Database Setup (Production)

### Option A: Render PostgreSQL (Free tier available)

1. Go to https://render.com
2. Create PostgreSQL database
3. Copy connection details
4. Update backend `.env`:
   ```
   DB_HOST=<hostname>
   DB_PORT=5432
   DB_NAME=<database>
   DB_USER=<user>
   DB_PASSWORD=<password>
   ```

### Option B: Supabase (Free generous limits)

1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Run migrations manually or via SQL editor

## 2. Backend Deployment

### Render (Recommended - Free tier)

1. Push code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect GitHub repository
4. Settings:
   - **Name**: qr-menu-api
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Plan**: Free (or Starter for production)

5. Add Environment Variables (all from backend/.env):
   ```
   NODE_ENV=production
   PORT=5000
   API_BASE_URL=https://your-app.onrender.com
   FRONTEND_URL=https://your-admin.vercel.app
   DB_HOST=...
   DB_PORT=5432
   DB_NAME=...
   DB_USER=...
   DB_PASSWORD=...
   JWT_SECRET=...
   STRIPE_SECRET_KEY=...
   STRIPE_WEBHOOK_SECRET=...
   STRIPE_PRICE_ID=...
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=...
   AWS_S3_BUCKET=...
   CDN_BASE_URL=...
   ```

6. Click "Create Web Service"
7. Wait for deployment
8. Copy your backend URL (e.g., `https://qr-menu-api.onrender.com`)

### Alternative: Railway

1. Go to https://railway.app
2. Create new project
3. Deploy from GitHub
4. Add PostgreSQL plugin
5. Add environment variables
6. Deploy

## 3. Web Admin Deployment

### Vercel (Recommended - Free)

1. Go to https://vercel.com
2. Import Git Repository
3. Select `web-admin` folder as root directory
4. Framework: Vite
5. Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
6. Deploy
7. Copy deployment URL (e.g., `https://qr-menu-admin.vercel.app`)

### Alternative: Netlify

1. Build locally: `cd web-admin && npm run build`
2. Drag `dist/` folder to Netlify
3. Set environment variable in site settings
4. Configure redirects for SPA routing

## 4. S3 Bucket Setup

### AWS S3

1. Go to AWS Console → S3
2. Create bucket (e.g., `qr-menu-uploads`)
3. Set permissions:
   - Uncheck "Block all public access"
   - Enable public read for objects
4. Add CORS configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
5. Create IAM user with S3 permissions
6. Copy Access Key ID and Secret Access Key

### Alternative: DigitalOcean Spaces (Cheaper)

1. Go to DigitalOcean → Spaces
2. Create Space
3. Set to public read
4. Copy endpoint URL and credentials
5. Update backend `.env`:
   ```
   S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
   AWS_S3_BUCKET=your-space-name
   CDN_BASE_URL=https://your-space-name.nyc3.digitaloceanspaces.com
   ```

## 5. Stripe Configuration (Production)

### Enable Production Mode

1. Toggle to "Live mode" in Stripe Dashboard
2. Create new Product and Price in live mode
3. Get live API keys:
   - Go to Developers → API Keys
   - Copy **Live Secret Key**
   - Update backend production `.env`

### Setup Production Webhooks

1. Go to Developers → Webhooks
2. Add endpoint: `https://your-backend-url.onrender.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret
5. Update backend `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

## 6. Test Production Setup

### Test Registration Flow

1. Go to your web admin: `https://your-admin.vercel.app/register`
2. Register a test restaurant
3. Complete Stripe checkout (use test card: 4242 4242 4242 4242)
4. Verify:
   - Restaurant created in database
   - Stripe customer created
   - Subscription active
   - Can login to dashboard

### Test Menu Creation

1. Login to dashboard
2. Create categories
3. Add menu items
4. Upload photos
5. Download QR code

### Test Public Menu

1. Visit: `https://your-backend-url.onrender.com/menu/restaurant-slug`
2. Verify menu loads correctly
3. Test QR code scanning with mobile

## 7. Mobile App Build & Deployment

### Prerequisites

```bash
npm install -g eas-cli
eas login
```

### Update API URL

Edit `mobile-app/screens/MenuViewerScreen.js`:

```javascript
const API_BASE_URL = 'https://your-backend-url.onrender.com/api';
```

### Configure EAS

```bash
cd mobile-app
eas build:configure
```

### Build for Android

```bash
eas build --platform android --profile production
```

This creates an AAB file for Google Play Store.

### Build for iOS

```bash
eas build --platform ios --profile production
```

Requires Apple Developer Account ($99/year).

### Submit to Play Store

1. Create app in Google Play Console
2. Upload AAB file
3. Fill out store listing:
   - Title: "QR Menu Scanner"
   - Description: "Scan QR codes to view restaurant menus"
   - Screenshots (use Android emulator)
   - Privacy policy URL
   - Content rating
4. Submit for review (2-3 days)

### Submit to App Store

1. Create app in App Store Connect
2. Use EAS Submit or Transporter to upload
3. Fill out app information
4. Screenshots (use iOS simulator)
5. Submit for review (1-2 days)

## 8. DNS and Custom Domain (Optional)

### Backend Custom Domain

1. Buy domain (Namecheap, GoDaddy)
2. In Render/Railway, add custom domain
3. Add DNS records as instructed
4. Update `API_BASE_URL` in all `.env` files

### Admin Custom Domain

1. In Vercel, add custom domain
2. Update DNS records
3. Update `FRONTEND_URL` in backend `.env`

## 9. Monitoring and Maintenance

### Set Up Logging

- Use service logs (Render, Railway)
- Consider Sentry for error tracking
- Set up Stripe webhook monitoring

### Database Backups

- Enable automated backups in database provider
- Test restore procedure

### SSL Certificates

- Automatically handled by Render/Vercel
- Verify HTTPS is working

## 10. Post-Launch Checklist

- [ ] All environment variables configured correctly
- [ ] Database migrations run successfully
- [ ] Stripe webhooks receiving events (test with payment)
- [ ] Image uploads working to S3
- [ ] QR codes generating correctly
- [ ] Public menu accessible
- [ ] Mobile app published to stores
- [ ] SSL certificates active
- [ ] Domain configured (if custom)
- [ ] Backups scheduled

## Cost Estimates (Monthly)

### Minimum (Free Tier)
- Render Backend: $0 (with sleep after 15min inactivity)
- Render PostgreSQL: $0 (limited)
- Vercel: $0
- DigitalOcean Spaces: $5
- **Total: $5/month**

### Production (Recommended)
- Render Starter: $7
- Render PostgreSQL: $7
- Vercel: $0
- DigitalOcean Spaces: $5
- Stripe fees: ~2.9% + 30¢ per transaction
- **Total: ~$19/month + transaction fees**

### Scale (100+ restaurants)
- Render Standard: $25
- Render PostgreSQL: $20
- Vercel Pro: $20
- DigitalOcean Spaces: $5
- **Total: ~$70/month**

## Troubleshooting Deployment

### Backend Not Starting

- Check logs in Render/Railway
- Verify all environment variables set
- Test database connection
- Check Node version compatibility

### Webhook Not Receiving Events

- Verify webhook URL is correct
- Check endpoint is publicly accessible
- Verify webhook secret matches
- Test with Stripe CLI locally first

### Images Not Uploading

- Verify S3 credentials
- Check bucket permissions (public read)
- Check CORS configuration
- Test with AWS CLI: `aws s3 ls`

### Mobile App Build Fails

- Check `app.json` configuration
- Verify bundle identifier is unique
- Check for missing assets (icon.png, splash.png)
- Review EAS build logs

## Support Resources

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Stripe Docs: https://stripe.com/docs
- Expo/EAS Docs: https://docs.expo.dev
- AWS S3 Docs: https://docs.aws.amazon.com/s3/

---

**Ready to Deploy!** Follow this guide step-by-step and you'll have a production-ready QR Menu SaaS running in a few hours.
