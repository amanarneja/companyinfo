# Company Information Finder

A web application that allows users to search for company information. The application uses a backend server to fetch company logos and descriptions, with the option to use an LLM API for companies not in the predefined database.

## Features

- Search for company information by name
- Display company logo and business description
- Secure handling of API keys through environment variables
- Ready for deployment to Azure

## Project Structure

```
company-search/
├── index.html         # Frontend HTML
├── styles.css         # CSS styles
├── script.js          # Frontend JavaScript
├── server.js          # Backend Express server
├── .env               # Environment variables (not committed to git)
├── .gitignore         # Git ignore file
└── package.json       # Node.js dependencies
```

## Local Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   cd company-search
   npm install
   ```
3. Create a `.env` file with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   NODE_ENV=development
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`

## Deploying to Azure

### Option 1: Using the Deployment Script

This project includes a deployment script that automates the process of deploying to Azure App Service:

1. Make the script executable:
   - On Linux/macOS: `chmod +x deploy-to-azure.sh`
   - On Windows: No need to change permissions, but run it using `bash deploy-to-azure.sh` or `sh deploy-to-azure.sh`

2. Run the script:
   ```
   ./deploy-to-azure.sh  # On Linux/macOS
   bash deploy-to-azure.sh  # On Windows with Git Bash or WSL
   ```

3. Follow the prompts to complete the deployment.

### Option 2: Manual Deployment to Azure App Service

1. Create an Azure App Service
2. Set up GitHub Actions or Azure DevOps for CI/CD
3. Configure environment variables in Azure App Service Configuration:
   - Go to your App Service in Azure Portal
   - Navigate to Settings > Configuration
   - Add application settings for each environment variable (e.g., OPENAI_API_KEY)
   - These settings are encrypted at rest and transmitted over an encrypted channel

### Option 2: Azure Container Apps

1. Containerize the application using Docker
2. Create an Azure Container Registry (ACR)
3. Push your Docker image to ACR
4. Deploy to Azure Container Apps
5. Configure environment variables in the Container Apps Configuration

### Securing API Keys in Azure

Azure provides several ways to securely store and access API keys:

1. **App Service Configuration**: As described above, you can store API keys as application settings.

2. **Azure Key Vault**:
   - Create a Key Vault in Azure
   - Store your API keys as secrets
   - Configure your App Service to access Key Vault using Managed Identity
   - Update your code to retrieve secrets from Key Vault

   Example code to access Key Vault in Node.js:
   ```javascript
   const { DefaultAzureCredential } = require('@azure/identity');
   const { SecretClient } = require('@azure/keyvault-secrets');

   const credential = new DefaultAzureCredential();
   const vaultName = process.env.KEY_VAULT_NAME;
   const url = `https://${vaultName}.vault.azure.net`;
   const client = new SecretClient(url, credential);

   async function getOpenAIKey() {
     const secretName = "OPENAI-API-KEY";
     const secret = await client.getSecret(secretName);
     return secret.value;
   }
   ```

3. **Azure Managed Identity**: 
   - Enable Managed Identity for your App Service
   - Grant the Managed Identity access to Key Vault
   - Your application can then access Key Vault without storing any credentials

## Azure Integration

This application is designed to work with Azure services for enhanced security and scalability:

### Azure OpenAI Integration

The application is configured to use Azure OpenAI instead of OpenAI directly:

1. Create an Azure OpenAI resource in the Azure Portal
2. Deploy a model in your Azure OpenAI resource
3. Update the following environment variables:
   - `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL
   - `AZURE_OPENAI_KEY`: Your Azure OpenAI API key
   - `AZURE_OPENAI_DEPLOYMENT`: Your model deployment name

In production, these values should be stored in Azure Key Vault and accessed securely.

### Azure Key Vault Integration

For enhanced security, sensitive information like API keys are stored in Azure Key Vault:

1. Create a Key Vault in Azure Portal
2. Add your secrets to the Key Vault:
   - `AZURE-OPENAI-ENDPOINT`: Your Azure OpenAI endpoint
   - `AZURE-OPENAI-KEY`: Your Azure OpenAI API key
   - `AZURE-OPENAI-DEPLOYMENT`: Your model deployment name
3. Set up Managed Identity for your App Service
4. Grant the Managed Identity access to Key Vault secrets
5. Set the `KEY_VAULT_NAME` environment variable in your App Service

The application will automatically retrieve secrets from Key Vault using the Managed Identity.

## GitHub Integration and CI/CD

This project includes GitHub Actions workflows for continuous integration and deployment to Azure:

1. Push your code to GitHub
2. Set up the following secrets in your GitHub repository:
   - `AZURE_CREDENTIALS`: Azure service principal credentials (JSON)
   - `AZURE_WEBAPP_NAME`: Name of your Azure Web App
   - `AZURE_RESOURCE_GROUP`: Name of your Azure Resource Group
   - `AZURE_KEYVAULT_NAME`: Name of your Azure Key Vault

3. The workflow will automatically:
   - Build and test your application
   - Deploy to Azure Web App
   - Configure Managed Identity
   - Set up Key Vault access

To set up the Azure credentials secret:

```bash
az ad sp create-for-rbac --name "company-search-github" --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

Copy the JSON output and add it as a secret named `AZURE_CREDENTIALS` in your GitHub repository.

## License

MIT
