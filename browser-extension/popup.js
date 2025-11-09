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

