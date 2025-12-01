# Nillion nilCC API Integration Findings

## ✅ API Connection Successful

The nilCC API is working correctly:
- **Base URL**: `https://api.nilcc.nillion.network`
- **API Version**: `v1`
- **Authentication**: `x-api-key` header ✅
- **Account Info Retrieved**: 
  - Account ID: `3d8518fc-ad4b-46c9-8d0f-0110ef9cccd1`
  - Credits: 1,500,000
  - Name: verida

## 📋 Available API Endpoints

From the OpenAPI spec at `https://api.nilcc.nillion.network/openapi.json`:

### Accounts
- `POST /api/v1/accounts/create`
- `GET /api/v1/accounts/me` ✅ (working)
- `POST /api/v1/accounts/list`
- `POST /api/v1/accounts/add-credits`

### Workloads
- `POST /api/v1/workloads/create` - Deploy confidential workloads
- `POST /api/v1/workloads/list` - List workloads
- `GET /api/v1/workloads/{id}` - Get workload details
- `POST /api/v1/workloads/delete` - Delete workload
- `POST /api/v1/workloads/restart` - Restart workload
- `POST /api/v1/workloads/logs` - Get workload logs
- `POST /api/v1/workloads/stats` - Get workload statistics

### Artifacts
- `POST /api/v1/artifacts/list` - List available VM images
- `POST /api/v1/artifacts/enable`
- `POST /api/v1/artifacts/disable`

### Workload Containers
- `POST /api/v1/workload-containers/list`
- `POST /api/v1/workload-containers/logs`

## ⚠️ SecretSigner Not in API

**Finding**: SecretSigner endpoints are **NOT** in the nilCC API.

The nilCC API is for managing **confidential workloads**, not for direct SecretSigner operations.

## 🔍 SecretSigner Architecture

Based on the nilCC architecture, SecretSigner likely works as follows:

1. **SecretSigner runs INSIDE a nilCC workload**
   - You create a workload with SecretSigner service
   - The workload runs in a TEE (Trusted Execution Environment)
   - SecretSigner endpoints are exposed by the workload

2. **Attestation comes from running workloads**
   - Per docs: `curl https://[your-running-workload]/nilcc/api/v2/report`
   - Attestation is workload-specific, not account-level

## 🎯 Recommended Approach

### Option 1: Workload-Based SecretSigner (Recommended)

1. **Create a nilCC workload** with SecretSigner service:
   ```bash
   POST /api/v1/workloads/create
   {
     "name": "secret-signer-workload",
     "dockerCompose": "...", // SecretSigner service
     "publicContainerName": "signer",
     "publicContainerPort": 8080,
     ...
   }
   ```

2. **Store keys** via workload endpoint:
   ```
   POST https://[workload-url]/secret-signer/keys/store
   ```

3. **Sign transactions** via workload endpoint:
   ```
   POST https://[workload-url]/secret-signer/sign
   ```

4. **Get attestation** from workload:
   ```
   GET https://[workload-url]/nilcc/api/v2/report
   ```

### Option 2: Check for Separate SecretSigner API

SecretSigner might have its own API (not nilCC):
- Check Nillion docs for "SecretSigner API"
- May be at different base URL
- May require different authentication

## 📝 Next Steps

1. **Check Nillion Documentation** for:
   - SecretSigner API documentation
   - SecretSigner workload examples
   - How to deploy SecretSigner in nilCC

2. **Create SecretSigner Workload** (if workload-based):
   - Use workload creation API
   - Deploy SecretSigner service
   - Get workload URL

3. **Update Implementation**:
   - If workload-based: Update client to call workload endpoints
   - If separate API: Update base URL and endpoints

## 🔗 Resources

- **nilCC API Docs**: https://nillion-docs-git-feat-nilcc-nillion.vercel.app/build/compute/api-reference
- **OpenAPI Spec**: https://api.nilcc.nillion.network/openapi.json
- **Nillion Discord**: https://discord.gg/nillion

## Current Status

✅ **nilCC API**: Connected and working
✅ **Authentication**: API key valid
✅ **Account Access**: Successfully retrieved account info
⚠️ **SecretSigner**: Not found in nilCC API - needs workload-based approach or separate API
⚠️ **Attestation**: Must come from running workload, not API endpoint

