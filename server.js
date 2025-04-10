const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Predefined company data
const knownCompanies = {
    'microsoft': {
        name: 'Microsoft Corporation',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
        description: 'Microsoft Corporation is an American multinational technology company that develops, manufactures, licenses, supports, and sells computer software, consumer electronics, personal computers, and related services.'
    },
    'apple': {
        name: 'Apple Inc.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
        description: 'Apple Inc. is an American multinational technology company that specializes in consumer electronics, software and online services. Apple is the largest technology company by revenue and one of the world\'s most valuable companies.'
    },
    'google': {
        name: 'Google LLC',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
        description: 'Google LLC is an American multinational technology company focusing on search engine technology, online advertising, cloud computing, computer software, quantum computing, e-commerce, artificial intelligence, and consumer electronics.'
    },
    'amazon': {
        name: 'Amazon.com, Inc.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        description: 'Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing, online advertising, digital streaming, and artificial intelligence. It is one of the Big Five American information technology companies.'
    },
    'tesla': {
        name: 'Tesla, Inc.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png',
        description: 'Tesla, Inc. is an American electric vehicle and clean energy company. Tesla designs and manufactures electric cars, battery energy storage from home to grid-scale, solar panels and solar roof tiles, and related products and services.'
    },
    'facebook': {
        name: 'Meta Platforms, Inc. (formerly Facebook)',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Facebook_New_Logo_%282015%29.svg',
        description: 'Meta Platforms, Inc., doing business as Meta and formerly known as Facebook, Inc., is an American multinational technology conglomerate that owns Facebook, Instagram, and WhatsApp, among other products and services.'
    },
    'netflix': {
        name: 'Netflix, Inc.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
        description: 'Netflix, Inc. is an American subscription streaming service and production company. It offers a library of films and television series through distribution deals as well as its own productions, known as Netflix Originals.'
    },
    'ibm': {
        name: 'International Business Machines Corporation (IBM)',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg',
        description: 'IBM is an American multinational technology corporation headquartered in Armonk, New York, with operations in over 171 countries. It produces and sells computer hardware, middleware, and software, and provides hosting and consulting services.'
    },
    'intel': {
        name: 'Intel Corporation',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282006-2020%29.svg',
        description: 'Intel Corporation is an American multinational corporation and technology company headquartered in Santa Clara, California. It is the world\'s largest semiconductor chip manufacturer by revenue and is the developer of the x86 series of microprocessors.'
    },
    'nvidia': {
        name: 'NVIDIA Corporation',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg',
        description: 'NVIDIA Corporation is an American multinational technology company that designs graphics processing units (GPUs) for the gaming and professional markets, as well as system on a chip units (SoCs) for the mobile computing and automotive market.'
    }
};

// API endpoint to search for company information
app.post('/api/search', async (req, res) => {
    try {
        const { companyName } = req.body;
        
        if (!companyName) {
            return res.status(400).json({ error: 'Company name is required' });
        }
        
        // Normalize company name for comparison
        const normalizedName = companyName.toLowerCase();
        
        // Check if we have predefined info for this company
        for (const [key, info] of Object.entries(knownCompanies)) {
            if (normalizedName.includes(key) || key.includes(normalizedName)) {
                // Add a small delay to simulate network request
                await new Promise(resolve => setTimeout(resolve, 500));
                return res.json(info);
            }
        }
        
        // If company not found in our database, use Azure OpenAI to get information
        // In a production environment, this would call Azure OpenAI
        
        // For now, return a "not found" response
        const formattedName = companyName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
            
        // Example of how you would use Azure OpenAI in production:
        /*
        // This code is commented out since we don't have actual credentials
        try {
            // Get Azure OpenAI credentials from Key Vault
            const { DefaultAzureCredential } = require('@azure/identity');
            const { SecretClient } = require('@azure/keyvault-secrets');
            
            // Use Managed Identity or other Azure authentication method
            const credential = new DefaultAzureCredential();
            
            // Get Key Vault name from environment variable
            const keyVaultName = process.env.KEY_VAULT_NAME;
            const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
            
            // Create a secret client
            const secretClient = new SecretClient(keyVaultUrl, credential);
            
            // Get secrets from Key Vault
            const azureOpenAIEndpoint = await secretClient.getSecret('AZURE-OPENAI-ENDPOINT');
            const azureOpenAIKey = await secretClient.getSecret('AZURE-OPENAI-KEY');
            const azureOpenAIDeployment = await secretClient.getSecret('AZURE-OPENAI-DEPLOYMENT');
            
            // Azure OpenAI API call
            const azureOpenAIResponse = await axios.post(
                `${azureOpenAIEndpoint.value}/openai/deployments/${azureOpenAIDeployment.value}/chat/completions?api-version=2023-05-15`,
                {
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that provides information about companies.'
                        },
                        {
                            role: 'user',
                            content: `Provide the following information about ${companyName}:
                            1. Full official company name
                            2. A URL to the company's logo (if well-known)
                            3. A brief 2-line description of what the company does
                            
                            Format your response as a JSON object with the following structure:
                            {
                                "name": "Full Company Name",
                                "logo": "Logo URL or null if not available",
                                "description": "Brief description of the company"
                            }
                            
                            If you don't have information about this company, respond with:
                            {
                                "name": "${companyName}",
                                "logo": null,
                                "description": "No information found for this company."
                            }`
                        }
                    ]
                },
                {
                    headers: {
                        'api-key': azureOpenAIKey.value,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Parse the response from Azure OpenAI
            const content = azureOpenAIResponse.data.choices[0].message.content;
            const companyInfo = JSON.parse(content);
            
            // If no logo was found, use a data URI placeholder image
            if (!companyInfo.logo) {
                companyInfo.logo = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
                        <rect width="150" height="150" fill="#f0f0f0"/>
                        <text x="75" y="75" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle" fill="#666">
                            Not Found
                        </text>
                    </svg>
                `);
                companyInfo.notFound = true;
            }
            
            return res.json(companyInfo);
        } catch (error) {
            console.error('Error calling Azure OpenAI:', error);
            return res.status(500).json({ 
                error: 'Failed to fetch company information',
                details: error.message
            });
        }
        */
        
        // Use a data URI for the placeholder image instead of an external service
        const placeholderImage = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
                <rect width="150" height="150" fill="#f0f0f0"/>
                <text x="75" y="75" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle" fill="#666">
                    Not Found
                </text>
            </svg>
        `);
        
        return res.json({
            name: formattedName,
            logo: placeholderImage,
            description: `No information found for "${formattedName}". This company may not be in our database or may not exist.`,
            notFound: true
        });
        
    } catch (error) {
        console.error('Error searching for company:', error);
        res.status(500).json({ error: 'Failed to fetch company information' });
    }
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
