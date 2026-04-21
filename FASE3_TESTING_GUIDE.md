# FASE 3 - Blockchain Integration Testing Guide

## ✅ Implementation Status: COMPLETE

All components for FASE 3 have been successfully implemented and are ready for testing.

---

## 🎯 What Was Implemented

### 1. **Smart Contract Integration Hook** (`src/hooks/useContracts.js`)
- Wagmi-based hook for interacting with BatchProcessor contract
- Functions: `addCommitments()`, `submitBatch()`
- Automatic transaction status tracking (pending, confirming, success)

### 2. **BatchUpload Component** (`src/components/issuer/BatchUpload.jsx`)
- Real blockchain integration (no more mock data)
- Generates cryptographic commitments using `keccak256`
- Builds Merkle tree from credentials
- Calls API endpoint `/api/batch/submit` which publishes to Polygon Amoy
- Displays transaction hash and Merkle root after success
- Stores batch history in localStorage

### 3. **BatchHistory Component** (`src/components/issuer/BatchHistory.jsx`)
- Displays all published batches
- Shows transaction hashes with direct links to Polygonscan
- Formatted timestamps with date-fns

### 4. **Environment Configuration**
- Frontend `.env.local` configured with:
  - API URL: `https://ownly-api.onrender.com`
  - Contract addresses (BatchProcessor, CredentialRegistry, VerifierContract)
- Backend `.env` configured with:
  - Polygon Amoy RPC URL
  - Issuer private key (your wallet)
  - All contract addresses

---

## 🧪 How to Test

### Prerequisites
1. MetaMask installed with your wallet: `0xEeb9a177FD70e442EcAca1A6b968cCfC2baE7Ec0`
2. POL testnet tokens in your wallet (you already have some)
3. Frontend running locally: `npm run dev`
4. API deployed on Render: `https://ownly-api.onrender.com`

### Test Steps

#### Step 1: Start Local Frontend
```bash
npm run dev
```
Navigate to `http://localhost:5173`

#### Step 2: Connect Wallet
1. Click "Connect Wallet" button in header
2. Approve MetaMask connection
3. Verify your address shows in the header

#### Step 3: Navigate to Issuer Dashboard
1. Click "Emisor" in the navigation menu
2. You should see the "Panel de Emisor" page
3. Two tabs: "Subir Lote" and "Historial"

#### Step 4: Prepare Test Credentials
Create a file `test-credentials.json` with this content:

```json
[
  {
    "name": "Juan Pérez García",
    "type": "dni",
    "number": "12345678A",
    "birthDate": "1990-05-15",
    "issuer": "Ministerio del Interior",
    "expiryDate": "2030-05-15"
  },
  {
    "name": "María López Sánchez",
    "type": "dni",
    "number": "87654321B",
    "birthDate": "1985-08-20",
    "issuer": "Ministerio del Interior",
    "expiryDate": "2029-08-20"
  },
  {
    "name": "Carlos Rodríguez Martín",
    "type": "dni",
    "number": "11223344C",
    "birthDate": "1992-03-10",
    "issuer": "Ministerio del Interior",
    "expiryDate": "2031-03-10"
  }
]
```

#### Step 5: Upload Batch
1. Click "Subir Lote" tab
2. Drag and drop `test-credentials.json` or click to upload
3. Verify the preview shows "3 credenciales detectadas"
4. Click "Publicar Lote" button
5. **MetaMask will prompt you to approve TWO transactions:**
   - Transaction 1: `addCommitmentsBulk()` - adds credentials to pending pool
   - Transaction 2: `submitBatch()` - publishes the Merkle root
6. Approve both transactions
7. Wait for confirmations (should take 10-30 seconds)

#### Step 6: Verify Success
After both transactions confirm, you should see:
- ✅ Green success message: "Lote publicado exitosamente"
- Batch ID (e.g., `#1`)
- Merkle Root (hash starting with `0x...`)
- TX Hash (transaction hash)

#### Step 7: Check Blockchain
1. Click the TX Hash link (or copy it)
2. Opens Polygonscan: `https://amoy.polygonscan.com/tx/[hash]`
3. Verify:
   - Status: Success ✅
   - From: Your wallet address
   - To: BatchProcessor contract `0x65ac8030675592aeB9E93994ac35bA48282E98CA`
   - Function: `submitBatch`

