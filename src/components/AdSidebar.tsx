import { useEffect } from 'react';

export const AdSidebar = () => {
  useEffect(() => {
    // Ensure both ad containers exist and are visible
    const rightContainer = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
    const leftContainer = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9-left');
    
    if (rightContainer) {
      rightContainer.style.display = 'block';
      rightContainer.style.visibility = 'visible';
      rightContainer.style.opacity = '1';
    }
    
    if (leftContainer) {
      leftContainer.style.display = 'block';
      leftContainer.style.visibility = 'visible';
      leftContainer.style.opacity = '1';
    }

    // Copy ads from right container to left container (limit to 2 each)
    const copyAdsToLeft = () => {
      if (!rightContainer || !leftContainer) return;
      
      const ads = Array.from(rightContainer.children);
      if (ads.length === 0) return;
      
      // Clear left container first
      leftContainer.innerHTML = '';
      
      // Copy first 2 ads to left container
      ads.slice(0, 2).forEach((ad) => {
        const clonedAd = ad.cloneNode(true) as HTMLElement;
        leftContainer.appendChild(clonedAd);
      });
      
      // Keep only first 2 ads in right container
      ads.slice(2).forEach((ad) => {
        (ad as HTMLElement).style.display = 'none';
      });
    };

    // Wait for ads to load, then copy
    const observer = new MutationObserver(() => {
      copyAdsToLeft();
    });

    if (rightContainer) {
      observer.observe(rightContainer, { childList: true, subtree: true });
    }

    // Initial copy attempt after a delay
    setTimeout(copyAdsToLeft, 2000);
    setTimeout(copyAdsToLeft, 5000);

    return () => {
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything, just ensures ads are visible
};

