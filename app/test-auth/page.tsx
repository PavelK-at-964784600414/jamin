'use client';

import { useState, useEffect, useRef } from 'react';

export default function TestAuthPage() {
  const [testResult, setTestResult] = useState<{success?: boolean, error?: string}>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // File upload test
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const testAuth = async () => {
      try {
        // Test the auth module import first
        const response = await fetch('/api/test-auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = await response.json();
        setTestResult(result);
      } catch (error) {
        console.error('Auth test failed:', error);
        setTestResult({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      } finally {
        setIsLoading(false);
      }
    };

    testAuth();
  }, []);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null); // Clear previous results
    }
  };
  
  // Test file upload with our API
  const testFileUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setUploadResult(null);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      
      // Try to create a Safari-compatible file first
      try {
        // Read the file contents using FileReader (more Safari-friendly)
        const fileContents = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => event.target?.result ? resolve(event.target.result as ArrayBuffer) : reject('No result');
          reader.onerror = () => reject('File read error');
          reader.readAsArrayBuffer(file);
        });
        
        // Create a new file object from scratch to ensure Safari compatibility
        const blob = new Blob([fileContents], { type: file.type || 'audio/webm' });
        const safeFile = new File([blob], file.name || `test-${Date.now()}.webm`, {
          type: file.type || 'audio/webm',
          lastModified: Date.now()
        });
        
        formData.append('file', safeFile);
        console.log('Using Safari-compatible file for upload test');
      } catch (error) {
        // Fallback to using the original file
        console.error('Error creating safe file:', error);
        formData.append('file', file);
        console.log('Using original file for upload test');
      }
      
      // Send the file to our test API
      const response = await fetch('/api/test-auth', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setUploadResult(result);
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setUploading(false);
    }
  };
  
  const [s3TestResult, setS3TestResult] = useState<any>(null);
  const [testingS3, setTestingS3] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const [testingFix, setTestingFix] = useState(false);
  
  // Test AWS S3 connectivity
  const testS3Connection = async () => {
    setTestingS3(true);
    setS3TestResult(null);
    
    try {
      const response = await fetch('/api/test-s3');
      const result = await response.json();
      setS3TestResult(result);
    } catch (error) {
      setS3TestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setTestingS3(false);
    }
  };
  
  // Validate AWS S3 credential format and connection
  const validateS3Credentials = async () => {
    setValidating(true);
    setValidationResult(null);
    
    try {
      const response = await fetch('/api/test-s3-validation');
      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setValidating(false);
    }
  };
  
  // Test our specific comment removal fix
  const testCredentialFix = async () => {
    setTestingFix(true);
    setFixResult(null);
    
    try {
      const response = await fetch('/api/test-s3-fix');
      const result = await response.json();
      setFixResult(result);
    } catch (error) {
      setFixResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setTestingFix(false);
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      {/* Authentication test section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Authentication Test</h2>
        {isLoading ? (
          <div className="p-4 bg-blue-100 text-blue-800 rounded">
            Testing authentication...
          </div>
        ) : (
          <div className={`p-4 rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <h2 className="font-bold text-lg mb-2">
              {testResult.success ? 'Authentication Working!' : 'Authentication Failed'}
            </h2>
            
            {testResult.error && (
              <div className="mt-2">
                <p className="font-semibold">Error:</p>
                <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto">
                  {testResult.error}
                </pre>
              </div>
            )}
            
            {testResult.success && (
              <p>The authentication system is working correctly.</p>
            )}
          </div>
        )}
      </div>
      
      {/* AWS S3 credential test section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">AWS S3 Credentials Test</h2>
        <div className="p-4 bg-gray-100 rounded">
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={testS3Connection}
              disabled={testingS3}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {testingS3 ? 'Testing S3 Connection...' : 'Test AWS S3 Credentials'}
            </button>
            
            <button
              onClick={validateS3Credentials}
              disabled={validating}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
              {validating ? 'Validating Credentials...' : 'Validate Key Format'}
            </button>
            
            <button
              onClick={testCredentialFix}
              disabled={testingFix}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {testingFix ? 'Testing Fix...' : 'Test Comment Removal Fix'}
            </button>
          </div>
          
          {fixResult && (
            <div className={`mt-4 p-4 rounded ${fixResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-bold">{fixResult.success ? 'Comment Removal Fix Worked!' : 'Comment Removal Fix Failed'}</h3>
              <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto text-xs">
                {JSON.stringify(fixResult, null, 2)}
              </pre>
            </div>
          )}
          
          {validationResult && (
            <div className={`mt-4 p-4 rounded ${validationResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-bold">{validationResult.success ? 'Credentials Format Valid!' : 'Credentials Format Issue'}</h3>
              <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto text-xs">
                {JSON.stringify(validationResult, null, 2)}
              </pre>
            </div>
          )}
          
          {s3TestResult && (
            <div className={`mt-4 p-4 rounded ${s3TestResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-bold">{s3TestResult.success ? 'S3 Credentials Working!' : 'S3 Credentials Failed'}</h3>
              <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto text-xs">
                {JSON.stringify(s3TestResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      {/* File upload test section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">File Upload Test</h2>
        <div className="p-4 bg-gray-100 rounded">
          <div className="mb-4">
            <input 
              type="file" 
              accept="audio/*,video/*" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          
          {file && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">Selected file: <span className="font-medium">{file.name}</span> ({Math.round(file.size / 1024)} KB)</p>
              <p className="text-sm text-gray-600">Type: {file.type || 'Unknown'}</p>
              
              <button
                onClick={testFileUpload}
                disabled={uploading}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {uploading ? 'Testing upload...' : 'Test File Upload'}
              </button>
            </div>
          )}
          
          {uploadResult && (
            <div className={`mt-4 p-4 rounded ${uploadResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-bold">{uploadResult.success ? 'Upload Test Results' : 'Upload Test Failed'}</h3>
              <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto text-xs">
                {JSON.stringify(uploadResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
