#!/bin/bash

# Script to set up Azure Key Vault and store secrets for the Company Information Finder application

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it first: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Check if user is logged in to Azure
echo -e "${YELLOW}Checking Azure login status...${NC}"
az account show &> /dev/null || {
    echo -e "${YELLOW}You are not logged in to Azure. Please login:${NC}"
    az login
}

# Configuration
echo -e "${YELLOW}Please provide the following information:${NC}"
read -p "Resource Group Name: " RESOURCE_GROUP
read -p "Location (e.g., eastus): " LOCATION
read -p "Key Vault Name (must be globally unique): " KEY_VAULT_NAME
read -p "Web App Name: " WEBAPP_NAME

# Create Resource Group if it doesn't exist
echo -e "${YELLOW}Checking if Resource Group exists...${NC}"
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}Creating Resource Group...${NC}"
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo -e "${GREEN}Resource Group created.${NC}"
else
    echo -e "${GREEN}Resource Group already exists.${NC}"
fi

# Create Key Vault
echo -e "${YELLOW}Creating Key Vault...${NC}"
az keyvault create --name $KEY_VAULT_NAME --resource-group $RESOURCE_GROUP --location $LOCATION

# Collect Azure OpenAI information
echo -e "${YELLOW}Please provide your Azure OpenAI information:${NC}"
read -p "Azure OpenAI Endpoint (e.g., https://your-resource.openai.azure.com/): " AZURE_OPENAI_ENDPOINT
read -p "Azure OpenAI API Key: " AZURE_OPENAI_KEY
read -p "Azure OpenAI Deployment Name: " AZURE_OPENAI_DEPLOYMENT

# Store secrets in Key Vault
echo -e "${YELLOW}Storing secrets in Key Vault...${NC}"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "AZURE-OPENAI-ENDPOINT" --value "$AZURE_OPENAI_ENDPOINT"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "AZURE-OPENAI-KEY" --value "$AZURE_OPENAI_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "AZURE-OPENAI-DEPLOYMENT" --value "$AZURE_OPENAI_DEPLOYMENT"

# Check if Web App exists
echo -e "${YELLOW}Checking if Web App exists...${NC}"
if az webapp show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    # Enable Managed Identity for Web App
    echo -e "${YELLOW}Enabling Managed Identity for Web App...${NC}"
    IDENTITY_PRINCIPAL_ID=$(az webapp identity assign --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query principalId --output tsv)
    
    # Grant Web App access to Key Vault
    echo -e "${YELLOW}Granting Web App access to Key Vault...${NC}"
    az keyvault set-policy --name $KEY_VAULT_NAME --object-id $IDENTITY_PRINCIPAL_ID --secret-permissions get list
    
    # Set Key Vault name as an app setting
    echo -e "${YELLOW}Setting Key Vault name as an app setting...${NC}"
    az webapp config appsettings set --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --settings KEY_VAULT_NAME=$KEY_VAULT_NAME
    
    echo -e "${GREEN}Web App configured to use Key Vault.${NC}"
else
    echo -e "${YELLOW}Web App does not exist yet. Please create it first using the deploy-to-azure.sh script or manually.${NC}"
    echo -e "${YELLOW}After creating the Web App, run this command to set up Managed Identity:${NC}"
    echo -e "az webapp identity assign --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP"
    echo -e "${YELLOW}Then run this command to grant access to Key Vault:${NC}"
    echo -e "az keyvault set-policy --name $KEY_VAULT_NAME --object-id \$(az webapp identity show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query principalId --output tsv) --secret-permissions get list"
    echo -e "${YELLOW}Finally, set the Key Vault name as an app setting:${NC}"
    echo -e "az webapp config appsettings set --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --settings KEY_VAULT_NAME=$KEY_VAULT_NAME"
fi

echo -e "${GREEN}Azure Key Vault setup complete!${NC}"
echo -e "${GREEN}Key Vault Name: $KEY_VAULT_NAME${NC}"
echo -e "${GREEN}Secrets stored:${NC}"
echo -e "  - AZURE-OPENAI-ENDPOINT"
echo -e "  - AZURE-OPENAI-KEY"
echo -e "  - AZURE-OPENAI-DEPLOYMENT"

echo -e "${YELLOW}For GitHub Actions CI/CD, add these secrets to your GitHub repository:${NC}"
echo -e "  - AZURE_CREDENTIALS: Output of 'az ad sp create-for-rbac' command"
echo -e "  - AZURE_WEBAPP_NAME: $WEBAPP_NAME"
echo -e "  - AZURE_RESOURCE_GROUP: $RESOURCE_GROUP"
echo -e "  - AZURE_KEYVAULT_NAME: $KEY_VAULT_NAME"
