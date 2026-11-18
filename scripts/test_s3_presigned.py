import boto3
import urllib.request
import json

s3 = boto3.client('s3', region_name='ap-southeast-2')
bucket = 'greenledger-data-477579576684-syd'
cert_key = 'certificates/GL-REC-2026-0001.json'

cert_dict = {
    "certificateNumber": "GL-REC-2026-0001",
    "energyKwh": 80.0,
    "carbonSavedKg": 65.6,
    "energySource": "SOLAR",
    "standard": "ERC-721",
    "issuer": "GreenLedger Authority",
    "blockchainTx": "0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91"
}

body_bytes = json.dumps(cert_dict).encode('utf-8')

print(f"Uploading certificate metadata to s3://{bucket}/{cert_key}...")
s3.put_object(
    Bucket=bucket,
    Key=cert_key,
    Body=body_bytes,
    ServerSideEncryption='AES256',
    ContentType='application/json'
)
print("Upload complete with AES256 server-side encryption.")

print("Generating 1-hour presigned download URL...")
presigned_url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': bucket, 'Key': cert_key},
    ExpiresIn=3600
)
print(f"Presigned URL: {presigned_url[:90]}...")

print("Verifying HTTP GET via presigned URL...")
with urllib.request.urlopen(presigned_url) as resp:
    retrieved = json.loads(resp.read().decode('utf-8'))
    print("Downloaded Content:", retrieved)
    assert retrieved["certificateNumber"] == "GL-REC-2026-0001"
    print(">>> S3 ENCRYPTED STORAGE & PRESIGNED URL TEST PASSED! <<<")
