/**
 * FishboneDiagram Component (Backward Compatibility Wrapper)
 * This component wraps the new FishboneContainer for backward compatibility
 */

import React from 'react';
import FishboneContainer from './fishbone/FishboneContainer';
import { migrateFishboneData } from './fishbone/utils/migration';

const FishboneDiagram = ({ fishbone = {} }) => {
  // Migrate old data structure if needed
  const migratedData = migrateFishboneData(fishbone);

  return <FishboneContainer fishbone={migratedData} readOnly={true} />;
};

export default FishboneDiagram;