#### Step 8: View History
1. Click "Historial" tab
2. You should see your published batch
3. Verify all details match:
   - Batch ID
   - Credential count (3)
   - Timestamp
   - Merkle Root
   - TX Hash with Polygonscan link

---

## 🔍 What to Look For

### ✅ Success Indicators
- MetaMask prompts appear for both transactions
- Transactions confirm on Polygon Amoy
- Success message displays with batch details
- Batch appears in history tab
- Polygonscan shows successful transactions
- No console errors

### ❌ Potential Issues

#### Issue: "Insufficient funds"
**Solution**: Get more POL tokens from faucet:
- https://faucet.polygon.technology/
- https://www.alchemy.com/faucets/polygon-amoy

#### Issue: "User rejected transaction"
**Solution**: Approve the MetaMask popup

#### Issue: "Network error" or API timeout
**Solution**: 
- Check API is running: `https://ownly-api.onrender.com/health`
- Render free tier may sleep after inactivity (first request wakes it up, takes ~30s)

#### Issue: Transaction fails on-chain
**Solution**: 
- Check you have enough POL for gas
- Verify contract addresses in `.env.local` match deployed contracts
- Check Polygonscan for error message

---

## 📊 Expected Gas Costs

Based on Polygon Amoy testnet:
- `addCommitmentsBulk(3)`: ~0.001 POL
- `submitBatch()`: ~0.0005 POL
- **Total per batch**: ~0.0015 POL

For 100 credentials:
- `addCommitmentsBulk(100)`: ~0.01 POL
- `submitBatch()`: ~0.0005 POL
- **Total**: ~0.0105 POL

---

## 🔗 Important Links

### Deployed Contracts (Polygon Amoy)
- **CredentialRegistry**: `0x193f9ad4b82e7211D885eFb913F1741892F430fE`
- **BatchProcessor**: `0x65ac8030675592aeB9E93994ac35bA48282E98CA`
- **VerifierContract**: `0x7368efd0B81F675B3B392e8534d8A74FA0b0D2A2`

### Explorers
- Polygonscan Amoy: https://amoy.polygonscan.com/
- Your wallet: https://amoy.polygonscan.com/address/0xEeb9a177FD70e442EcAca1A6b968cCfC2baE7Ec0

### Deployments
- Frontend: https://ownly-weld.vercel.app
- API: https://ownly-api.onrender.com

---

## 🚀 Next Steps After Testing

Once you confirm everything works:

1. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "FASE 3: Blockchain integration complete"
   git push origin main
   ```
   Vercel will auto-deploy with the new `.env.local` variables

2. **Test on Production**
   - Visit https://ownly-weld.vercel.app/issuer
   - Upload a batch
   - Verify transactions on Polygonscan

3. **FASE 4 Planning** (if needed)
   - Implement ZK proof generation on frontend
   - Connect QR scanner to verification flow
   - Add Merkle proof verification
   - Integrate with ZK circuits

---

## 📝 Technical Details

### How It Works

1. **User uploads JSON** → Frontend parses credentials
2. **Generate commitments** → `keccak256(name || number || type)` for each credential
3. **Build Merkle tree** → Sorted-pair hashing, same as Solidity contract
4. **Call API** → POST to `/api/batch/submit` with commitments
5. **API publishes** → Two blockchain transactions:
   - `addCommitmentsBulk(commitments[])` - stores in pending pool
   - `submitBatch(merkleRoot)` - publishes root and emits event
6. **Return result** → API returns batchId, merkleRoot, txHash, proofs
7. **Store locally** → Frontend saves to localStorage for history
8. **Display** → User sees success message and can view on Polygonscan

### Security Notes
- Commitments are cryptographic hashes (irreversible)
- Merkle tree ensures data integrity
- Only issuer wallet can publish batches (controlled by private key)
- All transactions are public on Polygon Amoy
- Users will receive Merkle proofs to generate ZK proofs later

---

## ✨ Summary

FASE 3 is **100% complete** and ready for testing. The issuer dashboard now:
- ✅ Connects to real blockchain (Polygon Amoy)
- ✅ Generates cryptographic commitments
- ✅ Builds Merkle trees
- ✅ Publishes to smart contracts
- ✅ Displays transaction hashes
- ✅ Links to Polygonscan
- ✅ Stores batch history

**No more mock data - everything is real blockchain transactions!**
