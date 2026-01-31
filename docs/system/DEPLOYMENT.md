# Deployment Guide (Vercel + Convex)

## Overview

Family Hub deploys on Vercel and uses Convex for the production data layer.
Run a Convex deploy as part of the Vercel build so the schema and tables exist
in the production deployment.

## Vercel Configuration

### Build Command

Use the Convex deploy script so schema updates run before the frontend build:

```
npm run deploy:vercel
```

This script runs:

```
convex deploy --cmd "npm run build"
```

### Environment Variables (Production)

Set these in the Vercel project (Production environment):

- `CONVEX_DEPLOY_KEY` (Convex Dashboard → Project Settings → Production deploy key)
- `CONVEX_URL`
- `VITE_CONVEX_URL`
- `CONVEX_ADMIN_KEY`
- `CLERK_ISSUER_URL`
- `CLERK_JWT_AUDIENCE`
- `VITE_CLERK_PUBLISHABLE_KEY`

## Verification

After deployment:

1. Open the Convex Dashboard and switch to the Production deployment.
2. Confirm tables from `convex/schema.ts` exist.
3. Load the Vercel URL and verify authenticated pages load without errors.
# Household Hub - Deployment Guide

## Overview

Household Hub is designed to be deployed as a Progressive Web App (PWA) that can be installed on:
- **Fire Tablet** (kitchen wall mount)
- **Mobile phones** (for shopping lists on-the-go)
- **Any device** with a modern browser

## PWA Features

The app includes:
- ✅ Web App Manifest (for installation)
- ✅ Offline support via localStorage (data persists locally)
- ✅ Responsive design (works on tablets and phones)
- ✅ Standalone mode (no browser UI when installed)
- ✅ App shortcuts (quick access to Shopping, Chores, Meals)

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Why Vercel:**
- Free tier is generous
- Automatic HTTPS
- Global CDN
- Easy deployment from Git
- Perfect for PWAs

**Steps:**

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel auto-detects TanStack Start
   - Click "Deploy"
   - Done! Your app is live

3. **Configure Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `.output/public` (or check TanStack Start docs)
   - Install Command: `npm install`

4. **Get Your URL:**
   - Vercel provides: `your-app.vercel.app`
   - You can add a custom domain later

### Option 2: Netlify

**Steps:**

1. Push to GitHub (same as above)

2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect GitHub repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.output/public`
6. Deploy

### Option 3: Self-Hosted (VPS/Server)

**Requirements:**
- Node.js 18+ installed
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt is free)

**Steps:**

1. **Build the app:**
   ```bash
   npm install
   npm run build
   ```

2. **Serve the built files:**
   - TanStack Start outputs static files
   - Use any static file server (nginx, Apache, etc.)
   - Or use the preview server: `npm run preview`

3. **Configure nginx (example):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       root /path/to/.output/public;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## Installing on Devices

### Fire Tablet (Kitchen Wall)

**Important Notes:**
- Fire tablets run Fire OS (Android-based)
- Use **Silk Browser** (Fire's default browser) or install **Chrome/Firefox**
- PWAs work best in Chrome/Firefox on Fire tablets

**Steps:**

1. **Open the app in Chrome/Firefox:**
   - Navigate to your deployed URL
   - Example: `https://household-hub.vercel.app`

2. **Install the PWA:**
   - Chrome: Menu (3 dots) → "Install app" or "Add to Home screen"
   - Firefox: Menu → "Install" or "Add to Home screen"
   - Look for install prompt banner at bottom of screen

3. **Set up for wall mount:**
   - Install app on home screen
   - Open app in standalone mode
   - Set tablet to never sleep (Settings → Display → Sleep → Never)
   - Mount tablet on wall
   - Open Household Hub app
   - Bookmark or set as home screen default

**Pro Tips:**
- Use a Fire Tablet with a case that has a kickstand
- Consider a charging dock or always-plugged-in setup
- Set up auto-refresh if needed (can be added to app later)

