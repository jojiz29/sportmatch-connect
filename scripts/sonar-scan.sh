#!/bin/bash

# ==============================================================================
# SportMatch Connect — SonarQube Shell Scanner
# ==============================================================================

TOKEN=""
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -t|--token) TOKEN="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

HOST_URL="http://localhost:9000"

echo "=========================================================="
echo "            SportMatch Connect — SonarQube Scan"
echo "=========================================================="

# 1. Check if SonarQube server is running
echo "Checking if SonarQube is running at $HOST_URL..."
if ! curl -s -f -o /dev/null "$HOST_URL/api/system/status" --connect-timeout 3; then
    # Fallback to checking TCP port 9000 using nc or /dev/tcp
    if ! (echo > /dev/tcp/localhost/9000) >/dev/null 2>&1; then
        echo "Error: SonarQube server is not running or not reachable on port 9000."
        echo "Please start the SonarQube container first by running: npm run sonar:up"
        exit 1
    fi
fi
echo "SonarQube server is reachable!"

# 2. Run the scanner
echo "Launching SonarQube scanner via npx sonarqube-scanner..."

SCAN_ARGS=()
if [ ! -z "$TOKEN" ]; then
    SCAN_ARGS+=("-Dsonar.token=$TOKEN")
else
    echo "Warning: No token provided. If your SonarQube instance requires authentication, the scan may fail."
    echo "Tip: You can pass a token using: ./scripts/sonar-scan.sh --token <your_token>"
fi

npx sonarqube-scanner "${SCAN_ARGS[@]}"

if [ $? -eq 0 ]; then
    echo "=========================================================="
    echo "   Scan Completed Successfully!"
    echo "   View results at: http://localhost:9000/dashboard?id=sportmatch-connect"
    echo "=========================================================="
else
    echo "Scan failed. Please check the logs above for errors."
    exit $?
fi
