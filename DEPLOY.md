# Quick Deploy Guide

## 🚀 Deploy Landing Page to Vercel (5 minutes)

### Option 1: Drag & Drop (Easiest)

1. Go to: https://vercel.com
2. Sign up (use GitHub - easiest)
3. Click "Add New Project"
4. Drag your `index.html` file
5. Click "Deploy"
6. Get URL: `yourname.vercel.app`

### Option 2: GitHub (Better for updates)

1. Create GitHub repo
2. Upload `index.html`
3. Go to vercel.com
4. Import GitHub repo
5. Deploy
6. Auto-updates when you push changes

## ⚙️ Important: Update Gateway URL

After deploying, you need to update the gateway URL in your landing page:

**If Gateway is Local:**
- Keep `DEMO_MODE = true` (works without gateway)
- Or deploy gateway to cloud (Railway, Render, Fly.io)

**If Gateway is in Cloud:**
- Update `FIREWALL_URL` in `index.html` to your gateway URL
- Example: `https://your-gateway.railway.app`

## 🎯 For Now: Demo Mode Works!

**Good news:** Your landing page demo works in demo mode without needing the gateway!

- Set `DEMO_MODE = true` (already done)
- Landing page works standalone
- Public can try demo
- No API key needed

**Deploy the landing page, then you're ready to start outreach!**

## 📋 Deployment Checklist

- [ ] Deploy to Vercel
- [ ] Get public URL
- [ ] Test demo works
- [ ] Update contact form email
- [ ] Share URL in outreach

**Then start getting customers!**

