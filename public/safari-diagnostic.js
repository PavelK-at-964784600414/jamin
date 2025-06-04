// Safari Production Mode Diagnostic Tool
// This script helps diagnose and fix Service Worker issues in Safari

console.log('🔍 Safari Diagnostic Tool Starting...');
console.log('🌐 User Agent:', navigator.userAgent);
console.log('📍 Location:', window.location.href);
console.log('🔧 Document Ready State:', document.readyState);

// Test Safari-specific features
console.log('🧪 Safari Feature Tests:');
console.log('  - Service Workers supported:', 'serviceWorker' in navigator);
console.log('  - Cache API supported:', 'caches' in window);
console.log('  - Document querySelector works:', !!document.querySelector);
console.log('  - addEventListener supported:', !!document.addEventListener);

// Store diagnostic results
const diagnosticResults = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    isLocalhost: window.location.hostname === 'localhost',
    isHTTPS: window.location.protocol === 'https:',
    isProduction: window.location.port === '3000' && window.location.protocol === 'http:',
    serviceWorkers: [],
    caches: [],
    errors: []
};

// Diagnostic functions
async function checkServiceWorkers() {
    console.log('📋 Checking Service Workers...');
    
    if (!('serviceWorker' in navigator)) {
        diagnosticResults.errors.push('Service Worker not supported');
        return;
    }

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`Found ${registrations.length} Service Worker registrations`);
        
        for (let i = 0; i < registrations.length; i++) {
            const reg = registrations[i];
            const swInfo = {
                index: i,
                scope: reg.scope,
                state: reg.active ? reg.active.state : 'no active worker',
                scriptURL: reg.active ? reg.active.scriptURL : 'unknown',
                updateViaCache: reg.updateViaCache
            };
            
            diagnosticResults.serviceWorkers.push(swInfo);
            console.log(`SW ${i}:`, swInfo);
        }
    } catch (error) {
        diagnosticResults.errors.push(`Service Worker check failed: ${error.message}`);
        console.error('Service Worker check failed:', error);
    }
}

async function checkCaches() {
    console.log('💾 Checking Caches...');
    
    if (!('caches' in window)) {
        diagnosticResults.errors.push('Cache API not supported');
        return;
    }

    try {
        const cacheNames = await caches.keys();
        console.log(`Found ${cacheNames.length} caches:`, cacheNames);
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            
            const cacheInfo = {
                name: cacheName,
                entryCount: keys.length,
                entries: keys.slice(0, 5).map(req => req.url) // First 5 entries
            };
            
            diagnosticResults.caches.push(cacheInfo);
            console.log(`Cache "${cacheName}":`, cacheInfo);
        }
    } catch (error) {
        diagnosticResults.errors.push(`Cache check failed: ${error.message}`);
        console.error('Cache check failed:', error);
    }
}

async function clearAllServiceWorkers() {
    console.log('🧹 Clearing ALL Service Workers...');
    
    if (!('serviceWorker' in navigator)) {
        console.log('❌ Service Worker not supported');
        return false;
    }

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        let cleared = 0;
        
        for (const registration of registrations) {
            console.log(`Unregistering SW: ${registration.scope}`);
            await registration.unregister();
            cleared++;
        }
        
        console.log(`✅ Cleared ${cleared} Service Worker registrations`);
        return cleared > 0;
    } catch (error) {
        console.error('❌ Failed to clear Service Workers:', error);
        return false;
    }
}

async function clearAllCaches() {
    console.log('🧹 Clearing ALL Caches...');
    
    if (!('caches' in window)) {
        console.log('❌ Cache API not supported');
        return false;
    }

    try {
        const cacheNames = await caches.keys();
        let cleared = 0;
        
        for (const cacheName of cacheNames) {
            console.log(`Deleting cache: ${cacheName}`);
            await caches.delete(cacheName);
            cleared++;
        }
        
        console.log(`✅ Cleared ${cleared} caches`);
        return cleared > 0;
    } catch (error) {
        console.error('❌ Failed to clear caches:', error);
        return false;
    }
}

async function performFullReset() {
    console.log('🔄 Performing Full Reset...');
    
    const swCleared = await clearAllServiceWorkers();
    const cachesCleared = await clearAllCaches();
    
    if (swCleared || cachesCleared) {
        console.log('✅ Reset completed! Reloading page in 3 seconds...');
        setTimeout(() => {
            window.location.reload();
        }, 3000);
        return true;
    } else {
        console.log('ℹ️ Nothing to clear');
        return false;
    }
}

