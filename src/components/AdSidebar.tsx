import { useEffect } from 'react';

export const AdSidebar = () => {
  useEffect(() => {
    // Ensure the ad container exists and is visible
    const container = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
    if (container) {
      container.style.display = 'block';
      container.style.visibility = 'visible';
      container.style.opacity = '1';
    }
  }, []);

  return null; // This component doesn't render anything, just ensures ads are visible
};

