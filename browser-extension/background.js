// Background service worker for AI Prompt Firewall extension
// Intercepts LLM API requests and routes them through the gateway

// Configuration
const DEFAULT_GATEWAY_URL = 'http://localhost:8000';
const STATS_KEY = 'firewall_stats';
const GATEWAY_URL_KEY = 'gateway_url';
const ENABLED_KEY = 'enabled';

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  // Set default values
  const result = await chrome.storage.local.get([GATEWAY_URL_KEY, ENABLED_KEY, STATS_KEY]);
  
  if (!result[GATEWAY_URL_KEY]) {
    await chrome.storage.local.set({ [GATEWAY_URL_KEY]: DEFAULT_GATEWAY_URL });
  }
  
  if (result[ENABLED_KEY] === undefined) {
    await chrome.storage.local.set({ [ENABLED_KEY]: true });
  }
  
  if (!result[STATS_KEY]) {
    await chrome.storage.local.set({ 
      [STATS_KEY]: { 
        blocked: 0, 
        allowed: 0,
        errors: 0
      } 
    });
  }
});

// Helper function to check if URL is an LLM API endpoint
function isLLMAPIRequest(url) {
  return (
    url.includes('api.openai.com/v1/chat/completions') ||
    url.includes('api.anthropic.com/v1/messages') ||
    url.includes('generativelanguage.googleapis.com/v1beta/models') && url.includes(':generateContent')
  );
}

// Helper function to determine provider from URL
function getProviderFromURL(url) {
  if (url.includes('api.openai.com')) return 'openai';
  if (url.includes('api.anthropic.com')) return 'anthropic';
  if (url.includes('generativelanguage.googleapis.com')) return 'google';
  return 'unknown';
}

// Helper function to get gateway endpoint for provider
function getGatewayEndpoint(provider, url) {
  switch (provider) {
    case 'openai':
      return '/v1/chat/completions';
    case 'anthropic':
      return '/v1/anthropic/messages';
    case 'google':
      // Extract model from URL
      const modelMatch = url.match(/models\/([^:]+):generateContent/);
      const model = modelMatch ? modelMatch[1] : 'gemini-pro';
      return `/v1/google/models/${model}:generateContent`;
    default:
      return '/v1/chat/completions';
  }
}

// Helper function to update statistics
async function updateStats(type) {
  const result = await chrome.storage.local.get([STATS_KEY]);
  const stats = result[STATS_KEY] || { blocked: 0, allowed: 0, errors: 0 };
  
  if (type === 'blocked') stats.blocked++;
  else if (type === 'allowed') stats.allowed++;
  else if (type === 'error') stats.errors++;
  
  await chrome.storage.local.set({ [STATS_KEY]: stats });
}

// Helper function to get request body from webRequest details
function getRequestBody(details) {
  if (!details.requestBody || !details.requestBody.raw) {
    return null;
  }
  
  try {
    // Decode the request body
    const decoder = new TextDecoder('utf-8');
    const bodyBytes = details.requestBody.raw[0].bytes;
    const bodyText = decoder.decode(bodyBytes);
    return JSON.parse(bodyText);
  } catch (e) {
    console.error('Error parsing request body:', e);
    return null;
  }
}

// Intercept LLM API requests
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    // Check if extension is enabled
    const result = await chrome.storage.local.get([ENABLED_KEY]);
    if (result[ENABLED_KEY] === false) {
      return {}; // Allow request to proceed
    }
    
    // Check if this is an LLM API request
    if (!isLLMAPIRequest(details.url)) {
      return {}; // Not an LLM API, allow to proceed
    }
    
    // Get gateway URL
    const gatewayResult = await chrome.storage.local.get([GATEWAY_URL_KEY]);
    const gatewayUrl = gatewayResult[GATEWAY_URL_KEY] || DEFAULT_GATEWAY_URL;
    
    // Get provider
    const provider = getProviderFromURL(details.url);
    
    // Get request body
    const requestBody = getRequestBody(details);
    if (!requestBody) {
      console.warn('Could not parse request body, allowing request');
      return {}; // Fail open if we can't parse
    }
    
    // Get gateway endpoint
    const endpoint = getGatewayEndpoint(provider, details.url);
    const gatewayEndpoint = `${gatewayUrl}${endpoint}`;
    
    // Extract authorization header
    const authHeader = details.requestHeaders?.find(
      h => h.name.toLowerCase() === 'authorization'
    )?.value || '';
    
    // Prepare headers for gateway request
    const gatewayHeaders = {
      'Content-Type': 'application/json'
    };
    
    // Add provider-specific headers
    if (provider === 'anthropic') {
      // Anthropic uses x-api-key header
      const apiKey = authHeader.replace('Bearer ', '').replace('x-api-key ', '');
      gatewayHeaders['x-api-key'] = apiKey;
      gatewayHeaders['anthropic-version'] = '2023-06-01';
    } else if (provider === 'google') {
      // Google uses Authorization Bearer
      if (authHeader) {
        gatewayHeaders['Authorization'] = authHeader;
      }
    } else {
      // OpenAI uses Authorization Bearer
      if (authHeader) {
        gatewayHeaders['Authorization'] = authHeader;
      }
    }
    
    try {
      // Send request to gateway
      const response = await fetch(gatewayEndpoint, {
        method: 'POST',
        headers: gatewayHeaders,
        body: JSON.stringify(requestBody)
      });
      
      // Handle gateway response
      if (response.status === 403) {
        // Request blocked
        const errorData = await response.json();
        
        // Update stats
        await updateStats('blocked');
        
        // Notify content script to show blocking UI
        chrome.tabs.sendMessage(details.tabId, {
          type: 'BLOCKED',
          reason: errorData.error?.message || 'Security violation detected',
          violations: errorData.error?.violations || [],
          provider: provider
        }).catch(() => {
          // Content script might not be ready, that's okay
        });
        
        // Cancel the original request
        return { cancel: true };
      } else if (response.status === 200) {
        // Request allowed - check if streaming
        const isStreaming = requestBody.stream === true;
        
        if (isStreaming) {
          // For streaming, we need to handle differently
          // The gateway will forward the stream, but we've already intercepted
          // For MVP: Allow the original request to proceed for streaming
          // Future: Implement proper streaming proxy
          await updateStats('allowed');
          return {}; // Allow original request
        } else {
          // Non-streaming: Gateway forwards and returns response
          // We cancel original and let content script handle response
          await updateStats('allowed');
          return { cancel: true };
        }
      } else {
        // Error response
        await updateStats('error');
        console.error('Gateway error:', response.status, await response.text());
        // Fail open - allow request to proceed
        return {};
      }
    } catch (error) {
      // Network error or gateway unavailable
      console.error('Gateway request failed:', error);
      await updateStats('error');
      
      // Fail open - allow request to proceed if gateway is unavailable
      return {};
    }
  },
  {
    urls: [
      "https://api.openai.com/*",
      "https://api.anthropic.com/*",
      "https://generativelanguage.googleapis.com/*"
    ]
  },
  ["requestBody", "blocking", "requestHeaders"]
);

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_GATEWAY_URL') {
    chrome.storage.local.get([GATEWAY_URL_KEY]).then(result => {
      sendResponse({ gatewayUrl: result[GATEWAY_URL_KEY] || DEFAULT_GATEWAY_URL });
    });
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'UPDATE_STATS') {
    updateStats(message.statType);
    sendResponse({ success: true });
  }
});

