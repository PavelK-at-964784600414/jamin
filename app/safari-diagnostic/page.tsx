import { getNonce } from '@/app/lib/csp-nonce';
import Script from 'next/script';

export default async function SafariDiagnosticPage() {
  const nonce = await getNonce();

  return (
    <html lang="en">
      <head>
        <title>Safari Production Mode Diagnostic Tool</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style nonce={nonce}>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
          }
          
          .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          h1 {
            color: #1a1a1a;
            border-bottom: 3px solid #007AFF;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          
          h2 {
            color: #333;
            margin-top: 30px;
            margin-bottom: 15px;
          }
          
          h3 {
            color: #555;
            margin-top: 25px;
            margin-bottom: 10px;
          }
          
          .button-group {
            display: flex;
            gap: 15px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          
          button {
            background: #007AFF;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          
          button:hover {
            background: #0056CC;
          }
          
          button.danger {
            background: #FF3B30;
          }
          
          button.danger:hover {
            background: #D70015;
          }
          
          button.warning {
            background: #FF9500;
          }
          
          button.warning:hover {
            background: #CC7700;
          }
          
          .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: 500;
            display: none;
          }
          
          .status.info {
            background: #E3F2FD;
            color: #1976D2;
            border: 1px solid #BBDEFB;
          }
          
          .status.success {
            background: #E8F5E8;
            color: #2E7D32;
            border: 1px solid #A5D6A7;
          }
          
          .status.error {
            background: #FFEBEE;
            color: #C62828;
            border: 1px solid #FFCDD2;
          }
          
          .result-section {
            background: #F8F9FA;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #007AFF;
          }
          
          .result-section h4 {
            margin: 0 0 15px 0;
            color: #333;
          }
          
          .sw-item, .cache-item {
            background: white;
            padding: 12px;
            border-radius: 6px;
            margin: 8px 0;
            border: 1px solid #E0E0E0;
          }
          
          .recommendation {
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .recommendation.error {
            background: #FFEBEE;
            color: #C62828;
            border: 1px solid #FFCDD2;
          }
          
          .recommendation.warning {
            background: #FFF3E0;
            color: #E65100;
            border: 1px solid #FFCC02;
          }
          
          .recommendation.success {
            background: #E8F5E8;
            color: #2E7D32;
            border: 1px solid #A5D6A7;
          }
          
          ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          
          li {
            margin: 5px 0;
          }
          
          small {
            color: #666;
            font-size: 12px;
          }
          
          .console-info {
            background: #F5F5F5;
            border: 1px solid #DDD;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
          }
          
          @media (max-width: 600px) {
            .button-group {
              flex-direction: column;
            }
            
            button {
              width: 100%;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>🔍 Safari Production Mode Diagnostic Tool</h1>
          
          <div className="console-info">
            <strong>📝 Note:</strong> Check your browser&apos;s Developer Console (F12) for detailed diagnostic logs.
          </div>

          <h2>🚀 Quick Actions</h2>
          <div className="button-group">
            <button id="run-diagnostic">🔍 Run Diagnostic</button>
            <button id="full-reset" className="danger">🔄 Full Reset (Recommended)</button>
            <button id="clear-sw" className="warning">🧹 Clear Service Workers</button>
            <button id="clear-caches" className="warning">💾 Clear Caches</button>
          </div>

          <div id="status-message" className="status"></div>

          <div id="recommendations"></div>

          <div id="diagnostic-results">
            <p>Click &quot;Run Diagnostic&quot; to analyze your Safari environment...</p>
          </div>

          <h2>📋 Manual Steps (If Needed)</h2>
          <div className="result-section">
            <h4>Safari Developer Tools Method:</h4>
            <ol>
              <li>Open Safari Developer Tools (Develop menu → Show Web Inspector)</li>
              <li>Go to Develop → Service Workers</li>
              <li>Find any workers for localhost:3000</li>
              <li>Click &quot;Unregister&quot; on each one</li>
              <li>Go to Develop → Empty Caches</li>
              <li>Reload this page</li>
            </ol>
          </div>

          <div className="result-section">
            <h4>Safari Preferences Method:</h4>
            <ol>
              <li>Open Safari Preferences (⌘,)</li>
              <li>Go to Privacy tab</li>
              <li>Click &quot;Manage Website Data...&quot;</li>
              <li>Search for &quot;localhost&quot;</li>
              <li>Remove all localhost entries</li>
              <li>Restart Safari</li>
            </ol>
          </div>

          <h2>ℹ️ About This Tool</h2>
          <p>
            This diagnostic tool helps identify and fix Safari-specific issues in production mode, 
            particularly cached Service Workers that can cause &quot;FetchEvent.respondWith&quot; errors 
            and prevent JavaScript from loading properly.
          </p>
          
          <p>
            <strong>Common Safari Issues:</strong>
          </p>
          <ul>
            <li>Cached Service Workers from HTTPS development sessions</li>
            <li>Outdated cache entries interfering with HTTP production mode</li>
            <li>SSL certificate conflicts in localhost environment</li>
          </ul>
        </div>

        <Script 
          src="/safari-diagnostic.js" 
          nonce={nonce}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
