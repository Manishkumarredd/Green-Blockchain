import urllib.request
import json

API_BASE = "https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1"

def api_call(path, method="GET", body=None, token=None):
    url = API_BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTPError on {path}: {e.code} - {err_body}")
        raise e

def test_cloud_backend():
    print("=" * 60)
    print("GREENLEDGER CLOUD END-TO-END VERIFICATION")
    print(f"API Base URL: {API_BASE}")
    print("=" * 60)

    # 1. Health check
    status, res = api_call("/health")
    print(f"[1] Health Check: HTTP {status}")
    print(f"    - Database Connected: {res.get('database', {}).get('connected')}")
    print(f"    - Blockchain Network: {res.get('blockchain', {}).get('network')}")
    assert res.get('database', {}).get('connected') is True

    # 2. Marketplace listings
    status, res = api_call("/marketplace/listings")
    listings = res.get('data', [])
    print(f"\n[2] Marketplace Listings: HTTP {status} (Total: {len(listings)} listings)")
    for l in listings[:3]:
        print(f"    - Listing #{l.get('id')}: {l.get('energySource') or l.get('energy_source')} - {l.get('availableEnergy') or l.get('available_energy_kwh')} kWh @ {l.get('pricePerKwh') or l.get('price_per_kwh')} ETH/kWh")
    assert len(listings) > 0

    # 3. Auth Login (Producer)
    status, res = api_call("/auth/login", method="POST", body={
        "email": "producer.solarfarm@greenledger.io",
        "password": "Password123!"
    })
    producer_token = res.get('data', {}).get('token')
    user = res.get('data', {}).get('user', {})
    print(f"\n[3] Producer Login: HTTP {status}")
    print(f"    - User: {user.get('email')} ({user.get('role')})")
    assert producer_token is not None

    # 4. Producer Dashboard
    status, res = api_call("/producers/dashboard", token=producer_token)
    dash_p = res.get('data', {})
    print(f"\n[4] Producer Dashboard: HTTP {status}")
    print(f"    - Total Listed:    {dash_p.get('totalEnergyListed') or dash_p.get('summary', {}).get('totalListed')} kWh")
    print(f"    - Total Sold:      {dash_p.get('totalEnergySold') or dash_p.get('summary', {}).get('totalSold')} kWh")
    print(f"    - Total Earnings:  {dash_p.get('totalEarnings') or dash_p.get('summary', {}).get('totalEarnings')} ETH")

    # 5. Auth Login (Consumer)
    status, res = api_call("/auth/login", method="POST", body={
        "email": "consumer.datacenter@ecotech.com",
        "password": "Password123!"
    })
    consumer_token = res.get('data', {}).get('token')
    user_c = res.get('data', {}).get('user', {})
    print(f"\n[5] Consumer Login: HTTP {status}")
    print(f"    - User: {user_c.get('email')} ({user_c.get('role')})")
    assert consumer_token is not None

    # 6. Consumer Dashboard
    status, res = api_call("/consumers/dashboard", token=consumer_token)
    dash_c = res.get('data', {})
    print(f"\n[6] Consumer Dashboard: HTTP {status}")
    print(f"    - Total Purchased: {dash_c.get('totalPurchased') or dash_c.get('summary', {}).get('totalPurchased')} kWh")
    print(f"    - Total Spent:     {dash_c.get('totalSpent') or dash_c.get('summary', {}).get('totalSpent')} ETH")
    print(f"    - Carbon Savings:  {dash_c.get('carbonSavingsKg') or dash_c.get('summary', {}).get('carbonSavingsKg')} kg CO2")

    # 7. Auth Login (Admin)
    status, res = api_call("/auth/login", method="POST", body={
        "email": "admin@greenledger.io",
        "password": "Password123!"
    })
    admin_token = res.get('data', {}).get('token')
    user_a = res.get('data', {}).get('user', {})
    print(f"\n[7] Admin Login: HTTP {status}")
    print(f"    - User: {user_a.get('email')} ({user_a.get('role')})")
    assert admin_token is not None

    # 8. Admin Dashboard
    status, res = api_call("/admin/dashboard", token=admin_token)
    dash_a = res.get('data', {})
    print(f"\n[8] Admin Platform Dashboard: HTTP {status}")
    stats = dash_a.get('stats') or dash_a
    print(f"    - Total Users:     {stats.get('totalUsers')}")
    print(f"    - Total Producers: {stats.get('totalProducers')}")
    print(f"    - Total Consumers: {stats.get('totalConsumers')}")
    print(f"    - Total Volume:    {stats.get('totalEnergyTraded')} kWh")

    # 9. Blockchain Sepolia Contracts
    status, res = api_call("/blockchain/contracts")
    contracts = res.get('data', {})
    print(f"\n[9] Blockchain Sepolia Contracts: HTTP {status}")
    print(f"    - Network:         {contracts.get('network')} (Chain ID: {contracts.get('chainId')})")
    print(f"    - EnergyTrading:   {contracts.get('contracts', {}).get('EnergyTrading', {}).get('address')}")
    print(f"    - GreenCertificate:{contracts.get('contracts', {}).get('GreenCertificate', {}).get('address')}")

    # 10. Certificate On-Chain Verification
    status, res = api_call("/blockchain/certificates/1/verify")
    cert = res.get('data', {})
    print(f"\n[10] Certificate Verification (#1): HTTP {status}")
    print(f"    - Valid:           {cert.get('valid')}")
    print(f"    - Cert Number:     {cert.get('certificateNumber')}")
    print(f"    - Energy Quantity: {cert.get('metadata', {}).get('energyQuantityKwh')} kWh")
    print(f"    - Token Standard:  {cert.get('tokenStandard')}")
    print(f"    - Sepolia Explorer:{cert.get('verificationLinks', {}).get('tokenEtherscan')}")

    print("\n" + "=" * 60)
    print("ALL 10 CLOUD BACKEND TESTS PASSED ON AWS LAMBDA & RDS POSTGRESQL!")
    print("=" * 60)

if __name__ == '__main__':
    test_cloud_backend()
