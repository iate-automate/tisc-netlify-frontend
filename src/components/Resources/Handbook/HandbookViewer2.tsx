import { useState, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Loader from '@/components/Elements/Loader/Loader';

import type { HandbookViewerProps } from '@/types/index.js';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import './HandbookViewer2.css';

interface HandbookPage {
  page: number;
  url: string;
  filename: string;
}

export default function HandbookViewer2({ className }: HandbookViewerProps) {
  const [pages, setPages] = useState<HandbookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await fetch('/api/resources/handbook/avif');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.pages) {
          setPages(data.pages);
        } else {
          throw new Error('Invalid response format');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching handbook pages:', error);
        setError('Failed to load handbook pages. Please refresh the page or contact support.');
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setCurrentIndex(pageIndex);
    }
  };

  const nextPage = () => goToPage(currentIndex + 1);
  const prevPage = () => goToPage(currentIndex - 1);

  const renderCustomControls = () => {
    const totalPages = pages.length;
    const currentPage = currentIndex + 1;
    
    return (
      <div className="handbook-controls">
        <div className="page-info">
          <span className="current-page">{currentPage}</span>
          <span className="page-separator"> / </span>
          <span className="total-pages">{totalPages}</span>
        </div>
        
        <div className="view-controls">
          <button 
            className="zoom-btn" 
            onClick={() => setLightboxOpen(true)}
            title="Open in fullscreen"
          >
            View Fullscreen
          </button>
        </div>
      </div>
    );
  };

  // Convert pages to lightbox slides
  const slides = pages.map(page => ({
    src: page.url,
    alt: `Handbook page ${page.page}`,
    width: 1200, // Approximate width for AVIF images
    height: 1600, // Approximate height for AVIF images
  }));

  if (loading) {
    return (
      <div className={`handbook-viewer2 ${className || ''}`}>
        <Loader 
          label="Loading handbook pages..."
          variant="block"
          height="800px"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`handbook-viewer2 ${className || ''}`}>
        <div className="handbook-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className={`handbook-viewer2 ${className || ''}`}>
        <div className="handbook-error">
          <p>No pages found in handbook.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`handbook-viewer2 ${className || ''}`}>
        <div className="handbook-container">
          {renderCustomControls()}
          
          <div className="handbook-content">
            <div className="handbook-main-view">
              <img
                src={pages[currentIndex].url}
                alt={`Handbook page ${currentIndex + 1}`}
                className="handbook-page-image"
                onClick={() => setLightboxOpen(true)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            
            <div className="handbook-thumbnails">
              <div className="thumbnail-container">
                {pages.map((page, index) => (
                  <div
                    key={page.page}
                    className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    <img
                      src={page.url}
                      alt={`Page ${page.page}`}
                      loading="lazy"
                      decoding="async"
                      className="thumbnail-image"
                    />
                    <span className="thumbnail-number">{page.page}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={currentIndex}
        slides={slides}
        plugins={[Thumbnails, Zoom, Fullscreen, Counter]}
        on={{
          view: ({ index }) => setCurrentIndex(index),
        }}
        thumbnails={{
          position: 'bottom',
          width: 120,
          height: 80,
          border: 0,
          borderRadius: 4,
          padding: 4,
          gap: 16,
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          doubleClickMaxStops: 2,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          scrollToZoom: true,
        }}
        counter={{
          container: { style: { top: 'unset', bottom: 0 } },
        }}
      />
    </>
  );
}