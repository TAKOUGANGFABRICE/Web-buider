#!/usr/bin/env python
"""
test_api.py - Quick API health check and endpoint testing
Run this after deployment to verify all endpoints are working correctly.
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"  # Change to your domain in production
API_URL = f"{BASE_URL}/api"


class colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    END = "\033[0m"


def test_endpoint(name, url, method="GET", auth=False, data=None, expected_status=200):
    """Test a single API endpoint"""
    print(f"\nTesting: {name}")
    print(f"  URL: {url}")

    headers = {"Content-Type": "application/json"}
    if auth:
        # For auth endpoints, we'd need credentials - skip for unauthenticated tests
        print(f"  {colors.YELLOW}[SKIP] Requires authentication{colors.END}")
        return True

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        else:
            print(f"  {colors.RED}[ERROR] Unsupported method: {method}{colors.END}")
            return False

        if response.status_code == expected_status:
            print(f"  {colors.GREEN}[OK] Status {response.status_code}{colors.END}")
            return True
        else:
            print(
                f"  {colors.RED}[FAIL] Expected {expected_status}, got {response.status_code}{colors.END}"
            )
            print(f"  Response: {response.text[:200]}")
            return False

    except requests.exceptions.ConnectionError:
        print(
            f"  {colors.RED}[FAIL] Connection error - is the server running?{colors.END}"
        )
        return False
    except Exception as e:
        print(f"  {colors.RED}[FAIL] {str(e)}{colors.END}")
        return False


def main():
    print(f"{colors.BLUE}{'=' * 60}{colors.END}")
    print(f"{colors.BLUE}WaaS API Test Suite{colors.END}")
    print(f"{colors.BLUE}{'=' * 60}{colors.END}")

    tests = [
        ("API Root", f"{BASE_URL}/api/", "GET", False, None, 200),
        ("Admin Panel", f"{BASE_URL}/admin/", "GET", False, None, 200),
        ("Templates List", f"{API_URL}/templates/", "GET", False, None, 200),
        ("Templates CRUD", f"{API_URL}/crud/templates/crud/", "GET", False, None, 200),
        ("Billing Plans", f"{API_URL}/billing-plans/", "GET", False, None, 200),
        # Note: Authenticated endpoints require login first
        # ("My Plan", f"{API_URL}/my-plan/", 'GET', True, None, 200),
    ]

    passed = 0
    failed = 0

    for test in tests:
        name, url, method, auth, data, expected = test
        if test_endpoint(name, url, method, auth, data, expected):
            passed += 1
        else:
            failed += 1

    print(f"\n{colors.BLUE}{'=' * 60}{colors.END}")
    print(
        f"Results: {colors.GREEN}{passed} passed{colors.END}, {colors.RED}{failed} failed{colors.END}"
    )
    print(f"{colors.BLUE}{'=' * 60}{colors.END}")

    if failed > 0:
        print(f"\n{colors.RED}Some tests failed!{colors.END}")
        print("Make sure:")
        print("  1. Django server is running")
        print("  2. Migrations are applied")
        print("  3. BASE_URL is correct")
        sys.exit(1)
    else:
        print(f"\n{colors.GREEN}All tests passed!{colors.END}")
        print("Your API is ready for frontend integration.")
        sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{colors.YELLOW}Interrupted{colors.END}")
        sys.exit(130)
