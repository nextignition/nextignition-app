# Automatic Deployment Setup

This project is configured for automatic deployment to Vercel when you push to GitHub.

## 🚀 Two Deployment Methods

### Method 1: Vercel GitHub Integration (Recommended - Already Set Up)

Vercel is already connected to your GitHub repository. This means:
- ✅ **Automatic deployments** on every push to `main` branch
- ✅ **Preview deployments** for pull requests
- ✅ **Zero configuration** needed

**How it works:**
1. Push code to `main` branch on GitHub
2. Vercel automatically detects the push
3. Builds and deploys your app
4. Your app is live at: https://nextignition-app.vercel.app

**To verify it's working:**
- Go to https://vercel.com/nextignitions-projects/nextignition-app
- Check the "Deployments" tab
- You should see automatic deployments when you push

### Method 2: GitHub Actions (Alternative)

If you want more control, you can use the GitHub Actions workflow.

**Setup Steps:**

1. **Add GitHub Secrets:**
   Go to: https://github.com/nextignition/nextignition-app/settings/secrets/actions

   Add these secrets:
   - `VERCEL_TOKEN`: `xXupQaUOPzTukKgWciHMtf8f`
   - `VERCEL_ORG_ID`: `team_MKtHJmpoptsFq2geA3BrWRfj`
   - `VERCEL_PROJECT_ID`: `prj_REYsdqGELAhxp0RL5S94pHwZoaRt`

2. **The workflow will automatically:**
   - Deploy to production on push to `main` branch
   - Create preview deployments for pull requests

## 📋 Project Information

- **Project Name:** nextignition-app
- **Production URL:** https://nextignition-app.vercel.app
- **GitHub Repo:** https://github.com/nextignition/nextignition-app
- **Vercel Project:** https://vercel.com/nextignitions-projects/nextignition-app

## 🔧 Manual Deployment

If you need to deploy manually:

```bash
vercel --prod
```

## 📝 Notes

- The `.vercelignore` file excludes large files from uploads
- The `vercel.json` configures the build process
- Builds use `expo export -p web` to create the web bundle



