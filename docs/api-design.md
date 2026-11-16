# GreenLedger REST API Specification (v1)

## 1. Protocol Conventions

- **Base URL**: `/api/v1`
- **Format**: JSON (`Content-Type: application/json`)
- **Authentication**: JWT Bearer Token passed via HTTP Header: `Authorization: Bearer <TOKEN>`
- **Standard Success Response Envelope**:
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
- **Standard Error Response Envelope**:
  ```json
  {
    "success": false,
    "status": 400,
    "error": "Descriptive error message"
  }
  ```

---

## 2. API Endpoints

### 2.1. System & Health
#### `GET /health`
Returns system status, active database connection mode, and configured Sepolia contract addresses.
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "platform": "GreenLedger P2P Energy Trading API",
    "version": "1.0.0",
    "environment": "development",
    "timestamp": "2026-11-16T13:30:00.000Z",
    "uptimeSeconds": 1420,
    "database": {
      "connected": true,
      "timestamp": "2026-11-16T13:30:00.000Z"
    },
    "blockchain": {
      "network": "Ethereum Sepolia (ChainId: 11155111)",
      "settlementContract": "0x...",
      "certificateContract": "0x..."
    }
  }
  ```

---

### 2.2. Authentication
#### `POST /auth/wallet`
Authenticates an Ethereum wallet address, issuing a JWT signed token with role-based permissions.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "role": "PRODUCER",
    "name": "Helios Solar Park"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "role": "PRODUCER",
      "name": "Helios Solar Park",
      "meterId": "METER-PROD-SOL-101",
      "reputationScore": 99.2
    }
  }
  ```

#### `GET /auth/me`
Retrieves the authenticated user profile.
- **Access**: Authenticated (`Bearer <TOKEN>`)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": {
      "userId": 2,
      "walletAddress": "0x7099...",
      "role": "PRODUCER",
      "meterId": "METER-PROD-SOL-101"
    }
  }
  ```

---

### 2.3. Marketplace (Listings & Demands)
#### `GET /market/listings`
Fetches active energy listings sorted in merit-order (cheapest unit price first).
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      {
        "id": 2,
        "producer_id": 3,
        "energy_source": "WIND",
        "quantity_kwh": 300.0,
        "available_kwh": 300.0,
        "unit_price_eth": "0.00008200",
        "status": "ACTIVE"
      }
    ]
  }
  ```

#### `POST /market/listings`
Allows a registered producer or admin to create an energy listing.
- **Access**: Producer or Admin (`Bearer <TOKEN>`)
- **Request Body**:
  ```json
  {
    "energySource": "SOLAR",
    "quantityKwh": 100.0,
    "unitPriceEth": 0.000085,
    "minPurchaseKwh": 5.0
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "id": 11,
      "producer_id": 2,
      "energy_source": "SOLAR",
      "quantity_kwh": 100.0,
      "available_kwh": 100.0,
      "unit_price_eth": "0.00008500",
      "status": "ACTIVE"
    }
  }
  ```

#### `GET /market/requests`
Retrieves pending energy purchase requests submitted by consumers.
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      {
        "id": 1,
        "consumer_id": 6,
        "requested_kwh": 80.0,
        "max_acceptable_price_eth": "0.00012000",
        "priority_weight": 2.0,
        "urgency_level": "HIGH",
        "status": "PENDING"
      }
    ]
  }
  ```

#### `POST /market/requests`
Submits a consumer energy demand order.
- **Access**: Consumer or Admin (`Bearer <TOKEN>`)
- **Request Body**:
  ```json
  {
    "requestedKwh": 50.0,
    "maxPriceEth": 0.000095,
    "priorityWeight": 1.5,
    "urgencyLevel": "NORMAL"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "id": 12,
      "consumer_id": 5,
      "requested_kwh": 50.0,
      "allocated_kwh": 0.0,
      "max_acceptable_price_eth": "0.00009500",
      "priority_weight": 1.5,
      "status": "PENDING"
    }
  }
  ```

#### `GET /market/pricing/quote`
Queries the rule-based dynamic pricing engine for tariff recommendations.
- **Access**: Public
- **Query Params**: `energySource=SOLAR&hourOfDay=14`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "quote": {
      "baseTariffEth": 0.0001,
      "recommendedPriceEth": 0.000092,
      "touMultiplier": 1.0,
      "supplyDemandRatio": 0.6,
      "imbalanceIndex": -0.25,
      "isPeakHour": false,
      "priceFloorEth": 0.00004,
      "priceCeilingEth": 0.00025
    }
  }
  ```

