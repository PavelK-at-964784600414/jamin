/**
 * Client-side CSP nonce utilities
 * Access the nonce from window global variable set by server
 */

/**
 * Get the CSP nonce from the client-side global variable
 * This can be used in Client Components to get the nonce for inline scripts/styles
 */
export function getClientNonce(): string | undefined {
  if (typeof window !== 'undefined') {
    return (window as any).__CSP_NONCE__;
  }
  return undefined;
}

/**
 * Create a script element with the CSP nonce
 * Use this for dynamically created inline scripts that need to comply with CSP
 */
export function createNonceScriptElement(scriptContent: string): HTMLScriptElement | null {
  if (typeof window === 'undefined') return null;
  
  const nonce = getClientNonce();
  const script = document.createElement('script');
  if (nonce) {
    script.setAttribute('nonce', nonce);
  }
  script.textContent = scriptContent;
  return script;
}

/**
 * Create a style element with the CSP nonce
 * Use this for dynamically created inline styles that need to comply with CSP
 */
export function createNonceStyleElement(styleContent: string): HTMLStyleElement | null {
  if (typeof window === 'undefined') return null;
  
  const nonce = getClientNonce();
  const style = document.createElement('style');
  if (nonce) {
    style.setAttribute('nonce', nonce);
  }
  style.textContent = styleContent;
  return style;
}
