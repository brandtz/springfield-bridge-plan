# 🌉 Springfield Bridge Plan Website

**Building a bridge, not burning one.**

A community-driven petition website to support an alternative budget solution for Springfield School District.

---

## 🚀 Quick Start

### Option 1: Deploy to Netlify (Recommended - Free & Fast)

1. **Create a GitHub Repository**
   ```bash
   cd board_signatures
   git init
   git add .
   git commit -m "Initial commit: Springfield Bridge Plan website"
   ```

2. **Push to GitHub**
   - Create a new repository at [github.com/new](https://github.com/new)
   - Name it `springfield-bridge-plan`
   - Follow the instructions to push your local repo

3. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com) and sign up/login
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account
   - Select your `springfield-bridge-plan` repository
   - Build settings: Leave defaults (no build command needed)
   - Click "Deploy site"
   - Your site will be live in ~1 minute!

4. **Add Custom Domain**
   - In Netlify, go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter `springfieldbridgeplan.org`
   - Follow DNS instructions to point your domain

### Option 2: Deploy to GitHub Pages (Also Free)

1. Push your code to GitHub (same as above)
2. Go to repository Settings → Pages
3. Source: Deploy from a branch → `main` → `/ (root)`
4. Your site will be at `yourusername.github.io/springfield-bridge-plan`

---

## 📝 Setting Up Signature Collection (Google Sheets)

### Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it "Springfield Bridge Plan Signatures"

### Step 2: Add the Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Copy the entire contents of `google-apps-script.js` from this project
4. Paste it into the Apps Script editor
5. Click **Save** (💾 icon or Ctrl+S)
6. Name the project "Bridge Plan Signatures"

### Step 3: Deploy the Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Configure:
   - Description: "Signature Collection"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Click **Authorize access** and follow the prompts
6. **Copy the Web App URL** (looks like `https://script.google.com/macros/s/XXXXX/exec`)

### Step 4: Connect to Your Website

1. Open `js/main.js` in your project
2. Find this line near the top:
   ```javascript
   GOOGLE_SHEETS_URL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL',
   ```
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` with your Web App URL
4. Commit and push the change - your site will auto-update!

---

## 🌐 Domain Registration

To register `springfieldbridgeplan.org`:

1. **Namecheap** (Recommended): [namecheap.com](https://namecheap.com) - ~$12/year
2. **Google Domains**: [domains.google](https://domains.google) - ~$12/year
3. **Cloudflare**: [cloudflare.com/products/registrar](https://cloudflare.com/products/registrar) - At cost

After registration, update DNS settings to point to Netlify (they'll provide instructions).

---

## 📁 Project Structure

```
board_signatures/
├── index.html              # Main website page
├── css/
│   └── styles.css          # All styling
├── js/
│   └── main.js             # Interactivity & form handling
├── assets/
│   └── favicon.svg         # Site icon
├── documents/
│   └── springfield-bridge-plan.pptx  # Original presentation
├── google-apps-script.js   # Code for Google Sheets integration
└── README.md               # This file
```

---

## ✏️ Customization Guide

### Changing Colors

Edit `css/styles.css` and update the CSS variables at the top:

```css
:root {
    --color-primary: #1e40af;      /* Main blue */
    --color-primary-dark: #1e3a8a; /* Darker blue */
    --color-primary-light: #3b82f6; /* Lighter blue */
    /* ... more colors */
}
```

### Changing Content

Edit `index.html` directly. Key sections:
- **Hero**: The main headline and intro
- **Problem**: "The Challenge We Face"
- **Solution**: "The Bridge Plan Solution"
- **How It Works**: Timeline steps
- **Benefits**: Cards showing who benefits
- **Testimonials**: Community quotes
- **Action**: The signature form

### Changing Signature Goal

Edit `js/main.js`:

```javascript
SIGNATURE_GOAL: 1000,  // Change to your target
```

---

## ✅ Pre-Launch Checklist

- [ ] Google Sheets connected and tested
- [ ] Custom domain registered and configured
- [ ] All content reviewed and approved
- [ ] Form tested end-to-end
- [ ] Mobile responsiveness verified
- [ ] Accessibility checked
- [ ] Share links tested (Facebook, Twitter, Email)
- [ ] Privacy statement reviewed

---

## 🔒 Privacy & Data

- Email addresses are only visible to sheet administrators
- Users can opt out of public name display
- Users can opt out of email updates
- No third-party tracking or analytics included
- Consider adding a privacy policy page for transparency

---

## 📞 Support

This website was created for the Springfield community. For technical issues, please contact the project maintainers.

---

**Remember: Building a bridge, not burning one. 🌉**

*Together, we can find a better path forward for our schools, our educators, and our community.*
