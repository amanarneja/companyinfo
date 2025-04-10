# Company Information Finder

A web application that allows users to search for company information. The application uses a backend server to fetch company logos and descriptions, with the option to use Azure OpenAI for companies not in the predefined database.

## Features

- Search for company information by name
- Display company logo and business description
- Clear indication when a company is not found
- Secure handling of API keys through Azure Key Vault
- Ready for deployment to Azure with GitHub Actions CI/CD

## Project Structure

```
company-search/
├── index.html                    # Frontend HTML
├── styles.css                    # CSS styles
├── script.js                     # Frontend JavaScript
├── server.js                     # Backend Express server
├── .env                          # Environment variables (not committed to git)
├── .gitignore                    # Git ignore file
├── package.json                  # Node.js dependencies
├── Dockerfile                    # Docker configuration for containerization
├── .dockerignore                 # Files to exclude from Docker image
├── deploy-to-azure.sh            # Script for Azure App Service deployment
├── setup-azure-keyvault.sh       # Script for Azure Key Vault setup
└── .github/workflows/            # GitHub Actions workflows
    └── azure-deploy.yml          # CI/CD pipeline for Azure deployment
```

## Local Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   cd company-search
   npm install
   ```
3. Create a `.env` file with your configuration:
   ```
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Azure Configuration
   KEY_VAULT_NAME=your_key_vault_name
   AZURE_TENANT_ID=your_tenant_id
   AZURE_CLIENT_ID=your_client_id
   AZURE_CLIENT_SECRET=your_client_secret

   # Azure OpenAI Configuration
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
   AZURE_OPENAI_KEY=your_azure_openai_key
   AZURE_OPENAI_DEPLOYMENT=your_deployment_name
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3001`

## Azure Integration

This application is designed to work with Azure services for enhanced security and scalability:

### Azure OpenAI Integration

The application is configured to use Azure OpenAI instead of OpenAI directly:

1. Create an Azure OpenAI resource in the Azure Portal
2. Deploy a model in your Azure OpenAI resource
3. Update the environment variables with your Azure OpenAI configuration

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

Example code to access Key Vault in Node.js:
```javascript
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const credential = new DefaultAzureCredential();
const vaultName = process.env.KEY_VAULT_NAME;
const url = `https://${vaultName}.vault.azure.net`;
const client = new SecretClient(url, credential);

async function getAzureOpenAIKey() {
  const secretName = "AZURE-OPENAI-KEY";
  const secret = await client.getSecret(secretName);
  return secret.value;
}
```

## Deployment Options

### Option 1: Using the Deployment Script

This project includes a deployment script that automates the process of deploying to Azure App Service:

1. Make the script executable:
   - On Linux/macOS: `chmod +x deploy-to-azure.sh`
   - On Windows: Run it using `bash deploy-to-azure.sh` or `sh deploy-to-azure.sh`

2. Run the script and follow the prompts to complete the deployment.

3. Use the `setup-azure-keyvault.sh` script to configure Azure Key Vault:
   - On Linux/macOS: `chmod +x setup-azure-keyvault.sh`
   - On Windows: Run it using `bash setup-azure-keyvault.sh` or `sh setup-azure-keyvault.sh`

### Option 2: GitHub Actions CI/CD

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

### Option 3: Docker Containerization

The application includes Docker configuration for containerization:

1. Build the Docker image:
   ```
   docker build -t company-search .
   ```

2. Run the container locally:
   ```
   docker run -p 3001:3001 -e KEY_VAULT_NAME=your_key_vault_name company-search
   ```

3. For Azure deployment:
   - Push the image to Azure Container Registry
   - Deploy to Azure Container Apps or App Service with container support
   - Configure environment variables for Azure Key Vault integration

## License

MIT
