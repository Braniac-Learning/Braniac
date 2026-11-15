# Quiz AI App - Frontend

This is the frontend part of the Quiz AI App. It's a static website that communicates with a separate backend API.

## 🚀 Deployment

### Quick Deploy Options:

1. **Netlify** (Recommended)
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop this entire `frontend` folder
   - Your site will be live instantly!

2. **Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub repo or upload the folder
   - Deploy!

3. **GitHub Pages**
   - Push this folder to a GitHub repo
   - Enable GitHub Pages in repo settings

## ⚙️ Configuration

**IMPORTANT**: After deploying the backend, you must update the API URL in `script.js`:

1. Open `script.js`
2. Find line 6: `const API_BASE_URL = 'https://your-backend-url-here.up.railway.app';`
3. Replace with your actual backend URL (e.g., from Railway, Render, etc.)
4. Redeploy the frontend

## 📁 Files Included:

- `index.html` - Main page
- `script.js` - All JavaScript logic (updated for separate backend)
- `style.css` - All styling
- `favicon.ico` - Site icon

## ✅ Features:

- ✅ AI Quiz Generation (via backend API)
- ✅ Document Upload & Processing
- ✅ Real-time Multiplayer (Socket.IO)
- ✅ Multiple Difficulty Levels
- ✅ Responsive Design
- ✅ Modern UI/UX

## 🔗 Backend

The backend must be deployed separately. See the `../backend/` folder for backend deployment instructions.
