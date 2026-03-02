/**
 * Server Configuration & Health Check Module
 * Auto-detects server URL from page origin
 * Provides graceful degradation if server is unavailable
 */

class ServerConfig {
	// auto-detect server and provide safe fetch with timeout/retry
	constructor() {
		this.requestTimeout = 8000;
		this.retryAttempts = 1;
		this.proxyWhitelist = [
			'dl.polyhaven.org',
			'polyhaven.org'
		];
		this.serverUrl = this.detectServerUrl();
		this.isHealthy = false;
		this._init();
	}

	/**
	 * Auto-detect server URL from page origin
	 */
	detectServerUrl() {
		try {
			const proto = window.location.protocol; // http: or https:
			const host = window.location.hostname;
			const port = window.location.port ? `:${window.location.port}` : '';
			
			// If served from localhost/127.0.0.1 on port 80/443, assume server is on 5000
			if ((host === 'localhost' || host === '127.0.0.1') && (!window.location.port || window.location.port === '80' || window.location.port === '443')) {
				return `${proto}//localhost:5000`;
			}
			
			// Otherwise, assume server is on same origin
			return `${proto}//${host}${port}`;
		} catch (e) {
			return 'http://localhost:5000';
		}
	}

	async _init() {
		await this.checkHealth();
	}

	/**
	 * Check server health on startup
	 */
	async checkHealth() {
		try {
			const controller = new AbortController();
			const id = setTimeout(() => controller.abort(), this.requestTimeout);
			const res = await fetch(`${this.serverUrl}/health`, { method: 'GET', signal: controller.signal });
			clearTimeout(id);
			this.isHealthy = !!res.ok;
			return this.isHealthy;
		} catch (e) {
			this.isHealthy = false;
			return false;
		}
	}

	/**
	 * Safe fetch wrapper with timeout and retry logic
	 */
	async safeFetch(endpoint, opts = {}) {
		// If server appears down, do not block main flow - return object with offline flag
		if (!this.isHealthy) return { ok: false, offline: true, status: 0, error: 'server-unavailable' };
		const url = endpoint.startsWith('http') ? endpoint : `${this.serverUrl}${endpoint}`;
		let lastErr = null;
		for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
			try {
				const controller = new AbortController();
				const id = setTimeout(() => controller.abort(), this.requestTimeout);
				const resp = await fetch(url, { ...opts, signal: controller.signal });
				clearTimeout(id);
				return resp;
			} catch (e) {
				lastErr = e;
				// small backoff
				await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
			}
		}
		return { ok: false, offline: true, status: 0, error: lastErr && lastErr.message ? lastErr.message : 'network-error' };
	}

	/**
	 * Validate if domain is in whitelist for proxy access
	 */
	isProxyAllowed(resourceUrl) {
		try {
			const host = new URL(resourceUrl).hostname;
			return this.proxyWhitelist.some(allowed => host.includes(allowed));
		} catch (e) { return false; }
	}

	/**
	 * Get proxy URL for CORS-blocked resources
	 */
	getProxyUrl(resourceUrl) {
		// returns a server-side proxy URL if domain allowed
		if (!this.isProxyAllowed(resourceUrl)) return null;
		return `${this.serverUrl}/proxy?url=${encodeURIComponent(resourceUrl)}`;
	}
}

// Create global instance
window.serverConfig = new ServerConfig();

// Run health check on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.serverConfig.checkHealth().then(healthy => {
                if (!healthy) {
                    console.warn('[App] Server unavailable - running in offline mode');
                    if (typeof showTemporaryToast === 'function') showTemporaryToast('Running in offline mode');
                }
            });
        }, 500);
    });
} else {
    setTimeout(() => {
        window.serverConfig.checkHealth().then(healthy => {
            if (!healthy) {
                console.warn('[App] Server unavailable - running in offline mode');
            }
        });
    }, 500);
}
