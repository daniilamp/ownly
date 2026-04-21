# Ownly Backend

Infraestructura completa para el MVP: contratos inteligentes, circuitos ZK y API.

## Estructura

```
ownly-backend/
├── contracts/          # Solidity — Polygon zkEVM
│   ├── src/
│   │   ├── CredentialRegistry.sol   # Registra Merkle roots de issuers
│   │   ├── BatchProcessor.sol       # Agrupa credenciales en batches
│   │   └── VerifierContract.sol     # Verifica pruebas ZK on-chain
│   ├── test/
│   ├── scripts/deploy.js
│   └── hardhat.config.js
│
├── circuits/           # Circom 2 + SnarkJS
│   ├── age/age_over_18.circom       # Prueba mayoría de edad
│   ├── license/valid_license.circom # Prueba carnet válido
│   ├── residency/residency.circom   # Prueba residencia
│   └── build.sh                     # Compila todo
│
└── api/                # Node.js + Express
    └── src/
        ├── routes/verify.js         # POST /api/verify
        ├── routes/batch.js          # POST /api/batch/submit
        ├── routes/credentials.js    # POST /api/credentials/proof-input
        └── services/
            ├── zkVerifier.js        # Lógica de verificación ZK
            └── merkleService.js     # Construcción de árboles Merkle
```

## Setup rápido

### 1. Contratos

```bash
cd contracts
npm install
cp .env.example .env   # añade tu DEPLOYER_PRIVATE_KEY

# Test local
npx hardhat test

# Deploy a Polygon zkEVM Testnet
npx hardhat run scripts/deploy.js --network polygonZkEVM
# → guarda las direcciones en deployments.json
```

### 2. Circuitos ZK

```bash
cd circuits
npm install
# Requiere: npm install -g circom snarkjs
bash build.sh
# → genera build/*/verification_key.json
# → genera contracts/src/*_verifier.sol
```

### 3. API

```bash
cd api
npm install
cp .env.example .env   # añade las direcciones de contratos
npm run dev
# → http://localhost:3001
```

## Flujo completo

```
1. ISSUER (partner oficial)
   → Valida DNI del usuario físicamente
   → Llama POST /api/batch/submit con los hashes de credenciales
   → BatchProcessor.sol publica el Merkle root en Polygon
   → API devuelve Merkle proof al usuario

2. USUARIO (app Ownly)
   → Recibe Merkle proof del issuer
   → Genera ZK proof en el dispositivo (SnarkJS WASM)
     Input privado: fecha nacimiento + secret
     Input público: merkleRoot + currentDate
   → Genera QR con { proof, publicSignals, issuer, batchId }

3. VERIFICADOR (negocio)
   → Escanea QR
   → Llama POST /api/verify con la prueba
   → API verifica: Groth16 válido + Merkle root on-chain + nullifier fresco
   → Respuesta: { valid: true, claimType: "age_over_18" }
   → NUNCA ve nombre, DNI ni fecha de nacimiento
```

## Costes (Polygon L2 + Batching)

| Método              | Coste por verificación |
|---------------------|------------------------|
| KYC tradicional     | ~5-50€                 |
| Ethereum L1         | ~2-10€                 |
| Polygon L2          | ~0.05€                 |
| **Ownly (batching)**| **< 0.01€**            |

## Integración con el frontend

Reemplaza en `Verify.jsx` la llamada a base44 por:

```js
const res = await fetch("http://localhost:3001/api/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ claimType, proof, issuer, batchId }),
});
const result = await res.json();
```
