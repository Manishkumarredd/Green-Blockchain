import subprocess
import json
import urllib.request
import time
import os

APP_ID = "d1ceb7y0rzwmpf"
BRANCH_NAME = "main"
REGION = "ap-southeast-2"
ZIP_FILE = "frontend_deploy.zip"

def deploy():
    print(f"Step 1: Creating Amplify deployment for {APP_ID} / {BRANCH_NAME}...")
    cmd = [
        "aws", "amplify", "create-deployment",
        "--app-id", APP_ID,
        "--branch-name", BRANCH_NAME,
        "--region", REGION,
        "--output", "json"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    deploy_info = json.loads(res.stdout)
    job_id = deploy_info.get("jobId")
    zip_url = deploy_info.get("zipUploadUrl")
    print(f"Deployment created: Job ID = {job_id}")

    print(f"Step 2: Uploading {ZIP_FILE} ({os.path.getsize(ZIP_FILE)} bytes) to S3 presigned upload URL...")
    with open(ZIP_FILE, 'rb') as f:
        zip_data = f.read()

    req = urllib.request.Request(
        zip_url,
        data=zip_data,
        headers={"Content-Type": "application/zip"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as response:
        print(f"Upload response status: {response.status}")

    print("Step 3: Starting Amplify deployment...")
    cmd_start = [
        "aws", "amplify", "start-deployment",
        "--app-id", APP_ID,
        "--branch-name", BRANCH_NAME,
        "--job-id", job_id,
        "--region", REGION,
        "--output", "json"
    ]
    res_start = subprocess.run(cmd_start, capture_output=True, text=True, check=True)
    print(f"Amplify deployment initiated!")

    print("Step 4: Polling deployment job status...")
    cmd_status = [
        "aws", "amplify", "get-job",
        "--app-id", APP_ID,
        "--branch-name", BRANCH_NAME,
        "--job-id", job_id,
        "--region", REGION,
        "--output", "json"
    ]
    for attempt in range(20):
        time.sleep(3)
        check = subprocess.run(cmd_status, capture_output=True, text=True)
        if check.returncode == 0:
            status_data = json.loads(check.stdout)
            status = status_data.get("job", {}).get("summary", {}).get("status")
            print(f"Job {job_id} status: {status}")
            if status == "SUCCEED":
                print(">>> AMPLIFY DEPLOYMENT COMPLETED SUCCESSFULLY! <<<")
                return True
            elif status in ["FAILED", "CANCELLED"]:
                print(f"Deployment failed with status: {status}")
                return False
    return False

if __name__ == '__main__':
    deploy()
