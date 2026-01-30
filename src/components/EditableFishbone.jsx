/**
 * EditableFishbone Component (Backward Compatibility Wrapper)
 * This component wraps the new FishboneEditor for backward compatibility
 */

import React from 'react';
import FishboneEditor from './fishbone/FishboneEditor';
import { migrateFishboneData } from './fishbone/utils/migration';

const EditableFishbone = ({ fishbone = {}, onChange }) => {
  // Migrate old data structure if needed
  const migratedData = migrateFishboneData(fishbone);

  return <FishboneEditor fishbone={migratedData} onChange={onChange} />;
};

export default EditableFishbone;
