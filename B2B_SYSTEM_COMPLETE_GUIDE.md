# 🚀 Ownly B2B System - Complete Guide

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Quick Start](#quick-start)
3. [API Key Management](#api-key-management)
4. [Client Onboarding](#client-onboarding)
5. [Monitoring & Analytics](#monitoring--analytics)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## System Overview

### Architecture

```
┌─────────────────┐
│   B2B Clients   │
│ (Prop Firms,    │
│  Brokers, etc)  │
└────────┬────────┘
         │ API Key Auth
         ▼
┌─────────────────┐
│  Ownly API      │
│  (Render)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase DB    │
│  - api_keys     │
│  - api_key_usage│
│  - kyc_verif... │
└─────────────────┘
```

### Components

1. **Authentication Layer**: API Key validation middleware
2. **Identity API**: Verification endpoints (protected)
3. **Database**: Supabase (PostgreSQL)
4. **Frontend**: Vercel (public verification UI)
5. **Management Tools**: CLI scripts for admin tasks

---

## Quick Start

### For Administrators

1. **Check System Status**
   ```bash
   cd ownly-backend/api
   node check-ownly-id-backfill.js
   node monitoring-dashboard.js
   ```

2. **Generate API Key for New Client**
   ```bash
   node manage-api-keys.js generate client-id "Client Name" verify:read 1000
   ```

3. **List All API Keys**
   ```bash
   node manage-api-keys.js list
   ```

### For Clients

Clients should refer to `CLIENT_API_DOCUMENTATION.md` for:
- API endpoints
- Authentication
- Code examples
- Error handling

---

## API Key Management

### Generate New API Key

```bash
node manage-api-keys.js generate <client_id> <client_name> [permissions] [rate_limit]
```

**Example**:
```bash
node manage-api-keys.js generate prop-firm-1 "Prop Firm Inc" verify:read,verify:write 5000
```

**Output**:
```
✅ API Key Generated Successfully!

═══════════════════════════════════════════════════════
Client ID: prop-firm-1
Client Name: Prop Firm Inc
API Key: ownly_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Permissions: verify:read, verify:write
Rate Limit: 5000 requests/day
Status: active
═══════════════════════════════════════════════════════

⚠️  IMPORTANT: Save this API key securely!
   It will NOT be shown again.
```

### List All API Keys

```bash
node manage-api-keys.js list
```

### Revoke API Key

```bash
node manage-api-keys.js revoke <key_id>
```

### Update API Key

```bash
# Update rate limit
node manage-api-keys.js update <key_id> rate_limit 10000

# Update permissions
node manage-api-keys.js update <key_id> permissions verify:read,verify:write
```

### View Usage Stats

```bash
node manage-api-keys.js usage <key_id>
```

---

## Client Onboarding

### Step 1: Receive Client Request

When a client requests access:
1. Collect information:
   - Company name
   - Use case (prop firm, broker, exchange)
   - Estimated volume (requests/day)
   - Contact email

### Step 2: Generate API Key

```bash
node manage-api-keys.js generate <client_id> "<client_name>" verify:read <rate_limit>
```

### Step 3: Send Welcome Email

1. **Generate personalized email**:
   ```bash
   node send-client-notification.js
   ```

2. **Email should include**:
   - API key (send securely, e.g., encrypted email or password-protected PDF)
   - Link to `CLIENT_API_DOCUMENTATION.md`
   - Support contact
   - Rate limit information

3. **Attachments**:
   - `CLIENT_API_DOCUMENTATION.md`
   - Code examples (optional)

### Step 4: Monitor Initial Usage

After sending API key:
```bash
node manage-api-keys.js usage <key_id>
```

Check for:
- First successful request
- Error rates
- Integration issues

### Step 5: Follow-up

- Day 1: Confirm API key received
- Day 3: Check integration progress
- Week 1: Review usage patterns
- Month 1: Gather feedback

---

## Monitoring & Analytics

### Real-time Dashboard

```bash
node monitoring-dashboard.js
```

**Output**:
```
📊 Ownly B2B API Monitoring Dashboard

═══════════════════════════════════════════════════════

📅 Period: Last 7 days

🔑 API Keys:
   Active: 5
   Total Requests: 12,450

📈 Performance:
   Success Rate: 99.2%
   Error Rate: 0.8%
   Avg Response Time: 245ms

🔥 Top Endpoints:
   1. /api/identity/:ownlyId: 8,200 requests
   2. /api/identity/verify: 3,100 requests
   3. /api/identity/:ownlyId/unique: 1,150 requests

👥 Top Clients (by API Key ID):
   Prop Firm Inc: 5,600 requests
   Broker XYZ: 4,200 requests
   Exchange ABC: 2,650 requests

⚠️  Alerts:
   ✅ No alerts

═══════════════════════════════════════════════════════
```

### Export Metrics

```bash
node monitoring-dashboard.js export 30 monthly-report.json
```

### Custom Period

```bash
# Last 30 days
node monitoring-dashboard.js dashboard 30

# Last 90 days
node monitoring-dashboard.js dashboard 90
```

---

## Troubleshooting

### Common Issues

#### 1. Client Reports "API key required" Error

**Cause**: Missing or incorrect Authorization header

**Solution**:
```bash
# Verify API key exists and is active
node manage-api-keys.js list

# Check if client is using correct format
# Correct: Authorization: Bearer ownly_xxxxx
# Wrong: Authorization: ownly_xxxxx
```

#### 2. Client Exceeds Rate Limit

**Symptoms**: 429 Too Many Requests errors

**Solution**:
```bash
# Check current usage
node manage-api-keys.js usage <key_id>

# Increase rate limit if justified
node manage-api-keys.js update <key_id> rate_limit 10000
```

#### 3. High Error Rate

**Check**:
```bash
node monitoring-dashboard.js
```

**Common causes**:
- Invalid Ownly IDs (client sending wrong format)
- Database connectivity issues
- Supabase rate limiting

**Solution**:
- Review recent activity in dashboard
- Check Render logs
- Verify Supabase connection

#### 4. Slow Response Times

**Check**:
```bash
node monitoring-dashboard.js
```

**If avg response time > 1000ms**:
- Check Render server status
- Verify Supabase performance
- Review database indexes
- Consider upgrading Render plan

---

## Best Practices

### Security

1. **API Key Storage**
   - Never commit API keys to Git
   - Store in environment variables
   - Use secrets management (e.g., AWS Secrets Manager)

2. **Rate Limiting**
   - Set appropriate limits per client
   - Monitor usage patterns
   - Adjust limits based on legitimate needs

3. **Monitoring**
   - Run daily dashboard checks
   - Set up alerts for high error rates
   - Review usage logs weekly

### Client Management

1. **Onboarding**
   - Provide clear documentation
   - Offer integration support
   - Set expectations on rate limits

2. **Communication**
   - Notify clients of API changes 30 days in advance
   - Provide migration guides
   - Maintain changelog

3. **Support**
   - Respond to issues within 24 hours
   - Maintain support email (support@ownly.io)
   - Create FAQ based on common questions

### Performance

1. **Database**
   - Monitor query performance
   - Keep indexes updated
   - Archive old usage logs (>90 days)

2. **Caching**
   - Consider Redis for frequently accessed data
   - Cache verification results (with TTL)

3. **Scaling**
   - Monitor Render metrics
   - Upgrade plan when approaching limits
   - Consider load balancing for high traffic

---

## Maintenance Tasks

### Daily

- [ ] Check monitoring dashboard
- [ ] Review error logs
- [ ] Respond to client support requests

### Weekly

- [ ] Review usage patterns
- [ ] Check for rate limit violations
- [ ] Update client documentation if needed

### Monthly

- [ ] Export metrics report
- [ ] Review and adjust rate limits
- [ ] Archive old usage logs
- [ ] Client satisfaction survey

### Quarterly

- [ ] Security audit
- [ ] Performance optimization
- [ ] Client feedback review
- [ ] Roadmap planning

---

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `check-ownly-id-backfill.js` | Check database backfill status | `node check-ownly-id-backfill.js` |
| `fix-ownly-id-mismatch.js` | Fix data inconsistencies | `node fix-ownly-id-mismatch.js` |
| `manage-api-keys.js` | API key management | `node manage-api-keys.js <command>` |
| `monitoring-dashboard.js` | View metrics and alerts | `node monitoring-dashboard.js` |
| `send-client-notification.js` | Generate client emails | `node send-client-notification.js` |

---

## Support

### For Administrators

- **Documentation**: This guide
- **Logs**: Render dashboard → Logs
- **Database**: Supabase dashboard → SQL Editor

### For Clients

- **Email**: support@ownly.io
- **Documentation**: `CLIENT_API_DOCUMENTATION.md`
- **Status Page**: https://status.ownly.io (if available)

---

## Changelog

### v2.0.0 (2026-04-27)
- ✨ Implemented B2B security with API key authentication
- 🔒 Protected all identity endpoints
- 🐛 Fixed Ownly ID verification inconsistency
- 📊 Added monitoring and analytics tools
- 📚 Created comprehensive documentation

### v1.0.0 (2026-04-01)
- 🎉 Initial release (public API - deprecated)

---

**Last Updated**: April 27, 2026  
**Version**: 2.0.0  
**Maintained by**: Ownly Team
