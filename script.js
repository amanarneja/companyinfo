// DOM Elements
const searchForm = document.getElementById('search-form');
const companyNameInput = document.getElementById('company-name');
const resultsContainer = document.getElementById('results');
const loadingElement = document.getElementById('loading');
const errorMessageElement = document.getElementById('error-message');
const companyInfoElement = document.getElementById('company-info');
const companyLogoElement = document.getElementById('company-logo');
const companyTitleElement = document.getElementById('company-title');
const companyDescriptionElement = document.getElementById('company-description');

// Event Listeners
searchForm.addEventListener('submit', handleSearch);

// Main search handler function
async function handleSearch(event) {
    event.preventDefault();
    
    const companyName = companyNameInput.value.trim();
    
    if (!companyName) {
        showError('Please enter a company name');
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        // In a real application, this would be an API call to a backend service
        // that would then call an LLM API. For this demo, we'll simulate the response.
        const companyInfo = await fetchCompanyInfo(companyName);
        displayCompanyInfo(companyInfo);
    } catch (error) {
        console.error('Error fetching company info:', error);
        showError('Failed to fetch company information. Please try again.');
    }
}

// Function to fetch company info from the backend API
async function fetchCompanyInfo(companyName) {
    try {
        // Get the API URL - in production this would be your Azure deployed backend
        const apiUrl = 'http://localhost:3001/api/search';
        
        // Make the API request to the backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ companyName }),
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        // Parse the JSON response
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching from API:', error);
        // If the API call fails, return a generic error response
        return {
            name: companyName,
            logo: 'https://via.placeholder.com/150x150?text=Error',
            description: 'An error occurred while fetching company information. Please try again later.',
            error: true
        };
    }
}

// Function to handle unknown companies
function handleUnknownCompany(companyName) {
    // Format the company name properly
    const formattedName = companyName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    // Create a "not found" response
    return {
        name: formattedName,
        logo: 'https://via.placeholder.com/150x150?text=Not+Found',
        description: `No information found for "${formattedName}". This company may not be in our database or may not exist.`,
        notFound: true
    };
}

// UI Helper Functions
function showLoading() {
    // Hide other elements
    errorMessageElement.classList.add('hidden');
    companyInfoElement.classList.add('hidden');
    
    // Show loading spinner
    loadingElement.classList.remove('hidden');
}

function showError(message) {
    // Hide other elements
    loadingElement.classList.add('hidden');
    companyInfoElement.classList.add('hidden');
    
    // Update and show error message
    errorMessageElement.querySelector('p').textContent = message;
    errorMessageElement.classList.remove('hidden');
}

function displayCompanyInfo(companyInfo) {
    // Hide other elements
    loadingElement.classList.add('hidden');
    errorMessageElement.classList.add('hidden');
    
    // Update company info elements
    companyLogoElement.src = companyInfo.logo;
    companyLogoElement.alt = `${companyInfo.name} Logo`;
    companyTitleElement.textContent = companyInfo.name;
    companyDescriptionElement.textContent = companyInfo.description;
    
    // Apply special styling for not found or error cases
    if (companyInfo.notFound || companyInfo.error) {
        companyInfoElement.classList.add('not-found');
    } else {
        companyInfoElement.classList.remove('not-found');
    }
    
    // Show company info
    companyInfoElement.classList.remove('hidden');
}
