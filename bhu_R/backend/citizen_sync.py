import json
import os
from urllib import error, request


def publish_prediction(payload):
    api_url = os.getenv("CITIZEN_API_URL", "https://sih2026-62el.vercel.app").rstrip("/")
    secret = os.getenv("ADMIN_API_SECRET", "bhu-raksha-local-admin-secret-2026")
    if not secret:
        print("Citizen sync skipped: ADMIN_API_SECRET is not configured.")
        return False

    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{api_url}/api/predictions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Admin-Api-Secret": secret,
        },
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=5) as response:
            return 200 <= response.status < 300
    except (error.URLError, error.HTTPError, TimeoutError) as exc:
        print(f"Citizen sync unavailable: {exc}")
        return False

