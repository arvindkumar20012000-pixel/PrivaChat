# SecretCouples - End-to-End Encrypted Private Chat

A private, client-side end-to-end encrypted chat web application designed for maximum privacy, zero server history, and stealth camouflage modes.

## ✨ Features

- **256-bit AES-GCM Client Encryption**: All messages, photos, and voice notes are encrypted in the browser before transmission.
- **Zero Personal Identifiers**: Fully anonymous alias system without personal names or server logs.
- **Visible Secret Key with Eye Toggle**: Show, hide, and copy secret encryption keys at will.
- **1-Click Instant Invite**: Direct URL link with `#hash` passes credentials to your partner so they connect with zero manual typing.
- **Real-Time Synchronization**: Backed by Google Cloud Firebase Firestore for global instant delivery.
- **WhatsApp UI Themes**: WhatsApp Dark, WhatsApp Light, Midnight Dark, and System modes.
- **Stealth Camouflage**: Instantly disguises screen as a functioning Calculator or Study Notes.
- **PWA Ready**: Installable to Android & iOS home screen like a native mobile app.

---

## 🚀 Deploying to Vercel (Step-by-Step)

This repository is pre-configured with `vercel.json` for seamless deployment.

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit for Vercel deployment"
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** → **"Project"**.
3. Select your GitHub repository (`<YOUR_REPO_NAME>`).
4. Vercel will automatically detect:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Deploy"**.

Your app will be live on a secure `https://<your-project>.vercel.app` URL in less than 1 minute!

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
```
