/**
 * DocumentationViewer Component
 * Interactive API documentation with endpoint details, code examples, and integration guides.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.6
 */

import { useState } from 'react';
import {
  Book,
  Code,
  Key,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Globe,
  Shield,
  Users,
  FileText,
  Play,
  Send,
  Loader2,
} from 'lucide-react';

// --- Data: API Endpoints ---
const ENDPOINTS = [
  {
    id: 'get-identity',
    method: 'GET',
    path: '/api/identity/:ownlyId',
    description: 'Retrieve a verified identity record by its unique Ownly ID. Returns the full identity profile including verification status, personal details, and metadata.',
    parameters: [
      { name: 'ownlyId', location: 'path', type: 'string', required: true, description: 'The unique Ownly identity identifier (UUID format)' },
    ],
    response: {
      status: 200,
      body: `{
  "id": "uuid-string",
  "ownlyId": "OWN-XXXXXX",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "verificationStatus": "verified",
  "verifiedAt": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-10T08:00:00Z"
}`,
    },
    examples: {
      javascript: `const response = await fetch('https://api.ownly.id/api/identity/OWN-ABC123', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const identity = await response.json();
console.log(identity.verificationStatus);`,
      python: `import requests

response = requests.get(
    'https://api.ownly.id/api/identity/OWN-ABC123',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    }
)

identity = response.json()
print(identity['verificationStatus'])`,
      curl: `curl -X GET "https://api.ownly.id/api/identity/OWN-ABC123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    },
  },
  {
    id: 'verify-identity',
    method: 'POST',
    path: '/api/identity/verify',
    description: 'Submit identity data for verification. Initiates the verification process and returns the verification result or pending status.',
    parameters: [
      { name: 'firstName', location: 'body', type: 'string', required: true, description: 'Legal first name of the individual' },
      { name: 'lastName', location: 'body', type: 'string', required: true, description: 'Legal last name of the individual' },
      { name: 'email', location: 'body', type: 'string', required: true, description: 'Email address for identity association' },
      { name: 'dateOfBirth', location: 'body', type: 'string', required: true, description: 'Date of birth in ISO 8601 format (YYYY-MM-DD)' },
      { name: 'documentType', location: 'body', type: 'string', required: false, description: 'Type of ID document (passport, drivers_license, national_id)' },
      { name: 'documentNumber', location: 'body', type: 'string', required: false, description: 'Document identification number' },
    ],
    response: {
      status: 201,
      body: `{
  "id": "uuid-string",
  "ownlyId": "OWN-XXXXXX",
  "verificationStatus": "verified",
  "verifiedAt": "2024-01-15T10:30:00Z",
  "message": "Identity verified successfully"
}`,
    },
    examples: {
      javascript: `const response = await fetch('https://api.ownly.id/api/identity/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    dateOfBirth: '1990-05-15',
    documentType: 'passport',
    documentNumber: 'AB1234567'
  })
});

const result = await response.json();
console.log(result.ownlyId, result.verificationStatus);`,
      python: `import requests

response = requests.post(
    'https://api.ownly.id/api/identity/verify',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'firstName': 'John',
        'lastName': 'Doe',
        'email': 'john@example.com',
        'dateOfBirth': '1990-05-15',
        'documentType': 'passport',
        'documentNumber': 'AB1234567'
    }
)