### iPhone/iPad

**Steps:**

1. Open Safari browser
2. Navigate to your deployed URL
3. Tap the Share button (square with arrow)
4. Select "Add to Home Screen"
5. Customize name if desired
6. Tap "Add"
7. App icon appears on home screen
8. Tap to open in standalone mode

**Note:** iOS Safari has some PWA limitations, but core functionality works.

### Android Phone

**Steps:**

1. Open Chrome browser
2. Navigate to your deployed URL
3. Tap menu (3 dots) → "Install app" or "Add to Home screen"
4. Confirm installation
5. App icon appears on home screen
6. Tap to open in standalone mode

## Offline Functionality

**Current Implementation:**
- All data is stored in browser localStorage
- Works completely offline once loaded
- No server required for data storage
- Data syncs automatically when online

**Limitations:**
- Initial app load requires internet
- Updates require internet connection
- Each device has its own data (not synced between devices)

**Future Enhancement:**
- Could add cloud sync (Firebase, Supabase, etc.) for multi-device sync

## Testing PWA Installation

### Desktop (Chrome/Edge):

1. Open your deployed URL
2. Look for install icon in address bar (or menu)
3. Click "Install"
4. App opens in standalone window
5. Test offline: Turn off WiFi, app should still work

### Mobile:

1. Open URL in mobile browser
2. Look for install banner/prompt
3. Install to home screen
4. Open from home screen icon
5. Should open without browser UI

## Troubleshooting

### PWA Not Installing:

**Check:**
- ✅ App is served over HTTPS (required for PWA)
- ✅ manifest.json is accessible at `/manifest.json`
- ✅ Service worker is registered (if using one)
- ✅ Browser supports PWAs (Chrome, Firefox, Edge, Safari)

### Fire Tablet Issues:

**Problem:** Install option not showing
- **Solution:** Use Chrome or Firefox instead of Silk browser
- **Solution:** Enable "Unknown Sources" in Fire tablet settings if needed

**Problem:** App not staying open
- **Solution:** Disable sleep mode in Fire tablet settings
- **Solution:** Use a charging dock

### Data Not Persisting:

**Check:**
- ✅ localStorage is enabled in browser
- ✅ Not using private/incognito mode
- ✅ Browser storage not cleared

## Security Considerations

**Current Setup:**
- All data stored locally (private to each device)
- No authentication required
- No server-side data storage

**For Family Use:**
- Each device has its own data
- No cross-device sync (by design for privacy)
- If you want sync, add authentication + cloud storage

## Custom Domain (Optional)

**Vercel:**
1. Go to project settings → Domains
2. Add your domain
3. Follow DNS instructions
4. SSL auto-configured

**Netlify:**
1. Site settings → Domain management
2. Add custom domain
3. Configure DNS
4. SSL auto-configured

## Performance Tips

**For Kitchen Tablet:**
- Use a Fire Tablet 8 or newer (better performance)
- Keep app open (don't close it)
- Clear browser cache periodically if issues arise
- Consider dedicated tablet just for this app

**For Mobile:**
- App is lightweight and fast
- Works well on any modern phone
- Shopping list loads instantly

## Maintenance

**Updates:**
- Push changes to GitHub
- Vercel/Netlify auto-deploys
- Users get updates on next app open
- No app store approval needed!

**Monitoring:**
- Check Vercel/Netlify dashboard for errors
- Monitor usage/bandwidth
- Check browser console for errors on devices

## Next Steps

1. **Deploy to Vercel/Netlify** (easiest option)
2. **Test installation** on your phone first
3. **Install on Fire tablet** once confirmed working
4. **Mount tablet** in kitchen
5. **Share URL** with family members for their phones

## Support

If you encounter issues:
- Check browser console for errors
- Verify HTTPS is working
- Test in different browsers
- Check manifest.json is accessible
- Ensure build completed successfully

---

**Remember:** This is a PWA, so it works like a native app but is actually a website. No app store needed!
