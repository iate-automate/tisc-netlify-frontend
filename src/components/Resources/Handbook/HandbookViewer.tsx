import React, { useState, useEffect } from 'react';
import './HandbookViewer.css';
import Loader from '@/components/Elements/Loader/Loader';
import type { HandbookViewerProps } from '@/types/index.js';

export default function HandbookViewer({ className }: HandbookViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIframeLoading, setIsIframeLoading] = useState(false);

  useEffect(() => {
    const fetchPdfUrl = async () => {
      try {
        console.log('Fetching PDF URL from /api/resources/handbook/pdf...');
        const response = await fetch('/api/resources/handbook/pdf');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received PDF URL:', data.url);
        setPdfUrl(data.url);
        setIsIframeLoading(true);
      } catch (error) {
        console.error('Error fetching PDF URL:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    fetchPdfUrl();
  }, []);

  const handleIframeLoad = () => {
    console.log('PDF iframe loaded successfully');
    setIsIframeLoading(false);
    setIsLoading(false);
  };

  const handleIframeError = () => {
    console.error('PDF iframe failed to load');
    setHasError(true);
    setIsLoading(false);
    setIsIframeLoading(false);
  };

  return (
    <div className={`handbook-viewer ${className || ''}`}>
      <div className="handbook-container">
        {/* Show loader while fetching PDF URL or loading iframe */}
        {(isLoading || isIframeLoading) && (
          <Loader 
            label={isLoading ? "Loading handbook..." : "Preparing PDF viewer..."}
            variant="block"
            height="800px"
            className="handbook-loader"
          />
        )}
        
        {/* Show error message */}
        {hasError && (
          <div className="handbook-error">
            <p>Failed to load handbook. Please refresh the page or contact support.</p>
          </div>
        )}
        
        {/* Show PDF iframe when ready */}
        {pdfUrl && !hasError && (
          <iframe 
            src={`${pdfUrl}#view=FitV&toolbar=1&navpanes=1&scrollbar=1&pagemode=bookmarks`}
            width="100%" 
            height="800px"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="TISUK Student Handbook"
            style={{ 
              display: (isLoading || isIframeLoading) ? 'none' : 'block'
            }}
          />
        )}
      </div>
    </div>
  );
}
