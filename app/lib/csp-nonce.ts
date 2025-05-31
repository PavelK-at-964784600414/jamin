import { headers } from 'next/headers';

/**
 * Get the CSP nonce from the current request headers
 * This can be used in Server Components to get the nonce for inline scripts/styles
 */
export async function getNonce(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get('x-nonce') || undefined;
}

/**
 * Create a script tag with the CSP nonce
 * Use this for inline scripts that need to comply with CSP
 */
export async function createNonceScript(scriptContent: string): Promise<string> {
  const nonce = await getNonce();
  return `<script${nonce ? ` nonce="${nonce}"` : ''}>${scriptContent}</script>`;
}

/**
 * Create a style tag with the CSP nonce
 * Use this for inline styles that need to comply with CSP
 */
export async function createNonceStyle(styleContent: string): Promise<string> {
  const nonce = await getNonce();
  return `<style${nonce ? ` nonce="${nonce}"` : ''}>${styleContent}</style>`;
}
