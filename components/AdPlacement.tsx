
import React from 'react';
import type { Ad, AdPlacement as AdPlacementType } from '../types';

interface AdPlacementProps {
  ads: Ad[];
  placement: AdPlacementType;
  isEnabled: boolean;
}

const AdPlacement: React.FC<AdPlacementProps> = ({ ads, placement, isEnabled }) => {
  if (!isEnabled) {
    return null;
  }

  const adToShow = ads.find(ad => ad.placement === placement && ad.status === 'active');

  if (!adToShow) {
    return null;
  }

  return (
    // Global Alignment: Matches ContentCarousel padding exactly (px-4 md:px-8)
    // COMPACT LAYOUT UPDATE: Reduced my-8 (32px) to my-4 (16px)
    <div 
      className="my-4 px-4 md:px-8"
      dangerouslySetInnerHTML={{ __html: adToShow.code }}
    />
  );
};

export default AdPlacement;
