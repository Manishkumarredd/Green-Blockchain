import json
import subprocess

ACCOUNT_ID = "477579576684"

budget = {
    "BudgetName": "GreenLedger-Monthly-Cap",
    "BudgetLimit": {
        "Amount": "25.00",
        "Unit": "USD"
    },
    "CostTypes": {
        "IncludeTax": True,
        "IncludeSubscription": True,
        "UseBlended": False,
        "IncludeRefund": False,
        "IncludeCredit": True,
        "IncludeUpfront": True,
        "IncludeRecurring": True,
        "IncludeOtherSubscription": True,
        "IncludeSupport": True,
        "IncludeDiscount": True,
        "UseAmortized": False
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
}

notifications = [
    {
        "Notification": {
            "NotificationType": "ACTUAL",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 80.0,
            "ThresholdType": "PERCENTAGE",
            "NotificationState": "ALARM"
        },
        "Subscribers": [
            {
                "SubscriptionType": "EMAIL",
                "Address": "admin@greenledger.io"
            }
        ]
    },
    {
        "Notification": {
            "NotificationType": "ACTUAL",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 100.0,
            "ThresholdType": "PERCENTAGE",
            "NotificationState": "ALARM"
        },
        "Subscribers": [
            {
                "SubscriptionType": "EMAIL",
                "Address": "admin@greenledger.io"
            }
        ]
    }
]

with open("budget.json", "w") as f:
    json.dump(budget, f)

with open("notifications.json", "w") as f:
    json.dump(notifications, f)

print("Creating AWS Budget: GreenLedger-Monthly-Cap ($25.00/mo)...")
cmd = [
    "aws", "budgets", "create-budget",
    "--account-id", ACCOUNT_ID,
    "--budget", "file://budget.json",
    "--notifications-with-subscribers", "file://notifications.json"
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
print("RC:", res.returncode)
if res.returncode == 0:
    print(">>> AWS BUDGET CREATED SUCCESSFULLY! <<<")
else:
    print("Budget creation result (might already exist or require specific permission):", res.stderr)
