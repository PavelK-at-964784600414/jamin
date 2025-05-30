// OpenCV.js utility for loading and managing OpenCV instances
let openCVPromise: Promise<any> | null = null;
let isOpenCVLoaded = false;

// Use local OpenCV.js file from public directory
const OPENCV_LOCAL_PATH = '/opencv.js';

export const loadOpenCV = (): Promise<any> => {
  // Return existing promise if already loading
  if (openCVPromise) {
    return openCVPromise;
  }

  // Return resolved promise if already loaded
  if (typeof window !== 'undefined' && (window as any).cv && (window as any).cv.Mat) {
    isOpenCVLoaded = true;
    return Promise.resolve((window as any).cv);
  }

  // Create new loading promise
  openCVPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="opencv.js"]');
    if (existingScript) {
      // Wait for existing script to load
      const checkOpenCV = () => {
        if (typeof window !== 'undefined' && (window as any).cv && (window as any).cv.Mat) {
          isOpenCVLoaded = true;
          resolve((window as any).cv);
        } else {
          setTimeout(checkOpenCV, 100);
        }
      };
      checkOpenCV();
      return;
    }

    console.log(`Loading OpenCV from local file: ${OPENCV_LOCAL_PATH}`);
    
    // Clean up any existing OpenCV modules to prevent "IntVector" conflicts
    if (typeof window !== 'undefined') {
      delete (window as any).cv;
      delete (window as any).Module;
    }
    
    const script = document.createElement('script');
    script.src = OPENCV_LOCAL_PATH;
    script.async = true;
    script.id = 'opencv-local-script';
    
    const timeout = setTimeout(() => {
      console.warn(`Timeout loading OpenCV from: ${OPENCV_LOCAL_PATH}`);
      script.remove();
      openCVPromise = null;
      reject(new Error('Failed to load OpenCV.js - timeout'));
    }, 15000); // 15 second timeout
    
    script.onload = () => {
      clearTimeout(timeout);
      console.log(`OpenCV script loaded from: ${OPENCV_LOCAL_PATH}`);
      
      // Set up the onRuntimeInitialized callback
      if (typeof window !== 'undefined') {
        (window as any).Module = {
          onRuntimeInitialized: () => {
            console.log('OpenCV runtime initialized');
            isOpenCVLoaded = true;
            resolve((window as any).cv);
          }
        };
        
        // Fallback check in case onRuntimeInitialized doesn't fire
        const checkOpenCV = () => {
          if ((window as any).cv && (window as any).cv.Mat) {
            console.log('OpenCV is ready (fallback check)');
            isOpenCVLoaded = true;
            resolve((window as any).cv);
          } else {
            setTimeout(checkOpenCV, 200);
          }
        };
        setTimeout(checkOpenCV, 2000);
      }
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      console.error(`Failed to load OpenCV from: ${OPENCV_LOCAL_PATH}`);
      script.remove();
      openCVPromise = null;
      reject(new Error('Failed to load OpenCV.js - network error'));
    };
    
    document.head.appendChild(script);
  });

  return openCVPromise;
};

export const isOpenCVReady = (): boolean => {
  return isOpenCVLoaded && typeof window !== 'undefined' && (window as any).cv && (window as any).cv.Mat;
};

export const getOpenCV = (): any => {
  if (isOpenCVReady()) {
    return (window as any).cv;
  }
  throw new Error('OpenCV is not loaded yet');
};
