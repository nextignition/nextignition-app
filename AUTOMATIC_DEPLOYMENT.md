# 🚀 Automatic Deployment - Quick Setup Guide

Your NextIgnition app is now configured for **automatic deployment** when you push to GitHub!

## ✅ What's Already Set Up

1. **Vercel GitHub Integration** - Connected and ready
2. **GitHub Actions Workflow** - Created at `.github/workflows/deploy.yml`
3. **Vercel Configuration** - `vercel.json` is configured

## 🎯 How It Works

### Option 1: Vercel Auto-Deploy (Recommended - Already Active)

**Vercel is already connected to your GitHub repo!** This means:

- ✅ Every push to `main` branch → **Automatic production deployment**
- ✅ Every pull request → **Automatic preview deployment**
- ✅ Zero configuration needed - it just works!

**Your live site:** https://nextignition-app.vercel.app

**To verify:**
1. Make a small change to your code
2. Commit and push to GitHub: `git push origin main`
3. Check Vercel dashboard: https://vercel.com/nextignitions-projects/nextignition-app
4. You'll see a new deployment automatically start!

### Option 2: GitHub Actions (Alternative)

If you want to use GitHub Actions instead, add these secrets:

**Go to:** https://github.com/nextignition/nextignition-app/settings/secrets/actions

**Add these secrets:**
```
VERCEL_TOKEN = xXupQaUOPzTukKgWciHMtf8f
VERCEL_ORG_ID = team_MKtHJmpoptsFq2geA3BrWRfj
VERCEL_PROJECT_ID = prj_REYsdqGELAhxp0RL5S94pHwZoaRt
```

## 📋 Project Details

- **GitHub Repo:** https://github.com/nextignition/nextignition-app
- **Vercel Project:** https://vercel.com/nextignitions-projects/nextignition-app
- **Production URL:** https://nextignition-app.vercel.app
- **Project ID:** `prj_REYsdqGELAhxp0RL5S94pHwZoaRt`
- **Org ID:** `team_MKtHJmpoptsFq2geA3BrWRfj`

## 🔄 Workflow

```
1. Make changes to your code
2. Commit: git commit -m "Your message"
3. Push: git push origin main
4. Vercel automatically:
   - Detects the push
   - Builds your app
   - Deploys to production
   - Your site is live! 🎉
```

## 🛠️ Manual Deployment (if needed)

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

## 📝 Notes

- The build uses `expo export -p web` to create the web bundle
- Large files are excluded via `.vercelignore`
- Preview deployments are created for pull requests
- Production deployments happen on push to `main` branch

## 🎉 You're All Set!

Just push to GitHub and your site will automatically deploy!



