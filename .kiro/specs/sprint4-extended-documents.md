# SPRINT 4 Extended: Multi-Document Support & Local Encryption

**Status**: Planning
**Priority**: High
**Estimated Duration**: 3-4 days

---

## Overview

Extend the credential system to support multiple document types and allow users to store encrypted documents locally on their device.

---

## Document Types Supported

### Identity Documents
- DNI (National ID)
- Pasaporte (Passport)
- Carnet de Conducir (Driver's License)
- Cédula de Extranjería (Foreigner ID)

### Health Documents
- Cartilla de Vacunación (Vaccination Card)
- Certificado Médico (Medical Certificate)
- Receta Médica (Medical Prescription)
- Informe de Laboratorio (Lab Report)

### Education Documents
- Título Universitario (University Degree)
- Diploma de Bachillerato (High School Diploma)
- Certificado de Estudios (Study Certificate)
- Título Técnico (Technical Degree)

### Professional Documents
- Licencia Profesional (Professional License)
- Certificado de Experiencia (Experience Certificate)
- Colegiación (Professional Registration)

### Other Documents
- Comprobante de Domicilio (Proof of Address)
- Comprobante de Ingresos (Proof of Income)
- Contrato de Trabajo (Employment Contract)
- Otros (Other)

---

## Architecture

### Frontend (Local Encryption)
```
User selects document
    ↓
User uploads file
    ↓
Frontend encrypts file (AES-256-GCM)
    ↓
Frontend stores in IndexedDB (encrypted)
    ↓
User can view/download (decrypt on demand)
    ↓
No unencrypted data leaves device
```

### Backend (Optional Cloud Storage)
```
User can optionally sync to backend
    ↓
Backend stores encrypted blob
    ↓
Backend never has decryption key
    ↓
Only user can decrypt
```

---

## Database Schema

### New Table: user_documents
```sql
CREATE TABLE user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Encryption info
  encryption_key_hash VARCHAR(255), -- Hash of encryption key (for verification)
  iv VARCHAR(255), -- Initialization vector
  auth_tag VARCHAR(255), -- Authentication tag
  
  -- Storage
  storage_location VARCHAR(50), -- 'local', 'cloud', 'both'
  cloud_url VARCHAR(500), -- URL if stored in cloud
  
  -- Metadata
  uploaded_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Status
  status VARCHAR(50), -- 'local', 'synced', 'archived'
  is_verified BOOLEAN DEFAULT FALSE,
  verification_hash VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX idx_user_documents_type ON user_documents(document_type);
```

### Update: credentials table
```sql
ALTER TABLE credentials ADD COLUMN documents JSONB;
-- Stores references to related documents
```

---

## Frontend Implementation

### 1. Document Upload Component
```javascript
// src/components/documents/DocumentUpload.jsx
- Document type selector
- File upload (drag & drop)
- File preview
- Encryption progress
- Local storage confirmation
```

### 2. Document Storage (IndexedDB)
```javascript
// src/utils/documentStorage.js
- encryptDocument(file, password)
- decryptDocument(encryptedData, password)
- saveToIndexedDB(document)
- getFromIndexedDB(documentId)
- deleteFromIndexedDB(documentId)
- listDocuments()
```

### 3. Encryption Library
```javascript
// Use: TweetNaCl.js or libsodium.js
- AES-256-GCM encryption
- PBKDF2 key derivation
- Random IV generation
- Authentication tag verification
```

### 4. Document Viewer
```javascript
// src/components/documents/DocumentViewer.jsx
- Display encrypted documents
- Decrypt on demand
- Preview (PDF, images)
- Download encrypted
- Delete from device
```

---

## Backend Implementation

### 1. Document Upload Endpoint
```javascript
POST /api/documents/upload
- Accept encrypted blob
- Store in cloud storage (optional)
- Return storage reference
- No decryption on backend
```

### 2. Document Sync Endpoint
```javascript
POST /api/documents/sync
- Sync local documents to cloud
- Maintain encryption
- Return sync status
```

### 3. Document Retrieval Endpoint
```javascript
GET /api/documents/:documentId
- Return encrypted blob
- Frontend decrypts
- No decryption on backend
```

### 4. Document List Endpoint
```javascript
GET /api/documents/user/:userId
- Return document metadata (no content)
- Include encryption info
- Return storage location
```

---

## Encryption Strategy

### Client-Side Encryption
```javascript
// User's password → Encryption key
// File → Encrypt with AES-256-GCM
// Encrypted file → Store locally in IndexedDB
// Optional: Sync encrypted to cloud

// Never send unencrypted data to backend
// Backend never has decryption key
// Only user can decrypt
```

### Key Derivation
```javascript
// Password → PBKDF2 → 256-bit key
// Random IV for each file
// Authentication tag for integrity
// Verification hash for key confirmation
```

### Storage Options
```javascript
// Option 1: Local Only
// - IndexedDB on device
// - No cloud sync
// - User controls all data

// Option 2: Local + Cloud Backup
// - IndexedDB on device
// - Encrypted backup in cloud
// - User can restore from cloud
// - Cloud never has decryption key

// Option 3: Cloud Only
// - Encrypted in cloud
// - Decrypt on demand
// - Accessible from any device
```

---

## User Flow

### Upload Document
```
1. User clicks "Subir Documento"
2. Selects document type
3. Uploads file
4. Frontend encrypts with user's password
5. Stores in IndexedDB
6. Optional: Sync to cloud (encrypted)
7. Document appears in list
```

### View Document
```
1. User clicks on document
2. Frontend prompts for password
3. Frontend decrypts from IndexedDB
4. Shows preview (PDF, image, etc.)
5. User can download encrypted
```

### Delete Document
```
1. User clicks delete
2. Removes from IndexedDB
3. Optional: Removes from cloud
4. Confirmation shown
```

---

## Security Considerations

### Encryption
- ✅ AES-256-GCM (authenticated encryption)
- ✅ PBKDF2 key derivation (100,000+ iterations)
- ✅ Random IV for each file
- ✅ Authentication tag for integrity

### Storage
- ✅ IndexedDB (browser storage)
- ✅ Encrypted at rest
- ✅ No unencrypted data on device
- ✅ User controls all data

### Backend
- ✅ Never stores unencrypted data
- ✅ Never has decryption key
- ✅ Only stores encrypted blobs
- ✅ Metadata only (no content)

### Privacy
- ✅ User controls encryption key
- ✅ User controls storage location
- ✅ User can delete anytime
- ✅ GDPR compliant

---

## Implementation Plan

### Phase 1: Frontend Encryption (Day 1-2)
- [ ] Create document upload component
- [ ] Implement IndexedDB storage
- [ ] Implement encryption/decryption
- [ ] Create document viewer
- [ ] Test local storage

### Phase 2: Backend Support (Day 3)
- [ ] Create document endpoints
- [ ] Implement cloud storage (optional)
- [ ] Add document metadata
- [ ] Test sync functionality

### Phase 3: UI Integration (Day 4)
- [ ] Integrate with credentials page
- [ ] Add document list
- [ ] Add document management
- [ ] Test complete flow

---

## API Endpoints

### POST /api/documents/upload
```javascript
// Upload encrypted document
// Body: { documentType, encryptedData, iv, authTag, fileName }
// Returns: { documentId, storageLocation }
```

### GET /api/documents/:documentId
```javascript
// Get encrypted document
// Returns: { encryptedData, iv, authTag, fileName }
```

### GET /api/documents/user/:userId
```javascript
// List user's documents (metadata only)
// Returns: [{ id, type, fileName, uploadedAt, storageLocation }]
```

### DELETE /api/documents/:documentId
```javascript
// Delete document
// Returns: { success: true }
```

### POST /api/documents/sync
```javascript
// Sync local documents to cloud
// Body: { documentIds }
// Returns: { synced: [...], failed: [...] }
```

---

## Database Functions

### credentialService.js
```javascript
addDocumentToCredential(credentialId, documentId)
getCredentialDocuments(credentialId)
removeDocumentFromCredential(credentialId, documentId)
```

### documentService.js (New)
```javascript
createDocument(userId, documentData)
getDocument(documentId)
getUserDocuments(userId)
updateDocument(documentId, updateData)
deleteDocument(documentId)
getDocumentsByType(userId, documentType)
```

---

## Frontend Components

### DocumentUpload.jsx
- Document type selector
- File upload (drag & drop)
- Encryption progress
- Local storage confirmation

### DocumentViewer.jsx
- Display encrypted documents
- Decrypt on demand
- Preview (PDF, images)
- Download encrypted
- Delete from device

### DocumentList.jsx
- List user's documents
- Filter by type
- Sort by date
- Search documents

### DocumentManager.jsx
- Manage documents
- Sync to cloud
- Delete documents
- View storage usage

---

## Testing Strategy

### Unit Tests
- Encryption/decryption
- Key derivation
- IndexedDB operations
- File handling

### Integration Tests
- Upload flow
- Encryption flow
- Storage flow
- Retrieval flow

### End-to-End Tests
- Complete document lifecycle
- Multiple document types
- Cloud sync
- Error scenarios

---

## Success Criteria

✅ Multiple document types supported
✅ Documents encrypted locally
✅ No unencrypted data leaves device
✅ User can view/download documents
✅ Optional cloud sync
✅ Backend never has decryption key
✅ GDPR compliant
✅ User controls all data

---

## Timeline

- **Day 1-2**: Frontend encryption & storage
- **Day 3**: Backend support
- **Day 4**: UI integration & testing

**Total**: 4 days for core implementation

---

## Notes

- Encryption happens entirely on frontend
- Backend only stores encrypted blobs
- User's password is the encryption key
- No key recovery if password forgotten
- Documents stored in IndexedDB (browser storage)
- Optional cloud backup (encrypted)
- User controls all data

---

## Next Phase: SPRINT 5

### ZK Proofs
- Implement actual ZK proof generation
- Add proof verification
- Implement credential verification page

### Advanced Features
- Batch document operations
- Document expiration
- Document versioning
- Document sharing (encrypted)

---

## References

- TweetNaCl.js: https://tweetnacl.js.org/
- libsodium.js: https://github.com/jedisct1/libsodium.js
- IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