#### `GET /market/simulation/feed`
Retrieves mathematical simulation telemetry for solar irradiance, wind speed, and hydro capacity.
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "simulationTimestamp": "2026-11-16T13:30:00.000Z",
    "hourOfDay": 14,
    "sources": {
      "solar": { "outputKwh": 86.4, "solarIrradianceWm2": 890.2, "tempC": 28 },
      "wind": { "outputKwh": 142.1, "windSpeedMs": 8.5, "turbineState": "GENERATING" },
      "hydro": { "outputKwh": 70.0, "flowRateM3s": 3.5, "headM": 25 }
    }
  }
  ```

---

### 2.4. Settlement & Matching
#### `POST /settlement/match`
Executes an off-chain double auction matching and proportional allocation cycle.
- **Access**: Admin (`Bearer <TOKEN>`)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "cycle": {
      "cycleNumber": 1731765000000,
      "totalDemandKwh": 330.0,
      "totalSupplyKwh": 550.0,
      "matchedTradesCount": 3,
      "matchedTrades": [
        {
          "tradeHash": "0x4f87ab...",
          "listingId": 1,
          "requestId": 1,
          "producerId": 2,
          "consumerId": 6,
          "energyAmountKwh": 80.0,
          "unitPriceEth": 0.000088,
          "totalCostEth": 0.00704,
          "carbonSavedKg": 62.32,
          "status": "PENDING_ON_CHAIN_SETTLEMENT"
        }
      ]
    },
    "summary": {
      "totalMatchedEnergyKwh": 330.0,
      "totalTradeValueEth": 0.0285,
      "matchedCount": 3
    }
  }
  ```

#### `GET /settlement/history`
Returns historical trade settlements.
- **Access**: Authenticated (`Bearer <TOKEN>`)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "id": 1,
        "trade_hash": "0x4f87ab...",
        "producer_id": 2,
        "consumer_id": 6,
        "energy_amount_kwh": 80.0,
        "unit_price_eth": "0.00008800",
        "total_amount_eth": "0.00704000",
        "carbon_saved_kg": 65.6,
        "settlement_status": "ON_CHAIN_SETTLED",
        "tx_hash": "0x9a8f3b...",
        "block_number": 5839210
      }
    ]
  }
  ```

---

### 2.5. Certificates & Carbon
#### `GET /certificates`
Lists issued Renewable Energy Certificates (RECs).
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "id": 1,
        "token_id": 1,
        "owner_address": "0x9965...",
        "producer_address": "0x7099...",
        "energy_amount_kwh": 80.0,
        "carbon_offset_kg": 65.6,
        "energy_source": "SOLAR",
        "is_retired": false
      }
    ]
  }
  ```

#### `GET /certificates/verify/:tokenId`
Verifies the cryptographic validity and retirement status of an REC token.
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "isValid": true,
    "certificate": {
      "token_id": 1,
      "energy_amount_kwh": 80.0,
      "carbon_offset_kg": 65.6,
      "energy_source": "SOLAR",
      "is_retired": false
    }
  }
  ```

#### `GET /certificates/calculate-offsets`
Computes GHG reduction metrics for any arbitrary energy quantity.
- **Access**: Public
- **Query Params**: `energyKwh=100&energySource=SOLAR`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "carbonMetrics": {
      "energyAmountKwh": 100.0,
      "energySource": "SOLAR",
      "gridBaselineKgPerKwh": 0.82,
      "sourceFactorKgPerKwh": 0.041,
      "carbonSavedKg": 77.9,
      "carbonSavedGrams": 77900,
      "equivalencies": {
        "treesPlantedEquivalentYear": 3.58,
        "gasolineLitersAvoided": 33.72,
        "carKmAvoided": 649.17
      }
    }
  }
  ```

---

### 2.6. Administration
#### `GET /admin/users`
Lists all registered platform participants.
- **Access**: Admin (`Bearer <TOKEN>`)

#### `GET /admin/pricing-parameters`
Fetches global dynamic pricing parameters.
- **Access**: Admin (`Bearer <TOKEN>`)

#### `GET /admin/stats`
Platform aggregate volume and carbon offset analytics.
- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "stats": {
      "totalParticipants": 7,
      "totalEnergyTradedKwh": 48500.0,
      "totalEthVolume": 4.8453,
      "totalCarbonSavedKg": 34030.0,
      "activeListingsCount": 3,
      "pendingRequestsCount": 3
    }
  }
  ```
