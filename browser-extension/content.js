// Content script for AI Prompt Firewall extension
// Injects UI elements and handles fetch/XHR interception as fallback

// Listen for blocking messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BLOCKED') {
    showBlockedMessage(message.reason, message.violations, message.provider);
  }
  return true;
});

// Show blocking overlay
function showBlockedMessage(reason, violations = [], provider = 'unknown') {
  // Remove any existing overlay
  const existing = document.getElementById('aifirewall-blocked-overlay');
  if (existing) {
    existing.remove();
  }
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'aifirewall-blocked-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    animation: fadeIn 0.2s ease-in;
  `;
  
  const messageBox = document.createElement('div');
  messageBox.style.cssText = `
    background: white;
    padding: 32px;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 25px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease-out;
  `;
  
  let html = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
      <h2 style="margin: 0 0 8px 0; color: #dc2626; font-size: 24px; font-weight: 600;">Request Blocked</h2>
      <p style="color: #64748b; margin: 0; font-size: 14px;">${escapeHtml(reason)}</p>
    </div>
  `;
  
  if (violations && violations.length > 0) {
    html += `
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #dc2626;">
        <strong style="color: #991b1b; display: block; margin-bottom: 8px; font-size: 14px;">Security Violations Detected:</strong>
        <ul style="margin: 0; padding-left: 20px; color: #991b1b; font-size: 13px; line-height: 1.6;">
          ${violations.map(v => `<li>${escapeHtml(v.message || v.type)}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  html += `
    <button id="aifirewall-close" style="
      width: 100%;
      padding: 12px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">Close</button>
  `;
  
  messageBox.innerHTML = html;
  overlay.appendChild(messageBox);
  document.body.appendChild(overlay);
  
  // Close button handler
  messageBox.querySelector('#aifirewall-close').addEventListener('click', () => {
    overlay.remove();
  });
  
  // Auto-close after 10 seconds
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      overlay.remove();
    }
  }, 10000);
  
  // Add CSS animations
  if (!document.getElementById('aifirewall-styles')) {
    const style = document.createElement('style');
    style.id = 'aifirewall-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fallback: Intercept fetch/XHR at page level
(function() {
  // Only inject if we're on an LLM site
  const isLLMSite = window.location.hostname.includes('openai.com') ||
                     window.location.hostname.includes('claude.ai') ||
                     window.location.hostname.includes('bard.google.com') ||
                     window.location.hostname.includes('gemini.google.com');
  
  if (!isLLMSite) return;
  
  // Get gateway URL from storage
  chrome.storage.local.get(['gateway_url', 'enabled'], (result) => {
    const gatewayUrl = result.gateway_url || 'http://localhost:8000';
    const enabled = result.enabled !== false;
    
    if (!enabled) return;
    
    // Wrap fetch
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const [url, options = {}] = args;
      
      // Check if it's an LLM API call
      const isLLMRequest = 
        (typeof url === 'string' && (
          url.includes('api.openai.com/v1/chat/completions') ||
          url.includes('api.anthropic.com/v1/messages') ||
          url.includes('generativelanguage.googleapis.com') && url.includes(':generateContent')
        ));
      
      if (!isLLMRequest) {
        return originalFetch.apply(this, args);
      }
      
      // Determine provider
      let provider = 'openai';
      let gatewayEndpoint = '/v1/chat/completions';
      
      if (url.includes('api.anthropic.com')) {
        provider = 'anthropic';
        gatewayEndpoint = '/v1/anthropic/messages';
      } else if (url.includes('generativelanguage.googleapis.com')) {
        provider = 'google';
        const modelMatch = url.match(/models\/([^:]+):generateContent/);
        const model = modelMatch ? modelMatch[1] : 'gemini-pro';
        gatewayEndpoint = `/v1/google/models/${model}:generateContent`;
      }
      
      // Prepare gateway request
      const gatewayUrlFull = `${gatewayUrl}${gatewayEndpoint}`;
      const gatewayHeaders = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      // Handle provider-specific headers
      if (provider === 'anthropic') {
        const authHeader = options.headers?.Authorization || options.headers?.['authorization'];
        if (authHeader) {
          const apiKey = authHeader.replace('Bearer ', '');
          gatewayHeaders['x-api-key'] = apiKey;
          gatewayHeaders['anthropic-version'] = '2023-06-01';
          delete gatewayHeaders.Authorization;
          delete gatewayHeaders.authorization;
        }
      }
      
      try {
        // Send to gateway
        const response = await originalFetch(gatewayUrlFull, {
          ...options,
          headers: gatewayHeaders
        });
        
        if (response.status === 403) {
          // Blocked - show UI
          const errorData = await response.json();
          showBlockedMessage(
            errorData.error?.message || 'Security violation detected',
            errorData.error?.violations || [],
            provider
          );
          
          // Update stats
          chrome.runtime.sendMessage({
            type: 'UPDATE_STATS',
            statType: 'blocked'
          });
          
          // Return error response
          return new Response(
            JSON.stringify(errorData),
            {
              status: 403,
              statusText: 'Forbidden',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } else if (response.status === 200) {
          // Allowed - check if streaming
          const contentType = response.headers.get('content-type') || '';
          const isStreaming = contentType.includes('text/event-stream') || 
                             options.body && JSON.parse(options.body || '{}').stream === true;
          
          if (isStreaming) {
            // For streaming responses, return the gateway's stream
            // Gateway forwards the SSE stream from the LLM
            chrome.runtime.sendMessage({
              type: 'UPDATE_STATS',
              statType: 'allowed'
            });
            return response; // Return streaming response
          } else {
            // Non-streaming: Gateway forwards and returns response
            chrome.runtime.sendMessage({
              type: 'UPDATE_STATS',
              statType: 'allowed'
            });
            return response;
          }
        } else {
          // Error - fail open
          chrome.runtime.sendMessage({
            type: 'UPDATE_STATS',
            statType: 'error'
          });
          return originalFetch.apply(this, args);
        }
      } catch (error) {
        // Network error - fail open
        console.error('Firewall gateway error:', error);
        chrome.runtime.sendMessage({
          type: 'UPDATE_STATS',
          statType: 'error'
        });
        return originalFetch.apply(this, args);
      }
    };
  });
})();