// Update UI functions
function updateResultsDisplay() {
    const resultsElement = document.getElementById('diagnostic-results');
    if (!resultsElement) return;
    
    resultsElement.innerHTML = `
        <h3>Diagnostic Results</h3>
        <div class="result-section">
            <h4>Environment</h4>
            <ul>
                <li>Browser: ${diagnosticResults.isSafari ? 'Safari' : 'Other'}</li>
                <li>Location: ${window.location.href}</li>
                <li>Protocol: ${diagnosticResults.isHTTPS ? 'HTTPS' : 'HTTP'}</li>
                <li>Is Production Mode: ${diagnosticResults.isProduction ? 'Yes' : 'No'}</li>
            </ul>
        </div>
        
        <div class="result-section">
            <h4>Service Workers (${diagnosticResults.serviceWorkers.length})</h4>
            ${diagnosticResults.serviceWorkers.length === 0 ? 
                '<p>✅ No Service Workers found</p>' : 
                diagnosticResults.serviceWorkers.map(sw => `
                    <div class="sw-item">
                        <strong>SW ${sw.index}:</strong> ${sw.state}<br>
                        <small>Scope: ${sw.scope}</small><br>
                        <small>Script: ${sw.scriptURL}</small>
                    </div>
                `).join('')
            }
        </div>
        
        <div class="result-section">
            <h4>Caches (${diagnosticResults.caches.length})</h4>
            ${diagnosticResults.caches.length === 0 ? 
                '<p>✅ No caches found</p>' : 
                diagnosticResults.caches.map(cache => `
                    <div class="cache-item">
                        <strong>${cache.name}:</strong> ${cache.entryCount} entries<br>
                        <small>Sample entries: ${cache.entries.slice(0, 2).join(', ')}</small>
                    </div>
                `).join('')
            }
        </div>
        
        ${diagnosticResults.errors.length > 0 ? `
            <div class="result-section">
                <h4>Errors</h4>
                <ul>
                    ${diagnosticResults.errors.map(error => `<li style="color: red;">${error}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('status-message');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = 'block';
    
    if (type !== 'error') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }
}

// Main diagnostic function
async function runDiagnostic() {
    console.log('🔍 Running complete diagnostic...');
    showStatus('Running diagnostic...', 'info');
    
    // Reset results
    diagnosticResults.serviceWorkers = [];
    diagnosticResults.caches = [];
    diagnosticResults.errors = [];
    
    await checkServiceWorkers();
    await checkCaches();
    
    updateResultsDisplay();
    showStatus('Diagnostic complete!', 'success');
    
    // Show recommendations
    const recommendationsElement = document.getElementById('recommendations');
    if (recommendationsElement) {
        let recommendations = '';
        
        if (diagnosticResults.isSafari && diagnosticResults.isLocalhost && diagnosticResults.serviceWorkers.length > 0) {
            recommendations += `
                <div class="recommendation error">
                    ⚠️ <strong>Safari Issue Detected:</strong> Found ${diagnosticResults.serviceWorkers.length} cached Service Workers that may be causing production mode failures.
                    <br><br>
                    <strong>Recommended Action:</strong> Click "Full Reset" button below to clear all Service Workers and caches.
                </div>
            `;
        }
        
        if (diagnosticResults.caches.length > 0) {
            recommendations += `
                <div class="recommendation warning">
                    📦 Found ${diagnosticResults.caches.length} cached data stores. These may contain outdated resources.
                </div>
            `;
        }
        
        if (diagnosticResults.serviceWorkers.length === 0 && diagnosticResults.caches.length === 0) {
            recommendations += `
                <div class="recommendation success">
                    ✅ Clean state detected! No cached Service Workers or data found.
                </div>
            `;
        }
        
        recommendationsElement.innerHTML = recommendations;
    }
}

// Event handlers
async function handleFullReset() {
    if (confirm('This will clear ALL Service Workers and caches, then reload the page. Continue?')) {
        showStatus('Performing full reset...', 'info');
        await performFullReset();
    }
}

async function handleClearSW() {
    showStatus('Clearing Service Workers...', 'info');
    const cleared = await clearAllServiceWorkers();
    if (cleared) {
        showStatus('Service Workers cleared!', 'success');
        await runDiagnostic();
    } else {
        showStatus('No Service Workers to clear', 'info');
    }
}

async function handleClearCaches() {
    showStatus('Clearing caches...', 'info');
    const cleared = await clearAllCaches();
    if (cleared) {
        showStatus('Caches cleared!', 'success');
        await runDiagnostic();
    } else {
        showStatus('No caches to clear', 'info');
    }
}

// Safari-compatible event binding function
function bindEventSafari(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`⚠️ Element not found: ${elementId}`);
        return false;
    }
    
    console.log(`🔧 Binding ${eventType} event to ${elementId}`);
    
    // Method 1: Direct onclick assignment (Safari's most reliable method)
    if (eventType === 'click') {
        element.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🖱️ Safari Click detected on ${elementId}`);
            try {
                handler();
            } catch (error) {
                console.error(`❌ Handler error for ${elementId}:`, error);
            }
            return false;
        };
    }
    
    // Method 2: addEventListener (for modern Safari)
    try {
        element.addEventListener(eventType, function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🎯 Event listener triggered on ${elementId}`);
            try {
                handler();
            } catch (error) {
                console.error(`❌ Event handler error for ${elementId}:`, error);
            }
        }, { 
            passive: false,
            capture: false 
        });
    } catch (error) {
        console.warn(`⚠️ addEventListener failed for ${elementId}:`, error);
    }
    
    // Method 3: Visual feedback to confirm button is interactive
    try {
        element.style.cursor = 'pointer';
        element.style.transition = 'background-color 0.2s';
        
        element.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
        
        element.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        element.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
        
    } catch (error) {
        console.warn(`⚠️ Visual feedback setup failed for ${elementId}:`, error);
    }
    
    console.log(`✅ Event bound successfully for ${elementId}`);
    return true;
}

// Test if JavaScript and DOM manipulation works in Safari
function addSafariTestButton() {
    console.log('🧪 Adding Safari test button...');
    
    try {
        // Create a simple test button
        const testButton = document.createElement('button');
        testButton.id = 'safari-test-btn';
        testButton.textContent = '🧪 Safari JS Test (Click Me!)';
        testButton.style.cssText = `
            background: #34C759; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 6px; 
            margin: 10px 0; 
            display: block;
            cursor: pointer;
            font-size: 14px;
        `;
        
        // Add multiple click handlers for Safari compatibility
        testButton.onclick = function() {
            alert('✅ JavaScript and DOM manipulation working in Safari!');
            console.log('✅ Safari test button clicked successfully!');
        };
        
        testButton.addEventListener('click', function() {
            console.log('✅ addEventListener working in Safari!');
        });
        
        // Insert at the top of the container
        const container = document.querySelector('.container');
        if (container && container.firstChild) {
            container.insertBefore(testButton, container.firstChild.nextSibling);
            console.log('✅ Safari test button added successfully');
        } else {
            console.log('❌ Could not find container to add test button');
        }
    } catch (error) {
        console.error('❌ Failed to create Safari test button:', error);
    }
}

// Safari HSTS cache clearing function
function addSafariHTTPSWarning() {
    console.log('⚠️ Adding Safari HTTPS warning...');
    
    // Check if we're being redirected to HTTPS
    if (window.location.protocol === 'https:') {
        try {
            const warningDiv = document.createElement('div');
            warningDiv.id = 'safari-https-warning';
            warningDiv.style.cssText = `
                background: #FF3B30; 
                color: white; 
                padding: 15px; 
                border-radius: 8px; 
                margin: 15px 0; 
                font-weight: bold;
                border: 2px solid #D70015;
            `;
            warningDiv.innerHTML = `
                <strong>⚠️ SAFARI HTTPS REDIRECT DETECTED!</strong><br><br>
                Safari has cached HTTPS for localhost and is redirecting you. This causes SSL errors.<br><br>
                <strong>FIX:</strong> Go to <code>http://localhost:3000/safari-diagnostic</code> directly, or:<br>
                1. Open Safari → Develop → Empty Caches<br>
                2. Clear browsing data for localhost<br>
                3. Restart Safari<br><br>
                <button onclick="window.location.href='http://localhost:3000/safari-diagnostic'" 
                        style="background: white; color: #FF3B30; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    Force HTTP Redirect
                </button>
            `;
            
            const container = document.querySelector('.container');
            if (container && container.firstChild) {
                container.insertBefore(warningDiv, container.firstChild.nextSibling);
                console.log('✅ Safari HTTPS warning added');
            }
        } catch (error) {
            console.error('❌ Failed to create Safari HTTPS warning:', error);
        }
    }
}

// Global handlers for Safari compatibility
window.safariDiagnosticHandlers = {
    run_diagnostic: function() {
        console.log('🔍 Global handler: run_diagnostic called');
        runDiagnostic();
    },
    full_reset: function() {
        console.log('🔄 Global handler: full_reset called');
        handleFullReset();
    },
    clear_sw: function() {
        console.log('🧹 Global handler: clear_sw called');
        handleClearSW();
    },
    clear_caches: function() {
        console.log('💾 Global handler: clear_caches called');
        handleClearCaches();
    }
};

// Initialize when DOM is ready
function initializeDiagnostic() {
    console.log('🚀 Initializing Safari Diagnostic Tool');
    console.log('Browser:', navigator.userAgent);
    console.log('Document ready state:', document.readyState);
    console.log('Protocol:', window.location.protocol);
    console.log('Host:', window.location.host);
    
    // Add HTTPS warning if needed
    addSafariHTTPSWarning();
    
    // Add test button
    addSafariTestButton();
    
    // Wait for DOM to be fully ready in Safari
    setTimeout(() => {
        console.log('⏰ Starting delayed initialization for Safari...');
        
        // Bind event handlers with Safari-compatible methods
        const buttons = [
            { id: 'run-diagnostic', handler: runDiagnostic },
            { id: 'full-reset', handler: handleFullReset },
            { id: 'clear-sw', handler: handleClearSW },
            { id: 'clear-caches', handler: handleClearCaches }
        ];
        
        let bindingSuccess = 0;
        for (const button of buttons) {
            if (bindEventSafari(button.id, 'click', button.handler)) {
                bindingSuccess++;
            }
        }
        
        console.log(`✅ Successfully bound ${bindingSuccess}/${buttons.length} buttons`);
        
        // Test button existence and properties
        buttons.forEach(button => {
            const element = document.getElementById(button.id);
            if (element) {
                console.log(`Button ${button.id}: exists=${!!element}, visible=${element.offsetWidth > 0}, enabled=${!element.disabled}, clickable=${element.style.cursor === 'pointer'}`);
                
                // Force cursor and ensure button is interactive
                element.style.cursor = 'pointer';
                element.style.userSelect = 'none';
                element.style.webkitUserSelect = 'none';
                
            } else {
                console.log(`❌ Button ${button.id} not found in DOM`);
            }
        });
        
        // Show that JS is working
        if (window.location.protocol === 'http:') {
            showStatus('🚀 Safari diagnostic tool loaded and ready! (HTTP mode)', 'success');
        } else {
            showStatus('⚠️ Tool loaded but running on HTTPS - may have issues', 'warning');
        }
        
        // Run initial diagnostic after a longer delay for Safari
        setTimeout(() => {
            console.log('🏃 Running initial diagnostic...');
            runDiagnostic();
        }, 1500);
        
    }, 300);
}

// Multiple initialization strategies for Safari compatibility
function ensureInitialization() {
    console.log('🔄 Ensuring diagnostic tool initialization...');
    
    // Strategy 1: Immediate if DOM is ready
    if (document.readyState === 'complete') {
        console.log('📄 DOM complete, initializing immediately');
        initializeDiagnostic();
        return;
    }
    
    // Strategy 2: DOMContentLoaded
    if (document.readyState === 'loading') {
        console.log('⏳ DOM loading, waiting for DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 DOMContentLoaded fired');
            initializeDiagnostic();
        });
    } else {
        console.log('📄 DOM interactive, initializing with delay');
        initializeDiagnostic();
    }
    
    // Strategy 3: Window load (final fallback)
    window.addEventListener('load', function() {
        console.log('🌐 Window load event fired');
        // Only initialize if not already done
        if (!window.safariDiagnosticInitialized) {
            console.log('🔧 Fallback initialization from window load');
            initializeDiagnostic();
        }
        window.safariDiagnosticInitialized = true;
    });
}

// Start initialization
ensureInitialization();
