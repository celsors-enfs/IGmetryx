import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const AnchorScroll = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    // Wait for next paint to ensure DOM is ready
    const scrollToAnchor = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const elementId = hash.substring(1); // Remove the #
          const element = document.getElementById(elementId);
          
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        });
      });
    };

    // Small delay to ensure content is mounted
    const timeoutId = setTimeout(scrollToAnchor, 100);
    
    return () => clearTimeout(timeoutId);
  }, [hash]);

  return null;
};






