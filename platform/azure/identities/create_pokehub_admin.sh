# Choose a unique Identity name and existing resource group to create identity in.
IDENTITY=$(az identity create --name pokehub_admin --resource-group pokehub_group --output json)

# Gets principalId to use for role assignment
PRINCIPAL_ID=$(echo $IDENTITY | jq -r '.principalId')

# Used for identity binding
CLIENT_ID=$(echo $IDENTITY | jq -r '.clientId')
RESOURCE_ID=$(echo $IDENTITY | jq -r '.id')

# Get existing DNS Zone Id
ZONE_ID=$(az network dns zone show --name pokehub.ml --resource-group pokehub_group --query "id" -o tsv)

# Create role assignment
az role assignment create --role "DNS Zone Contributor" --assignee $PRINCIPAL_ID --scope $ZONE_ID
