# Content Security Policy (CSP) Implementation

## Overview
This Next.js application implements a nonce-based Content Security Policy following the official Next.js CSP guidance. The CSP is configured in the middleware to provide strong security against XSS attacks while maintaining compatibility with all application features.

## Implementation Details

### Files Modified
- `middleware.ts` - Main CSP implementation with nonce generation
- `app/lib/csp-nonce.ts` - Server-side nonce utilities
- `app/lib/client-nonce.ts` - Client-side nonce utilities  
- `app/layout.tsx` - Root layout with nonce integration

### CSP Directives Explained

| Directive | Value | Purpose |
|-----------|--------|---------|
| `default-src` | `'self'` | Default policy - only allow resources from same origin |
| `script-src` | `'self' 'nonce-{nonce}' 'strict-dynamic' https://accounts.google.com https://docs.opencv.org` | Allow scripts from self, with nonce, and from Google OAuth + OpenCV |
| `style-src` | `'self' 'nonce-{nonce}' 'unsafe-inline' https://fonts.googleapis.com` | Allow styles from self, with nonce, inline styles, and Google Fonts |
| `font-src` | `'self' https://fonts.gstatic.com` | Allow fonts from self and Google Fonts |
| `img-src` | `'self' data: blob: https://lh3.googleusercontent.com https://i.scdn.co {S3_URL}` | Allow images from self, data URIs, blobs, Google user content, Spotify, and S3 |
| `connect-src` | `'self' https://accounts.google.com https://docs.opencv.org {S3_URL}` | Allow connections to self, Google OAuth, OpenCV docs, and S3 |
| `frame-src` | `'self' https://accounts.google.com` | Allow frames from self and Google OAuth |
| `media-src` | `'self' data: blob: {S3_URL}` | Allow media from self, data URIs, blobs, and S3 |
| `worker-src` | `'self' blob:` | Allow workers from self and blob URLs |
| `object-src` | `'none'` | Block all object embeds |
| `base-uri` | `'self'` | Only allow base URIs from same origin |
| `form-action` | `'self'` | Only allow form submissions to same origin |
| `frame-ancestors` | `'none'` | Prevent embedding in frames (clickjacking protection) |
| `upgrade-insecure-requests` | - | Automatically upgrade HTTP to HTTPS |

### External Domains Allowed

**Google Services:**
- `accounts.google.com` - OAuth authentication
- `lh3.googleusercontent.com` - User profile images
- `fonts.googleapis.com` - Google Fonts CSS
- `fonts.gstatic.com` - Google Fonts files

**Development Tools:**
- `docs.opencv.org` - OpenCV.js library for computer vision features

**Media Services:**
- `i.scdn.co` - Spotify content (if used)
- AWS S3 bucket (dynamically configured from environment variables)

## Nonce Implementation

The CSP uses nonces (number used once) for inline scripts and styles:

1. **Middleware** generates a fresh nonce for each request
2. **Server Components** can access the nonce via `getNonce()` utility
3. **Client Components** can access the nonce via global variable `window.__CSP_NONCE__`

### Using Nonces in Code

**Server Components:**
```typescript
import { getNonce } from '@/app/lib/csp-nonce';

export default async function MyComponent() {
  const nonce = await getNonce();
  return (
    <script nonce={nonce} dangerouslySetInnerHTML={{
      __html: 'console.log("Safe inline script");'
    }} />
  );
}
```

**Client Components:**
```typescript
import { getClientNonce, createNonceScriptElement } from '@/app/lib/client-nonce';

export default function MyClientComponent() {
  const addInlineScript = () => {
    const script = createNonceScriptElement('console.log("Dynamic script");');
    if (script) {
      document.head.appendChild(script);
    }
  };
  // ...
}
```

## Environment Variables

The CSP automatically includes your S3 bucket URL if these environment variables are set:
- `AWS_BUCKET_NAME`
- `AWS_REGION`

## Testing CSP

1. **Browser Console**: Check for CSP violations in browser dev tools
2. **CSP Header**: Verify the header is present in network requests
3. **Nonce Values**: Ensure nonces are unique per request

## Maintenance

When adding new external services:
1. Update the `createCSP()` function in `middleware.ts`
2. Add the domain to the appropriate directive
3. Test thoroughly in development and staging
4. Document the change in this file

## Troubleshooting

**Common Issues:**
- **Inline scripts blocked**: Ensure nonce is properly applied
- **External resources blocked**: Add domain to appropriate CSP directive  
- **NextAuth errors**: Verify Google OAuth domains are included
- **Font loading issues**: Check Google Fonts domains are allowed

**Debug Mode:**
To debug CSP issues, temporarily add `'unsafe-inline'` to `script-src` and `style-src` directives, but remove before production.

## Security Notes

- Nonces are regenerated for each request for maximum security
- `'strict-dynamic'` allows dynamically loaded scripts if they're loaded by nonce-verified scripts
- `'unsafe-inline'` is included only for styles due to framework requirements
- All external domains are explicitly whitelisted and serve legitimate purposes
- Service worker is allowed from self and blob URLs for PWA functionality

This implementation follows Next.js best practices and provides strong XSS protection while maintaining full application functionality.
