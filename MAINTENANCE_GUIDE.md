# Website Maintenance Guide

## Why Websites Degrade Over Time

Even without code changes, websites can break due to external factors:

### 1. External API Updates
- **Issue**: Google/OpenAI deprecate AI models without warning
- **Solution**: 
  - Monitor API provider announcements
  - Use latest stable models (e.g., `gemini-2.0-flash-exp`)
  - Implement fallback systems
  - Set up alerts for API errors

### 2. Dependency Vulnerabilities
- **Issue**: Security patches auto-update, causing breaking changes
- **Solution**:
  ```bash
  # Check outdated packages monthly
  npm outdated
  
  # Update with caution
  npm update --save
  
  # Audit for vulnerabilities
  npm audit fix
  ```

### 3. Free Hosting Limitations
- **Issue**: Render free tier sleeps after 15min, causing cold starts
- **Solutions**:
  - Upgrade to paid tier ($7/month) for always-on
  - Use cron job to ping every 10min (keep-alive)
  - Add loading states for cold start delays

### 4. Database Performance
- **Issue**: MongoDB collections grow large, queries slow down
- **Solution**:
  ```bash
  # Archive old data quarterly
  # Add indexes on frequently queried fields
  # Clean up test/duplicate data
  ```

### 5. Browser Cache Conflicts
- **Issue**: Users have old cached JS/CSS
- **Solution**:
  - Version assets: `script.js?v=2.0.1`
  - Set proper cache headers
  - Use cache-busting on deployments

## Monthly Maintenance Checklist

### Week 1: Monitoring
- [ ] Check Render logs for errors
- [ ] Review API usage/rate limits
- [ ] Test all quiz generation paths
- [ ] Monitor response times

### Week 2: Dependencies
- [ ] Run `npm audit` for security issues
- [ ] Check for deprecated packages
- [ ] Update non-breaking changes
- [ ] Test after updates

### Week 3: Database
- [ ] Review MongoDB storage usage
- [ ] Check for duplicate/corrupted data
- [ ] Optimize slow queries
- [ ] Backup user data

### Week 4: Performance
- [ ] Test cold start times
- [ ] Check frontend loading speed
- [ ] Clear old logs
- [ ] Review error rates

## Emergency Fixes

### API 404 Errors (Model Deprecated)
```javascript
// Update model name in server.js
gemini-1.5-flash → gemini-2.0-flash-exp
gemini-1.5-pro → gemini-2.0-pro-exp
```

### Database Connection Timeout
```javascript
// Add retry logic in MongoDB connection
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### Render Cold Start Too Slow
```bash
# Add health check endpoint
app.get('/health', (req, res) => res.json({ status: 'OK' }));

# Use UptimeRobot to ping every 5 minutes
```

## Alert System Setup

1. **Email Alerts for Errors**
   - Use Render webhook notifications
   - Set up error rate thresholds
   - Get notified when API fails

2. **Uptime Monitoring**
   - UptimeRobot (free): Check every 5min
   - Pingdom (paid): More detailed monitoring
   - Better Stack (paid): Advanced error tracking

3. **API Usage Monitoring**
   - Google Cloud Console: Check Gemini API usage
   - Set spending alerts
   - Monitor rate limit warnings

## Version Control Best Practices

```bash
# Tag stable releases
git tag -a v1.0.0 -m "Stable release with document scanning"
git push origin v1.0.0

# Can rollback quickly if needed
git checkout v1.0.0
```

## Current System Status (as of Feb 2026)

✅ **Working Systems:**
- AI-powered document scanning
- Topic & document quiz generation
- Achievement tracking
- MongoDB user data
- Socket.IO multiplayer

⚠️  **Known Issues:**
- Render free tier cold starts (50s delay)
- Gemini API rate limits (need delays)
- Large PDFs (>10MB) may timeout

🔄 **Recent Fixes:**
- Jan 28: Updated to gemini-2.0-flash-exp
- Jan 28: Fixed summary generation
- Jan 28: Added AI document classification

## Contact & Support

If issues persist:
1. Check Render logs: https://dashboard.render.com
2. Review GitHub issues
3. Test with mock data (works offline)
4. Rollback to last stable commit
