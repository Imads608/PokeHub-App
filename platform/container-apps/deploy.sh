#!/bin/bash

set -e

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
  echo "Usage: ./deploy.sh <app-name>"
  echo "Example: ./deploy.sh pokehub-api"
  exit 1
fi

if [ ! -f "${APP_NAME}.yaml" ]; then
  echo "Error: ${APP_NAME}.yaml not found"
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "Error: .env file not found. Copy .env.template to .env and fill in values."
  exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo "Deploying ${APP_NAME}..."

# Create temporary file with secrets replaced
TEMP_FILE="${APP_NAME}.deploy.yaml"
cp "${APP_NAME}.yaml" "$TEMP_FILE"

# Replace secrets
sed -i "s|REPLACE_WITH_ACR_PASSWORD|${ACR_PASSWORD}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_DB_HOST|${DB_HOST}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_DB_PORT|${DB_PORT}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_DB_NAME|${DB_NAME}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_DB_USER|${DB_USER}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_DB_PASSWORD|${DB_PASSWORD}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_NEXTAUTH_SECRET|${NEXTAUTH_SECRET}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_GOOGLE_CLIENT_ID|${GOOGLE_CLIENT_ID}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_GOOGLE_CLIENT_SECRET|${GOOGLE_CLIENT_SECRET}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_AZURE_STORAGE_ACCOUNT_KEY|${AZURE_STORAGE_ACCOUNT_KEY}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_REFRESH_TOKEN_SECRET|${REFRESH_TOKEN_SECRET}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_ACCESS_TOKEN_SECRET|${ACCESS_TOKEN_SECRET}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_API_URL|${API_URL}|g" "$TEMP_FILE"
sed -i "s|REPLACE_WITH_APP_URL|${APP_URL}|g" "$TEMP_FILE"

# Check if app exists
if az containerapp show --name "$APP_NAME" --resource-group pokehub_group &>/dev/null; then
  echo "Updating existing container app..."
  az containerapp update \
    --name "$APP_NAME" \
    --resource-group pokehub_group \
    --yaml "$TEMP_FILE"

  echo "Restarting container to pull latest image..."
  # Get the active revision name
  REVISION=$(az containerapp revision list \
    --name "$APP_NAME" \
    --resource-group pokehub_group \
    --query "[?properties.active==\`true\`].name" \
    -o tsv | head -1)

  if [ -n "$REVISION" ]; then
    az containerapp revision restart \
      --name "$APP_NAME" \
      --resource-group pokehub_group \
      --revision "$REVISION"
    echo "Container restarted successfully"
  else
    echo "Warning: Could not find active revision to restart"
  fi
else
  echo "Creating new container app..."
  az containerapp create \
    --name "$APP_NAME" \
    --resource-group pokehub_group \
    --yaml "$TEMP_FILE"
fi

# Clean up
rm "$TEMP_FILE"

echo "✅ Deployment complete!"
echo ""
echo "App URL:"
az containerapp show \
  --name "$APP_NAME" \
  --resource-group pokehub_group \
  --query "properties.configuration.ingress.fqdn" \
  -o tsv | xargs -I {} echo "https://{}"
