# 🚀 QUICKSTART - Test FASE 3 in 5 Minutes

## Prerequisites
- ✅ MetaMask installed
- ✅ Wallet: `0xEeb9a177FD70e442EcAca1A6b968cCfC2baE7Ec0`
- ✅ POL tokens in wallet (you have them)
- ✅ Node.js installed

---

## Step 1: Start Frontend (30 seconds)

```bash
npm run dev
```

Open: http://localhost:5173

---

## Step 2: Connect Wallet (30 seconds)

1. Click "Connect Wallet" button (top right)
2. Approve MetaMask connection
3. Verify your address shows: `0xEeb9...7Ec0`

---

## Step 3: Go to Issuer Dashboard (10 seconds)

Click "Emisor" in the navigation menu

---

## Step 4: Upload Test Batch (2 minutes)

1. Click "Subir Lote" tab
2. Drag and drop `test-credentials.json` (already created in project root)
3. Verify preview shows "3 credenciales detectadas"
4. Click "Publicar Lote" button
5. **Approve BOTH MetaMask transactions:**
   - Transaction 1: `addCommitmentsBulk` ✅
   - Transaction 2: `submitBatch` ✅
6. Wait ~30 seconds for confirmations

---

## Step 5: Verify Success (1 minute)

You should see:
- ✅ Green success message
- ✅ Batch ID (e.g., `#1`)
- ✅ Merkle Root (hash)
- ✅ TX Hash (clickable link)

Click the TX Hash → Opens Polygonscan → Verify transaction succeeded

---

## Step 6: Check History (30 seconds)

1. Click "Historial" tab
2. See your published batch
3. Click Polygonscan link again to verify

---

## ✅ Done!

**FASE 3 is working!** 🎉

Your credentials are now published on Polygon Amoy blockchain.

---

## 🐛 Troubleshooting

### MetaMask doesn't prompt
- Refresh page
- Reconnect wallet
- Check you're on Polygon Amoy network

### "Insufficient funds"
- Get more POL: https://faucet.polygon.technology/

### API timeout
- Wait 30s (Render free tier wakes up)
- Try again

### Transaction fails
- Check you have ~0.002 POL for gas
- Verify contract addresses in `.env.local`

---

## 📚 More Info

- **Full Testing Guide**: `FASE3_TESTING_GUIDE.md`
- **Deployment Guide**: `DEPLOYMENT_CHECKLIST.md`
- **Complete Summary**: `FASE3_COMPLETE.md`

---

## 🔗 Quick Links

- **Frontend**: http://localhost:5173
- **API Health**: https://ownly-api.onrender.com/health
- **Polygonscan**: https://amoy.polygonscan.com/
- **Your Wallet**: https://amoy.polygonscan.com/address/0xEeb9a177FD70e442EcAca1A6b968cCfC2baE7Ec0

---

**Total Time: ~5 minutes** ⏱️

**Result: Real blockchain transactions!** 🚀
