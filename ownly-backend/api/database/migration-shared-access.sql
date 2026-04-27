-- Tabla para accesos compartidos temporales
CREATE TABLE IF NOT EXISTS shared_access (
  id UUID PRIMARY KEY,
  doc_title VARCHAR(255),
  doc_type VARCHAR(100),
  mime_type VARCHAR(100),
  file_name VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  content TEXT, -- base64 del documento desencriptado (temporal)
  status VARCHAR(20) DEFAULT 'active', -- active | revoked | expired
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para limpiar expirados
CREATE INDEX IF NOT EXISTS idx_shared_access_expires ON shared_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_shared_access_status ON shared_access(status);
