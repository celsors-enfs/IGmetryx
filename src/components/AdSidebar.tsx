import { useEffect } from 'react';

export const AdSidebar = () => {
  useEffect(() => {
    const distributeAds = () => {
      const sourceContainer = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
      const leftContainer = document.getElementById('ad-container-left');
      const rightContainer = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
      
      if (!sourceContainer || !leftContainer || !rightContainer) return;
      
      // Get all ads from source container
      const allAds = Array.from(sourceContainer.children);
      
      if (allAds.length === 0) return;
      
      // Clear both containers first
      leftContainer.innerHTML = '';
      rightContainer.innerHTML = '';
      
      // Distribute: first 2 to left, next 2 to right
      const leftAds = allAds.slice(0, 2);
      const rightAds = allAds.slice(2, 4);
      
      // Clone and add to left container
      leftAds.forEach((ad) => {
        const clonedAd = ad.cloneNode(true) as HTMLElement;
        leftContainer.appendChild(clonedAd);
      });
      
      // Move remaining ads to right container (or keep original if less than 4)
      if (allAds.length >= 4) {
        rightAds.forEach((ad) => {
          rightContainer.appendChild(ad);
        });
        // Hide any ads beyond the first 4
        allAds.slice(4).forEach((ad) => {
          (ad as HTMLElement).style.display = 'none';
        });
      } else {
        // If less than 4 ads, put remaining in right container
        allAds.slice(2).forEach((ad) => {
          rightContainer.appendChild(ad);
        });
      }
      
      // Ensure both containers are visible
      leftContainer.style.setProperty('display', 'block', 'important');
      leftContainer.style.setProperty('visibility', 'visible', 'important');
      leftContainer.style.setProperty('opacity', '1', 'important');
      
      rightContainer.style.setProperty('display', 'block', 'important');
      rightContainer.style.setProperty('visibility', 'visible', 'important');
      rightContainer.style.setProperty('opacity', '1', 'important');
    };

    // Wait for ads to load, then distribute
    const checkAndDistribute = () => {
      const sourceContainer = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
      if (sourceContainer && sourceContainer.children.length > 0) {
        distributeAds();
      }
    };

    // Check multiple times as ads load
    setTimeout(checkAndDistribute, 1000);
    setTimeout(checkAndDistribute, 3000);
    setTimeout(checkAndDistribute, 5000);
    setTimeout(checkAndDistribute, 8000);

    // Watch for changes in source container
    const sourceContainer = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
    if (sourceContainer) {
      const observer = new MutationObserver(() => {
        checkAndDistribute();
      });
      observer.observe(sourceContainer, { childList: true, subtree: true });
      
      return () => observer.disconnect();
    }
  }, []);

  return null;
};

