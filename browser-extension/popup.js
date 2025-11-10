// Popup script for AI Prompt Firewall extension

const GATEWAY_URL_KEY = 'gateway_url';
const ENABLED_KEY = 'enabled';
const STATS_KEY = 'firewall_stats';
const DEFAULT_GATEWAY_URL = 'http://localhost:8000';

// Load settings and stats
async function loadSettings() {
  const result = await chrome.storage.local.get([GATEWAY_URL_KEY, ENABLED_KEY, STATS_KEY]);
  
  // Set gateway URL
  const gatewayUrl = result[GATEWAY_URL_KEY] || DEFAULT_GATEWAY_URL;
  document.getElementById('gateway-url').value = gatewayUrl;
  
  // Set enabled state
  const enabled = result[ENABLED_KEY] !== false;
  updateToggleState(enabled);
  
  // Load stats
  const stats = result[STATS_KEY] || { blocked: 0, allowed: 0, errors: 0 };
  document.getElementById('blocked-count').textContent = stats.blocked || 0;
  document.getElementById('allowed-count').textContent = stats.allowed || 0;
  document.getElementById('errors-count').textContent = stats.errors || 0;
}

// Update toggle visual state
function updateToggleState(enabled) {
  const toggleSwitch = document.getElementById('toggle-switch');
  const statusDiv = document.getElementById('status');
  
  if (enabled) {
    toggleSwitch.classList.add('active');
    statusDiv.className = 'status active';
    statusDiv.innerHTML = '<strong>✅ Active</strong><div style="font-size: 12px; margin-top: 4px;">Protecting ChatGPT, Claude, and more</div>';
  } else {
    toggleSwitch.classList.remove('active');
    statusDiv.className = 'status inactive';
    statusDiv.innerHTML = '<strong>❌ Inactive</strong><div style="font-size: 12px; margin-top: 4px;">Firewall is disabled</div>';
  }
}

// Save gateway URL
async function saveGatewayUrl() {
  const url = document.getElementById('gateway-url').value.trim();
  const errorDiv = document.getElementById('gateway-error');
  const successDiv = document.getElementById('gateway-success');
  
  // Hide previous messages
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
  
  // Validate URL
  if (!url) {
    errorDiv.textContent = 'Gateway URL is required';
    errorDiv.style.display = 'block';
    return;
  }
  
  try {
    new URL(url); // Validate URL format
    await chrome.storage.local.set({ [GATEWAY_URL_KEY]: url });
    errorDiv.style.display = 'none';
    
    // Show success feedback
    const input = document.getElementById('gateway-url');
    input.style.borderColor = '#10b981';
    setTimeout(() => {
      input.style.borderColor = '#d1d5db';
    }, 1000);
  } catch (e) {
    errorDiv.textContent = 'Invalid URL format';
    errorDiv.style.display = 'block';
  }
}

// Test gateway connection
async function testConnection() {
  const url = document.getElementById('gateway-url').value.trim();
  const errorDiv = document.getElementById('gateway-error');
  const successDiv = document.getElementById('gateway-success');
  const testButton = document.getElementById('test-connection');
  
  // Hide previous messages
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
  
  // Validate URL format first
  if (!url) {
    errorDiv.textContent = 'Please enter a gateway URL';
    errorDiv.style.display = 'block';
    return;
  }
  
  try {
    new URL(url);
  } catch (e) {
    errorDiv.textContent = 'Invalid URL format';
    errorDiv.style.display = 'block';
    return;
  }
  
  // Disable button during test
  testButton.disabled = true;
  testButton.textContent = 'Testing...';
  
  try {
    // Test health endpoint
    const healthUrl = url.endsWith('/') ? `${url}health` : `${url}/health`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      // Connection successful
      successDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      
      // Save the URL if test succeeds
      await chrome.storage.local.set({ [GATEWAY_URL_KEY]: url });
      
      // Show success feedback on input
      const input = document.getElementById('gateway-url');
      input.style.borderColor = '#10b981';
      setTimeout(() => {
        input.style.borderColor = '#d1d5db';
      }, 2000);
    } else {
      throw new Error(`Gateway returned status ${response.status}`);
    }
  } catch (e) {
    // Connection failed
    errorDiv.textContent = `Connection failed: ${e.message}. Make sure the gateway is running and accessible.`;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
  } finally {
    // Re-enable button
    testButton.disabled = false;
    testButton.textContent = 'Test';
  }
}

// Toggle enabled state
async function toggleEnabled() {
  const result = await chrome.storage.local.get([ENABLED_KEY]);
  const currentState = result[ENABLED_KEY] !== false;
  const newState = !currentState;
  
  await chrome.storage.local.set({ [ENABLED_KEY]: newState });
  updateToggleState(newState);
}

// Reset statistics
async function resetStats() {
  if (confirm('Reset all statistics?')) {
    await chrome.storage.local.set({ 
      [STATS_KEY]: { blocked: 0, allowed: 0, errors: 0 } 
    });
    document.getElementById('blocked-count').textContent = '0';
    document.getElementById('allowed-count').textContent = '0';
    document.getElementById('errors-count').textContent = '0';
  }
}

// Get dashboard URL from gateway URL
function getDashboardUrl() {
  const gatewayUrl = document.getElementById('gateway-url').value || DEFAULT_GATEWAY_URL;
  // Dashboard is typically on port 3000, but we'll try to infer from gateway URL
  // For now, just link to gateway health endpoint
  return gatewayUrl.replace(':8000', ':3000') || 'http://localhost:3000';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  // Gateway URL input
  const gatewayInput = document.getElementById('gateway-url');
  gatewayInput.addEventListener('blur', saveGatewayUrl);
  gatewayInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveGatewayUrl();
    }
  });
  
  // Test connection button
  document.getElementById('test-connection').addEventListener('click', testConnection);
  
  // Toggle enabled
  document.getElementById('toggle-enabled').addEventListener('click', toggleEnabled);
  
  // Reset stats
  document.getElementById('reset-stats').addEventListener('click', resetStats);
  
  // Dashboard link
  document.getElementById('dashboard-link').addEventListener('click', (e) => {
    e.preventDefault();
    const dashboardUrl = getDashboardUrl();
    chrome.tabs.create({ url: dashboardUrl });
  });
  
  // Listen for stats updates
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STATS_KEY]) {
      const stats = changes[STATS_KEY].newValue || { blocked: 0, allowed: 0, errors: 0 };
      document.getElementById('blocked-count').textContent = stats.blocked || 0;
      document.getElementById('allowed-count').textContent = stats.allowed || 0;
      document.getElementById('errors-count').textContent = stats.errors || 0;
    }
  });
});

