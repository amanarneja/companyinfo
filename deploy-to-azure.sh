#!/bin/bash

# Azure deployment script for Company Information Finder
# This script helps deploy the application to Azure App Service

# Exit on error
set -e

# Configuration
APP_NAME="company-info-finder"
RESOURCE_GROUP="company-info-finder-rg"
LOCATION="eastus"
APP_SERVICE_PLAN="company-info-finder-plan"
SKU="B1"

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

# Create a unique name with random suffix
RANDOM_SUFFIX=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 5 | head -n 1)
APP_NAME="${APP_NAME}-${RANDOM_SUFFIX}"
echo -e "${GREEN}Using app name: ${APP_NAME}${NC}"

# Create resource group
echo -e "${YELLOW}Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan
echo -e "${YELLOW}Creating App Service Plan...${NC}"
az appservice plan create --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --sku $SKU --is-linux

# Create Web App
echo -e "${YELLOW}Creating Web App...${NC}"
az webapp create --name $APP_NAME --resource-group $RESOURCE_GROUP --plan $APP_SERVICE_PLAN --runtime "NODE|18-lts"

# Configure environment variables
echo -e "${YELLOW}Configuring environment variables...${NC}"
read -p "Enter your OpenAI API key (leave blank to skip): " OPENAI_API_KEY

if [ ! -z "$OPENAI_API_KEY" ]; then
    az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings OPENAI_API_KEY=$OPENAI_API_KEY
    echo -e "${GREEN}API key configured.${NC}"
else
    echo -e "${YELLOW}No API key provided. You can add it later in the Azure Portal.${NC}"
fi

# Set other environment variables
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings NODE_ENV=production

# Deploy the application
echo -e "${YELLOW}Deploying application...${NC}"
echo -e "${YELLOW}Compressing files...${NC}"
zip -r deployment.zip . -x "node_modules/*" ".git/*" ".env" "deploy-to-azure.sh"

echo -e "${YELLOW}Uploading and deploying...${NC}"
az webapp deployment source config-zip --name $APP_NAME --resource-group $RESOURCE_GROUP --src deployment.zip

# Clean up
rm deployment.zip

# Enable logging
echo -e "${YELLOW}Enabling logging...${NC}"
az webapp log config --name $APP_NAME --resource-group $RESOURCE_GROUP --application-logging filesystem --detailed-error-messages true --failed-request-tracing true --web-server-logging filesystem

# Output the URL
URL="https://${APP_NAME}.azurewebsites.net"
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your application is available at: ${URL}${NC}"
echo -e "${YELLOW}Note: It may take a few minutes for the application to start up.${NC}"

# Instructions for Key Vault setup
echo -e "\n${YELLOW}For enhanced security, use Azure Key Vault to store your API keys:${NC}"
echo -e "${GREEN}Run the setup-azure-keyvault.sh script to configure Azure Key Vault:${NC}"
echo -e "  ./setup-azure-keyvault.sh"
echo -e "This script will:"
echo -e "  1. Create a Key Vault in your resource group"
echo -e "  2. Store your Azure OpenAI credentials securely"
echo -e "  3. Configure your web app to access the Key Vault using Managed Identity"

# Instructions for GitHub integration
echo -e "\n${YELLOW}To set up GitHub integration and CI/CD:${NC}"
echo -e "1. Push your code to GitHub"
echo -e "2. Create a service principal for GitHub Actions:"
echo -e "   az ad sp create-for-rbac --name \"company-search-github\" \\"
echo -e "     --role contributor \\"
echo -e "     --scopes /subscriptions/<subscription-id>/resourceGroups/$RESOURCE_GROUP \\"
echo -e "     --sdk-auth"
echo -e "3. Add the following secrets to your GitHub repository:"
echo -e "   - AZURE_CREDENTIALS: The JSON output from the command above"
echo -e "   - AZURE_WEBAPP_NAME: $APP_NAME"
echo -e "   - AZURE_RESOURCE_GROUP: $RESOURCE_GROUP"
echo -e "   - AZURE_KEYVAULT_NAME: Your Key Vault name"
echo -e "4. GitHub Actions will automatically deploy your app when you push to the main branch"
