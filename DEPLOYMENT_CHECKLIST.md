# Deployment Checklist - FASE 3

## ✅ Backend API (Render)

### Current Status: DEPLOYED ✅
- URL: https://ownly-api.onrender.com
- Status: Running

### Required Update
The API `.env` file has been updated with production settings. You need to update the environment variables on Render:

1. Go to Render Dashboard: https://dashboard.render.com/
2. Select your `ownly-api` service
3. Go to "Environment" tab
4. Update these variables:

```
NODE_ENV=production
FRONTEND_URL=https://ownly-weld.vercel.app
```

5. Click "Save Changes"
6. Render will automatically redeploy

### Verify API is Working
```bash
curl https://ownly-api.onrender.com/health
```
Should return: `{"status":"ok","version":"1.0.0"}`

---

## ✅ Frontend (Vercel)

### Current Status: DEPLOYED ✅
- URL: https://ownly-weld.vercel.app

### Environment Variables Already Set
These are already configured in `.env.local` and will be used by Vercel:

```
VITE_OWNLY_API_URL=https://ownly-api.onrender.com
VITE_BATCH_PROCESSOR_ADDRESS=0x65ac8030675592aeB9E93994ac35bA48282E98CA
VITE_CREDENTIAL_REGISTRY_ADDRESS=0x193f9ad4b82e7211D885eFb913F1741892F430fE
VITE_VERIFIER_CONTRACT_ADDRESS=0x7368efd0B81F675B3B392e8534d8A74FA0b0D2A2
```

### Deploy Latest Changes
```bash
git add .
git commit -m "FASE 3: Complete blockchain integration"
git push origin main
```

Vercel will automatically deploy the changes.

### Verify Frontend is Working
1. Visit: https://ownly-weld.vercel.app
2. Check all pages load:
   - Home: https://ownly-weld.vercel.app/
   - Credentials: https://ownly-weld.vercel.app/credentials
   - Verify: https://ownly-weld.vercel.app/verify
   - Issuer: https://ownly-weld.vercel.app/issuer

---

## 🧪 Testing Checklist

After deployment, test the complete flow:

### 1. Local Testing First
- [ ] Run `npm run dev` locally
- [ ] Connect MetaMask wallet
- [ ] Navigate to `/issuer`
- [ ] Upload test JSON file
- [ ] Approve both MetaMask transactions
- [ ] Verify success message appears
- [ ] Check batch appears in history
- [ ] Click Polygonscan link and verify transaction

### 2. Production Testing
- [ ] Visit https://ownly-weld.vercel.app/issuer
- [ ] Connect MetaMask wallet
- [ ] Upload test JSON file
- [ ] Approve both MetaMask transactions
- [ ] Verify success message appears
- [ ] Check batch appears in history
- [ ] Click Polygonscan link and verify transaction

### 3. API Testing
- [ ] Health check: `curl https://ownly-api.onrender.com/health`
- [ ] Check API logs on Render for any errors
- [ ] Verify CORS is working (no console errors in browser)

---

## 🔧 Troubleshooting

### Issue: CORS Error in Browser Console
**Symptom**: `Access to fetch at 'https://ownly-api.onrender.com' from origin 'https://ownly-weld.vercel.app' has been blocked by CORS policy`

**Solution**: 
1. Update `FRONTEND_URL` on Render to `https://ownly-weld.vercel.app`
2. Redeploy API service

### Issue: API Returns 500 Error
**Symptom**: Batch upload fails with "Error al publicar el lote"

**Solution**:
1. Check Render logs for error details
2. Verify `ISSUER_PRIVATE_KEY` is set correctly
3. Verify contract addresses are correct
4. Check wallet has enough POL for gas

### Issue: MetaMask Doesn't Prompt
**Symptom**: Click "Publicar Lote" but no MetaMask popup

**Solution**:
1. Check browser console for errors
2. Verify wallet is connected
3. Verify you're on Polygon Amoy network (chainId 80002)
4. Try refreshing the page and reconnecting wallet

### Issue: Transaction Fails On-Chain
**Symptom**: MetaMask shows "Transaction failed"

**Solution**:
1. Check Polygonscan for error message
2. Verify you have enough POL for gas (~0.002 POL per batch)
3. Verify contract addresses are correct
4. Check if contract is paused or has access control

---

## 📊 Monitoring

### Check API Health
```bash
# Health check
curl https://ownly-api.onrender.com/health

# Should return:
# {"status":"ok","version":"1.0.0"}
```

### Check Render Logs
1. Go to Render Dashboard
2. Select `ownly-api` service
3. Click "Logs" tab
4. Look for any errors or warnings

### Check Vercel Logs
1. Go to Vercel Dashboard
2. Select `ownly` project
3. Click "Deployments"
4. Click latest deployment
5. Check "Functions" tab for any errors

### Check Blockchain
- Your wallet: https://amoy.polygonscan.com/address/0xEeb9a177FD70e442EcAca1A6b968cCfC2baE7Ec0
- BatchProcessor contract: https://amoy.polygonscan.com/address/0x65ac8030675592aeB9E93994ac35bA48282E98CA

---

## 🎯 Success Criteria

FASE 3 is successfully deployed when:
- ✅ Frontend loads on Vercel without errors
- ✅ API responds to health check
- ✅ Wallet connects successfully
- ✅ Issuer dashboard loads
- ✅ Batch upload triggers MetaMask
- ✅ Both transactions confirm on Polygon Amoy
- ✅ Success message displays with TX hash
- ✅ Batch appears in history
- ✅ Polygonscan link works and shows successful transaction
- ✅ No CORS errors in browser console
- ✅ No errors in Render or Vercel logs

---

## 📝 Next Steps

After successful deployment:

1. **Document the flow** - Create user guide for issuers
2. **Test with larger batches** - Try 10, 50, 100 credentials
3. **Monitor gas costs** - Track actual costs on testnet
4. **Plan FASE 4** - ZK proof generation and verification
5. **Security audit** - Review smart contracts and API
6. **Performance testing** - Test with maximum batch size (1000)

---

## 🚀 Quick Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
git push origin main

# Check API health
curl https://ownly-api.onrender.com/health

# View Render logs
# Go to: https://dashboard.render.com/

# View Vercel logs
# Go to: https://vercel.com/dashboard
```

---

## ✨ Summary

Everything is ready for deployment! The blockchain integration is complete and tested. Just need to:

1. Update `FRONTEND_URL` on Render
2. Push changes to GitHub (auto-deploys to Vercel)
3. Test the complete flow on production

**FASE 3 Status: READY FOR DEPLOYMENT** 🚀