result = response.json()
print(result['ownlyId'], result['verificationStatus'])`,
      curl: `curl -X POST "https://api.ownly.id/api/identity/verify" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "dateOfBirth": "1990-05-15",
    "documentType": "passport",
    "documentNumber": "AB1234567"
  }'`,
    },
  },
  {
    id: 'unique-check',
    method: 'GET',
    path: '/api/identity/unique-check/:email',
    description: 'Check whether an email address is already associated with a verified identity. Useful for preventing duplicate registrations during onboarding flows.',
    parameters: [
      { name: 'email', location: 'path', type: 'string', required: true, description: 'Email address to check for uniqueness (URL-encoded)' },
    ],
    response: {
      status: 200,
      body: `{
  "email": "john@example.com",
  "isUnique": true,
  "message": "Email is not associated with any existing identity"
}`,
    },
    examples: {
      javascript: `const email = encodeURIComponent('john@example.com');
const response = await fetch(\`https://api.ownly.id/api/identity/unique-check/\${email}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
if (result.isUnique) {
  console.log('Email is available for registration');
}`,
      python: `import requests
from urllib.parse import quote

email = quote('john@example.com')
response = requests.get(
    f'https://api.ownly.id/api/identity/unique-check/{email}',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    }
)

result = response.json()
if result['isUnique']:
    print('Email is available for registration')`,
      curl: `curl -X GET "https://api.ownly.id/api/identity/unique-check/john%40example.com" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    },
  },
  {
    id: 'email-lookup',
    method: 'GET',
    path: '/api/identity/email-lookup/:email',
    description: 'Look up an existing verified identity by email address. Returns the identity profile if found, or a 404 if no identity is associated with the email.',
    parameters: [
      { name: 'email', location: 'path', type: 'string', required: true, description: 'Email address to look up (URL-encoded)' },
    ],
    response: {
      status: 200,
      body: `{
  "id": "uuid-string",
  "ownlyId": "OWN-XXXXXX",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "verificationStatus": "verified",
  "verifiedAt": "2024-01-15T10:30:00Z"
}`,
    },
    examples: {
      javascript: `const email = encodeURIComponent('john@example.com');
const response = await fetch(\`https://api.ownly.id/api/identity/email-lookup/\${email}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

if (response.status === 404) {
  console.log('No identity found for this email');
} else {
  const identity = await response.json();
  console.log('Found:', identity.ownlyId);
}`,
      python: `import requests
from urllib.parse import quote

email = quote('john@example.com')
response = requests.get(
    f'https://api.ownly.id/api/identity/email-lookup/{email}',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    }
)

if response.status_code == 404:
    print('No identity found for this email')
else:
    identity = response.json()
    print(f"Found: {identity['ownlyId']}")`,
      curl: `curl -X GET "https://api.ownly.id/api/identity/email-lookup/john%40example.com" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    },
  },
];

// --- Data: Integration Guides ---
const INTEGRATION_GUIDES = [
  {
    id: 'prop-firm',
    title: 'Prop Firm Trader Verification',
    icon: Users,
    description: 'Verify trader identities before granting access to funded accounts. Ensure compliance with KYC requirements for proprietary trading firms.',
    steps: [
      'When a trader registers on your platform, collect their personal details (name, email, date of birth).',
      'Call POST /api/identity/verify with the trader\'s information to initiate verification.',
      'Store the returned ownlyId in your trader profile for future reference.',
      'Before funding an account, call GET /api/identity/:ownlyId to confirm the verification status is still "verified".',
      'Use GET /api/identity/unique-check/:email during registration to prevent duplicate accounts across your platform.',
    ],
    codeSnippet: `// Example: Verify trader before funding
async function verifyTraderForFunding(traderId) {
  const trader = await getTraderProfile(traderId);
  
  const response = await fetch(
    \`https://api.ownly.id/api/identity/\${trader.ownlyId}\`,
    { headers: { 'Authorization': \`Bearer \${API_KEY}\` } }
  );
  
  const identity = await response.json();
  
  if (identity.verificationStatus === 'verified') {
    await approveFunding(traderId);
  } else {
    await requestReverification(traderId);
  }
}`,
  },
  {
    id: 'exchange',
    title: 'Exchange User Onboarding',
    icon: Globe,
    description: 'Streamline user onboarding for cryptocurrency or traditional exchanges with automated identity verification and duplicate detection.',
    steps: [
      'During user registration, first call GET /api/identity/unique-check/:email to ensure the email is not already verified.',
      'If unique, proceed with your registration flow and collect required identity documents.',
      'Submit the user\'s identity data via POST /api/identity/verify for automated verification.',
      'On successful verification, store the ownlyId and grant the user trading permissions.',
      'For returning users or account recovery, use GET /api/identity/email-lookup/:email to find their existing identity.',
    ],
    codeSnippet: `// Example: Exchange onboarding flow
async function onboardNewUser(userData) {
  // Step 1: Check uniqueness
  const uniqueCheck = await fetch(
    \`https://api.ownly.id/api/identity/unique-check/\${encodeURIComponent(userData.email)}\`,
    { headers: { 'Authorization': \`Bearer \${API_KEY}\` } }
  );
  const { isUnique } = await uniqueCheck.json();
  
  if (!isUnique) {
    throw new Error('Email already associated with a verified identity');
  }
  
  // Step 2: Verify identity
  const verifyResponse = await fetch(
    'https://api.ownly.id/api/identity/verify',
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    }
  );
  
  const result = await verifyResponse.json();
  return result.ownlyId;
}`,
  },
  {
    id: 'broker',
    title: 'Broker Compliance Checks',
    icon: Shield,
    description: 'Implement ongoing compliance checks for brokerage clients. Verify identities at account opening and perform periodic re-verification for regulatory compliance.',
    steps: [
      'At account opening, verify the client\'s identity using POST /api/identity/verify with all required KYC data.',
      'Store the ownlyId in your client management system linked to the brokerage account.',
      'Set up periodic compliance checks by calling GET /api/identity/:ownlyId to confirm ongoing verification status.',
      'Use GET /api/identity/email-lookup/:email for cross-referencing clients across multiple accounts.',
      'Implement automated alerts when a verification status changes from "verified" to any other state.',
    ],
    codeSnippet: `// Example: Periodic compliance check
async function runComplianceCheck(clientId) {
  const client = await getClientRecord(clientId);
  
  const response = await fetch(
    \`https://api.ownly.id/api/identity/\${client.ownlyId}\`,
    { headers: { 'Authorization': \`Bearer \${API_KEY}\` } }
  );
  
  const identity = await response.json();
  
  const complianceRecord = {
    clientId,
    checkedAt: new Date().toISOString(),
    status: identity.verificationStatus,
    passed: identity.verificationStatus === 'verified'
  };
  
  await saveComplianceRecord(complianceRecord);
  
  if (!complianceRecord.passed) {
    await flagClientForReview(clientId);
  }
  
  return complianceRecord;
}`,
  },
];

// --- Helper: Method badge color ---
function getMethodColor(method) {
  switch (method) {
    case 'GET': return { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)', text: '#34D399' };
    case 'POST': return { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)', text: '#60A5FA' };
    case 'PUT': return { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', text: '#FBBF24' };
    case 'DELETE': return { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.3)', text: '#F87171' };
    default: return { bg: 'rgba(183,148,246,0.15)', border: 'rgba(183,148,246,0.3)', text: '#B794F6' };
  }
}

// --- Main Component ---
export default function DocumentationViewer() {
  const [activeSection, setActiveSection] = useState('endpoints');

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(183,148,246,0.12)',
            border: '1px solid rgba(183,148,246,0.25)',
          }}
        >
          <Book className="w-5 h-5" style={{ color: '#B794F6' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0EAFF' }}>
            API Documentation
          </h1>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
            Complete reference for the Ownly Identity Verification API.
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {[
          { id: 'endpoints', label: 'Endpoints', icon: Code },
          { id: 'authentication', label: 'Authentication', icon: Key },
          { id: 'guides', label: 'Integration Guides', icon: FileText },
          { id: 'sandbox', label: 'Sandbox', icon: Play },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeSection === id
                ? 'rgba(183,148,246,0.15)'
                : 'rgba(183,148,246,0.04)',
              border: `1px solid ${activeSection === id ? 'rgba(183,148,246,0.4)' : 'rgba(183,148,246,0.12)'}`,
              color: activeSection === id ? '#B794F6' : 'rgba(240,234,255,0.6)',
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      {activeSection === 'endpoints' && <EndpointsSection />}
      {activeSection === 'authentication' && <AuthenticationSection />}
      {activeSection === 'guides' && <IntegrationGuidesSection />}
      {activeSection === 'sandbox' && <SandboxSection />}
    </div>
  );
}


// --- Sandbox Section ---
function SandboxSection() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0].id);
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('ownly_sandbox_api_key') || '';
    } catch {
      return '';
    }
  });
  const [params, setParams] = useState({});
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [request, setRequest] = useState(null);

  const endpoint = ENDPOINTS.find((e) => e.id === selectedEndpoint);
  const API_BASE_URL = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

  const handleApiKeyChange = (value) => {
    setApiKey(value);
    try {
      localStorage.setItem('ownly_sandbox_api_key', value);
    } catch {
      // localStorage not available
    }
  };

  const handleParamChange = (name, value) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const buildUrl = () => {
    if (!endpoint) return '';
    let url = `${API_BASE_URL}${endpoint.path}`;
    // Replace path params
    endpoint.parameters
      .filter((p) => p.location === 'path')
      .forEach((p) => {
        const value = params[p.name] || `:${p.name}`;
        url = url.replace(`:${p.name}`, encodeURIComponent(value));
      });
    return url;
  };

  const buildBody = () => {
    const bodyParams = endpoint.parameters.filter((p) => p.location === 'body');
    if (bodyParams.length === 0) return null;
    const body = {};
    bodyParams.forEach((p) => {
      if (params[p.name] !== undefined && params[p.name] !== '') {
        body[p.name] = params[p.name];
      }
    });
    return Object.keys(body).length > 0 ? JSON.stringify(body, null, 2) : null;
  };

  const executeRequest = async () => {
    if (!endpoint) return;

    setLoading(true);
    setResponse(null);

    const url = buildUrl();
    const body = buildBody();
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    const requestInfo = {
      method: endpoint.method,
      url,
      headers,
      body: body || null,
    };
    setRequest(requestInfo);

    try {
      const fetchOptions = {
        method: endpoint.method,
        headers,
      };
      if (body && endpoint.method !== 'GET') {
        fetchOptions.body = body;
      }

      const startTime = performance.now();
      const res = await fetch(url, fetchOptions);
      const duration = Math.round(performance.now() - startTime);

      // Extract response headers
      const responseHeaders = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseBody;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await res.json();
      } else {
        responseBody = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        duration,
      });
    } catch (err) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: { error: err.message || 'Failed to connect to the API server' },
        duration: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
        Test API calls directly from your browser using your API key. Select an endpoint, fill in the parameters, and execute the request to see the full response.
      </p>

      {/* Endpoint Selector */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.12)',
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B794F6' }}>
          Select Endpoint
        </h3>
        <div className="grid gap-2">
          {ENDPOINTS.map((ep) => {
            const methodColor = getMethodColor(ep.method);
            const isSelected = ep.id === selectedEndpoint;
            return (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep.id);
                  setParams({});
                  setResponse(null);
                  setRequest(null);
                }}
                className="flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                style={{
                  background: isSelected ? 'rgba(183,148,246,0.1)' : 'transparent',
                  border: `1px solid ${isSelected ? 'rgba(183,148,246,0.3)' : 'rgba(183,148,246,0.08)'}`,
                }}
              >
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0"
                  style={{
                    background: methodColor.bg,
                    border: `1px solid ${methodColor.border}`,
                    color: methodColor.text,
                  }}
                >
                  {ep.method}
                </span>
                <code className="text-xs font-mono" style={{ color: isSelected ? '#F0EAFF' : 'rgba(240,234,255,0.6)' }}>
                  {ep.path}
                </code>
              </button>
            );
          })}
        </div>
      </div>

      {/* API Key Input */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.12)',
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B794F6' }}>
          API Key
        </h3>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => handleApiKeyChange(e.target.value)}
          placeholder="Enter your API key..."
          className="w-full px-4 py-2.5 rounded-lg text-sm font-mono outline-none transition-all"
          style={{
            background: 'rgba(7,5,16,0.6)',
            border: '1px solid rgba(183,148,246,0.15)',
            color: '#F0EAFF',
          }}
        />
        <p className="text-xs mt-2" style={{ color: 'rgba(240,234,255,0.4)' }}>
          Your API key is stored locally in your browser and never sent to our servers (only to the API endpoint).
        </p>
      </div>

      {/* Parameters */}
      {endpoint && endpoint.parameters.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.12)',
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B794F6' }}>
            Parameters
          </h3>
          <div className="space-y-3">
            {endpoint.parameters.map((param) => (
              <div key={param.name}>
                <label className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold" style={{ color: '#F0EAFF' }}>
                    {param.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(183,148,246,0.08)', color: 'rgba(240,234,255,0.5)' }}>
                    {param.location}
                  </span>
                  {param.required && (
                    <span className="text-[10px] font-semibold" style={{ color: '#F87171' }}>required</span>
                  )}
                </label>
                <input
                  type="text"
                  value={params[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  placeholder={param.description}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(7,5,16,0.6)',
                    border: '1px solid rgba(183,148,246,0.15)',
                    color: '#F0EAFF',
                  }}
                />
                <p className="text-[10px] mt-1" style={{ color: 'rgba(240,234,255,0.4)' }}>
                  {param.type} — {param.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={executeRequest}
        disabled={loading || !apiKey}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(183,148,246,0.15)',
          border: '1px solid rgba(183,148,246,0.4)',
          color: '#B794F6',
        }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {loading ? 'Sending...' : 'Send Request'}
      </button>

      {/* Request Display */}
      {request && (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.12)',
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B794F6' }}>
            Request
          </h3>
          <div
            className="rounded-lg p-4 space-y-2"
            style={{
              background: 'rgba(7,5,16,0.7)',
              border: '1px solid rgba(183,148,246,0.12)',
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded uppercase"
                style={{
                  background: getMethodColor(request.method).bg,
                  border: `1px solid ${getMethodColor(request.method).border}`,
                  color: getMethodColor(request.method).text,
                }}
              >
                {request.method}
              </span>
              <code className="text-xs font-mono break-all" style={{ color: '#F0EAFF' }}>
                {request.url}
              </code>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(240,234,255,0.4)' }}>
                Headers
              </span>
              <pre className="text-xs font-mono mt-1 whitespace-pre-wrap" style={{ color: 'rgba(240,234,255,0.7)' }}>
                {Object.entries(request.headers).map(([key, value]) => {
                  const displayValue = key.toLowerCase() === 'authorization' ? 'Bearer ••••••••' : value;
                  return `${key}: ${displayValue}`;
                }).join('\n')}
              </pre>
            </div>
            {request.body && (
              <div className="mt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(240,234,255,0.4)' }}>
                  Body
                </span>
                <pre className="text-xs font-mono mt-1 whitespace-pre-wrap" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  {request.body}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.12)',
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B794F6' }}>
            Response
          </h3>
          <div
            className="rounded-lg p-4 space-y-3"
            style={{
              background: 'rgba(7,5,16,0.7)',
              border: '1px solid rgba(183,148,246,0.12)',
            }}
          >
            {/* Status Line */}
            <div className="flex items-center gap-3">
              <span
                className="text-sm font-bold px-2.5 py-1 rounded"
                style={{
                  background: response.status >= 200 && response.status < 300
                    ? 'rgba(52,211,153,0.12)'
                    : response.status >= 400
                      ? 'rgba(248,113,113,0.12)'
                      : 'rgba(251,191,36,0.12)',
                  border: `1px solid ${
                    response.status >= 200 && response.status < 300
                      ? 'rgba(52,211,153,0.3)'
                      : response.status >= 400
                        ? 'rgba(248,113,113,0.3)'
                        : 'rgba(251,191,36,0.3)'
                  }`,
                  color: response.status >= 200 && response.status < 300
                    ? '#34D399'
                    : response.status >= 400
                      ? '#F87171'
                      : '#FBBF24',
                }}
              >
                {response.status} {response.statusText}
              </span>
              {response.duration > 0 && (
                <span className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>
                  {response.duration}ms
                </span>
              )}
            </div>

            {/* Response Headers */}
            {Object.keys(response.headers).length > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(240,234,255,0.4)' }}>
                  Response Headers
                </span>
                <pre className="text-xs font-mono mt-1 whitespace-pre-wrap" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  {Object.entries(response.headers).map(([key, value]) => `${key}: ${value}`).join('\n')}
                </pre>
              </div>
            )}

            {/* Response Body */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(240,234,255,0.4)' }}>
                Body
              </span>
              <pre className="text-xs font-mono mt-1 whitespace-pre-wrap overflow-x-auto" style={{ color: '#F0EAFF' }}>
                {typeof response.body === 'object'
                  ? JSON.stringify(response.body, null, 2)
                  : response.body}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// --- Endpoints Section ---
function EndpointsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm mb-6" style={{ color: 'rgba(240,234,255,0.6)' }}>
        The Identity API provides endpoints for verifying identities, checking uniqueness, and looking up existing records.
        All endpoints require authentication via API key.
      </p>
      {ENDPOINTS.map((endpoint) => (
        <EndpointCard key={endpoint.id} endpoint={endpoint} />
      ))}
    </div>
  );
}

// --- Single Endpoint Card ---
function EndpointCard({ endpoint }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('javascript');
  const methodColor = getMethodColor(endpoint.method);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(183,148,246,0.04)',
        border: '1px solid rgba(183,148,246,0.12)',
      }}
    >
      {/* Endpoint Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left transition-all hover:bg-white/[0.02]"
      >
        <span className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4" style={{ color: 'rgba(240,234,255,0.4)' }} />
          ) : (
            <ChevronRight className="w-4 h-4" style={{ color: 'rgba(240,234,255,0.4)' }} />
          )}
        </span>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide flex-shrink-0"
          style={{
            background: methodColor.bg,
            border: `1px solid ${methodColor.border}`,
            color: methodColor.text,
          }}
        >
          {endpoint.method}
        </span>
        <code className="text-sm font-mono" style={{ color: '#F0EAFF' }}>
          {endpoint.path}
        </code>
        <span className="text-xs ml-auto hidden sm:inline" style={{ color: 'rgba(240,234,255,0.4)' }}>
          {endpoint.description.slice(0, 60)}...
        </span>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-5 pt-1 space-y-5" style={{ borderTop: '1px solid rgba(183,148,246,0.08)' }}>
          {/* Description */}
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
            {endpoint.description}
          </p>

          {/* Parameters */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B794F6' }}>
              Parameters
            </h4>
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(183,148,246,0.1)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(183,148,246,0.06)' }}>
                    <th className="text-left px-3 py-2 font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>Name</th>
                    <th className="text-left px-3 py-2 font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>Location</th>
                    <th className="text-left px-3 py-2 font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>Type</th>
                    <th className="text-left px-3 py-2 font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>Required</th>
                    <th className="text-left px-3 py-2 font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.parameters.map((param) => (
                    <tr key={param.name} style={{ borderTop: '1px solid rgba(183,148,246,0.06)' }}>
                      <td className="px-3 py-2">
                        <code className="text-xs font-mono" style={{ color: '#B794F6' }}>{param.name}</code>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>{param.location}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>{param.type}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: param.required ? '#34D399' : 'rgba(240,234,255,0.4)' }}
                        >
                          {param.required ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>{param.description}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Response Format */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B794F6' }}>
              Response ({endpoint.response.status})
            </h4>
            <CodeBlock code={endpoint.response.body} language="json" />
          </div>

          {/* Code Examples */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B794F6' }}>
              Code Examples
            </h4>
            <div className="flex gap-1 mb-3">
              {['javascript', 'python', 'curl'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                  style={{
                    background: activeTab === tab ? 'rgba(183,148,246,0.15)' : 'transparent',
                    border: `1px solid ${activeTab === tab ? 'rgba(183,148,246,0.3)' : 'transparent'}`,
                    color: activeTab === tab ? '#B794F6' : 'rgba(240,234,255,0.5)',
                  }}
                >
                  {tab === 'curl' ? 'cURL' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <CodeBlock code={endpoint.examples[activeTab]} language={activeTab} />
          </div>
        </div>
      )}
    </div>
  );
}


// --- Authentication Section ---
function AuthenticationSection() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.12)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5" style={{ color: '#B794F6' }} />
          <h3 className="text-lg font-semibold" style={{ color: '#F0EAFF' }}>
            API Key Authentication
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'rgba(240,234,255,0.7)' }}>
          All API requests must include your API key in the <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(183,148,246,0.1)', color: '#B794F6' }}>Authorization</code> header using the Bearer scheme.
        </p>
        <div
          className="rounded-lg p-4 mb-4"
          style={{
            background: 'rgba(7,5,16,0.6)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <code className="text-sm font-mono" style={{ color: '#34D399' }}>
            Authorization: Bearer YOUR_API_KEY
          </code>
        </div>
        <p className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
          Replace <code className="font-mono">YOUR_API_KEY</code> with the API key generated from your Business Portal dashboard.
        </p>
      </div>

      {/* Getting Your Key */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.12)',
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#F0EAFF' }}>
          Getting Your API Key
        </h3>
        <ol className="space-y-3">
          {[
            'Log in to the Business Portal at /business/dashboard',
            'Navigate to the "API Keys" section in the sidebar',
            'Click "Generate API Key" to create your first key',
            'Copy and securely store the key — it is shown only once',
            'Use the key in the Authorization header for all API requests',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'rgba(183,148,246,0.12)',
                  border: '1px solid rgba(183,148,246,0.25)',
                  color: '#B794F6',
                }}
              >
                {i + 1}
              </span>
              <span className="text-sm pt-0.5" style={{ color: 'rgba(240,234,255,0.7)' }}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Security Best Practices */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.12)',
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#F0EAFF' }}>
          Security Best Practices
        </h3>
        <ul className="space-y-2">
          {[
            'Never expose your API key in client-side code or public repositories',
            'Store keys in environment variables or a secrets manager',
            'Rotate your key periodically using the "Regenerate" feature',
            'Revoke compromised keys immediately from the API Keys page',
            'Use HTTPS for all API requests to prevent key interception',
            'Monitor your Usage Dashboard for unexpected activity patterns',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#34D399' }} />
              <span className="text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
                {tip}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Error Responses */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.12)',
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#F0EAFF' }}>
          Authentication Error Responses
        </h3>
        <div className="space-y-3">
          <div
            className="rounded-lg p-3"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold" style={{ color: '#F87171' }}>401 Unauthorized</span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
              Returned when no API key is provided or the key is invalid/expired. Check that your Authorization header is correctly formatted.
            </p>
          </div>
          <div
            className="rounded-lg p-3"
            style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold" style={{ color: '#FBBF24' }}>403 Forbidden</span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
              Returned when the API key is valid but does not have the required permissions for the requested endpoint.
            </p>
          </div>
          <div
            className="rounded-lg p-3"
            style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold" style={{ color: '#60A5FA' }}>429 Too Many Requests</span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
              Returned when you exceed your rate limit. Default rate limit is 100 requests per minute. Check the Retry-After header for wait time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- Integration Guides Section ---
function IntegrationGuidesSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm mb-6" style={{ color: 'rgba(240,234,255,0.6)' }}>
        Step-by-step guides for integrating Ownly identity verification into common business workflows.
      </p>
      {INTEGRATION_GUIDES.map((guide) => (
        <IntegrationGuideCard key={guide.id} guide={guide} />
      ))}
    </div>
  );
}

// --- Single Integration Guide Card ---
function IntegrationGuideCard({ guide }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = guide.icon;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(183,148,246,0.04)',
        border: '1px solid rgba(183,148,246,0.12)',
      }}
    >
      {/* Guide Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-5 text-left transition-all hover:bg-white/[0.02]"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(183,148,246,0.1)',
            border: '1px solid rgba(183,148,246,0.2)',
          }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: '#B794F6' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>
            {guide.title}
          </h3>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(240,234,255,0.5)' }}>
            {guide.description}
          </p>
        </div>
        <span className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4" style={{ color: 'rgba(240,234,255,0.4)' }} />
          ) : (
            <ChevronRight className="w-4 h-4" style={{ color: 'rgba(240,234,255,0.4)' }} />
          )}
        </span>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 space-y-5" style={{ borderTop: '1px solid rgba(183,148,246,0.08)' }}>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
            {guide.description}
          </p>

          {/* Steps */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B794F6' }}>
              Implementation Steps
            </h4>
            <ol className="space-y-2.5">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{
                      background: 'rgba(183,148,246,0.12)',
                      border: '1px solid rgba(183,148,246,0.25)',
                      color: '#B794F6',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Code Example */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#B794F6' }}>
              Example Code
            </h4>
            <CodeBlock code={guide.codeSnippet} language="javascript" />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reusable Code Block with Copy ---
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        background: 'rgba(7,5,16,0.7)',
        border: '1px solid rgba(183,148,246,0.12)',
      }}
    >
      {/* Language label + Copy button */}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid rgba(183,148,246,0.08)' }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.35)' }}>
          {language === 'curl' ? 'cURL' : language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all hover:scale-105"
          style={{
            background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(183,148,246,0.08)',
            color: copied ? '#34D399' : 'rgba(240,234,255,0.5)',
          }}
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {/* Code content */}
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="font-mono" style={{ color: '#F0EAFF' }}>
          {code}
        </code>
      </pre>
    </div>
  );
}
