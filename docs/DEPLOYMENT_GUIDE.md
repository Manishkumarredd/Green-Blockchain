# GreenLedger – Deployment & Operations Guide
**Phase 11 Operations Manual**  
**Project:** GreenLedger – Peer-to-Peer Renewable Energy Trading Platform  
**Target Environments:** Local Development / Production AWS Cloud Hybrid  
**Date:** November 2026  

---

## 1. System Requirements & Prerequisites

### Local Development Environment
- **Node.js:** v20.x or v22.x+ (Recommended: LTS)
- **Package Manager:** npm v10+
- **Database:** PostgreSQL 16+ (or local Docker container)
- **Web3 Wallet:** MetaMask Browser Extension configured with Ethereum Sepolia Testnet
- **Testnet ETH:** Sepolia faucet ETH for contract interactions

### AWS Cloud Environment (Hybrid Production)
- **AWS CLI:** Version 2.15+ authenticated via IAM Identity Center (SSO) or IAM User credentials
- **AWS Region:** `ap-southeast-2` (Sydney)
- **AWS Services Required:** AWS Amplify, AWS Lambda, Amazon API Gateway, Amazon RDS (PostgreSQL), Amazon S3, Amazon CloudWatch, AWS Budgets

---

## 2. Environment Configuration

### Root & Backend Configuration (`.env`)
Create or edit `.env` in the root workspace or `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://main.d1ceb7y0rzwmpf.amplifyapp.com,http://localhost:3000

# Authentication & Security
JWT_SECRET=greenledger_super_secret_jwt_key_2026_sepolia_secure
JWT_EXPIRES_IN=24h

# PostgreSQL Relational Database (Amazon RDS / Local)
DB_HOST=greenledger-db.c9wie2omm9nv.ap-southeast-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=greenledger_db
DB_USER=postgres
DB_PASSWORD=YourSecureRdsPassword
DB_SSL=true

# Amazon S3 Document Storage
AWS_REGION=ap-southeast-2
S3_BUCKET_NAME=greenledger-data-477579576684-syd

# Blockchain & Ethereum Sepolia Testnet
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_CHAIN_ID=11155111
CONTRACT_ENERGY_TRADING=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
CONTRACT_GREEN_CERTIFICATE=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
CONTRACT_USER_REGISTRY=0x5FbDB2315678afecb367f032d93F642f64180aa3
CONTRACT_MARKETPLACE=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### Frontend Configuration (`frontend/.env.production`)
```env
NEXT_PUBLIC_API_URL=https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_EXPLORER=https://sepolia.etherscan.io
```

---

## 3. Local Development Startup

### 1. Database Initialization
```bash
# Apply schema and seed demonstration data to local/RDS PostgreSQL
node scripts/seed_rds.js
```

### 2. Backend API Server Startup
```bash
cd backend
npm install
npm run dev
# Backend API will be available at http://localhost:5000/api/v1
```

### 3. Frontend Next.js Development Server
```bash
cd frontend
npm install
npm run dev
# Frontend web interface will be available at http://localhost:3000
```

---

## 4. Production AWS Cloud Deployment

### Step 1: Backend Packaging & AWS Lambda Deployment
```bash
# 1. Package backend into optimized deployment bundle
python scripts/build_lambda_zip.py

# 2. Update AWS Lambda function code
aws lambda update-function-code \
  --function-name GreenLedger-API-Engine \
  --zip-file fileb://backend_lambda.zip \
  --region ap-southeast-2

# 3. Verify Lambda health endpoint
curl https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1/health
```

### Step 2: Frontend Static Generation & AWS Amplify Deployment
```bash
# 1. Compile Next.js production static export
cd frontend
npm run build
cd ..

# 2. Package static export into deployment zip
python scripts/build_frontend_zip.py

# 3. Deploy directly to AWS Amplify Hosting
python scripts/deploy_to_amplify.py

# 4. Verify live Amplify domain
curl https://main.d1ceb7y0rzwmpf.amplifyapp.com
```

### Step 3: Run Cloud End-to-End Test Suite
```bash
python scripts/verify_cloud_e2e.py
```

---

## 5. Operations & Disaster Recovery

### Database Backup & Restore
- **Backup:**
  ```bash
  pg_dump -h greenledger-db.c9wie2omm9nv.ap-southeast-2.rds.amazonaws.com -U postgres -d greenledger_db -F c -b -v -f backup.dump
  ```
- **Restore:**
  ```bash
  pg_restore -h greenledger-db.c9wie2omm9nv.ap-southeast-2.rds.amazonaws.com -U postgres -d greenledger_db -v backup.dump
  ```

### AWS Budget & Cost Monitoring
The platform runs an automated AWS Budget named `GreenLedger-Monthly-Cap`:
- **Monthly Limit:** USD \$25.00
- **Threshold 1:** 80% (\$20.00) sends an automated alert to platform administrators.
- **Threshold 2:** 100% (\$25.00) triggers critical spend notifications.
- **Log Retention:** CloudWatch log groups are capped at 7 days to eliminate storage accumulation costs.
