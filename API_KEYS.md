# API Keys Documentation

## Created API Keys

### 1. Google Maps API Key
**Display Name**: OwnerScout Google Maps API Key  
**Key**: `AIzaSyDPaOEFB3P2IxGpc2FESIlVlCwbhdy3-UI`  
**Created**: 2026-02-07

**Restrictions**:
- ✅ `places-backend.googleapis.com` - Places Aggregate API
- ✅ `geocoding-backend.googleapis.com` - Geocoding API
- ✅ `places.googleapis.com` - Places API (New)

**Usage**: Restaurant prospecting, location search, place details

---

### 2. Gemini AI API Key
**Display Name**: OwnerScout Gemini AI Key  
**Key**: `AIzaSyBV24RVNhk5Xacv5xAVHVjTJpzcSiMRtuM`  
**Created**: 2026-02-07

**Restrictions**:
- ✅ `generativelanguage.googleapis.com` - Gemini AI API

**Usage**: Future AI-powered lead scoring and analysis

---

## Security Best Practices

### ✅ Implemented
- **API restrictions**: Each key limited to specific Google services only
- **Separate keys**: Different keys for different purposes (Maps vs AI)
- **Environment variables**: Keys stored in `.env.local` (gitignored)
- **No client exposure**: Keys used server-side only (Vite build-time injection)

### 🔒 Additional Recommendations

1. **Add HTTP referrer restrictions** (for production):
   ```bash
   gcloud alpha services api-keys update <KEY_ID> \
     --allowed-referrers="https://yourdomain.com/*"
   ```

2. **Add IP restrictions** (for backend services):
   ```bash
   gcloud alpha services api-keys update <KEY_ID> \
     --allowed-ips="YOUR_SERVER_IP"
   ```

3. **Set up quota alerts** in Google Cloud Console:
   - Navigate to APIs & Services → Quotas
   - Set alerts for 80% usage threshold

4. **Monitor usage**:
   ```bash
   gcloud alpha services api-keys get-key-string <KEY_ID> --format=json
   ```

5. **Rotate keys periodically** (every 90 days recommended)

---

## Managing Keys

### List all OwnerScout keys
```bash
gcloud alpha services api-keys list \
  --filter="displayName:OwnerScout" \
  --format="table(displayName,name,keyString)"
```

### Update key restrictions
```bash
# Add new service to existing key
gcloud alpha services api-keys update <KEY_ID> \
  --api-target=service=newservice.googleapis.com
```

### Delete a key
```bash
gcloud alpha services api-keys delete <KEY_ID>
```

### Get key details
```bash
gcloud alpha services api-keys describe <KEY_ID>
```

---

## Cost Monitoring

### Expected Costs (per 100 searches)

**Google Maps API**:
- Places Aggregate (count): $0.01 × 100 = $1.00
- Places Aggregate (places): $0.05 × 100 = $5.00
- Place Details: $0.017 × 5,000 = $85.00
- Geocoding: $0.005 × 100 = $0.50
- **Total**: ~$91.50 per 100 searches (50 restaurants each)

**Gemini AI** (future):
- Gemini 1.5 Flash: $0.075 per 1M input tokens
- Estimated: $0.10 per 100 lead analyses

### Set up billing alerts
1. Go to [Google Cloud Console](https://console.cloud.google.com/billing)
2. Select your billing account
3. Click "Budgets & alerts"
4. Create budget with threshold alerts

---

## Troubleshooting

### "API key not valid" error
- Verify key is copied correctly (no extra spaces)
- Check that required APIs are enabled
- Wait 1-2 minutes after key creation for propagation

### "This API project is not authorized" error
- Enable the specific API in Cloud Console
- Verify key restrictions include the required service

### Rate limit errors
- Check quotas in Cloud Console
- Request quota increase if needed
- Implement exponential backoff in code

---

## Key IDs (for management)

- **Google Maps Key**: `projects/458587811092/locations/global/keys/e0f7f1e7-a50f-4ff6-82dc-4c4ace52cb2c`
- **Gemini AI Key**: `projects/458587811092/locations/global/keys/a21dda12-7b6f-4585-b1ac-78433a768aca`
