import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/types';
import { initSegment } from '../utilities/segmentIOUtils';
import { useWatchSegmentKey } from './useWatchSegmentKey';
import { useWatchDashboardConfig } from './useWatchDashboardConfig';

export const useSegmentTracking = (): void => {
  const { segmentKey, loaded, loadError } = useWatchSegmentKey();
  const { results } = useWatchDashboardConfig();
  const username = useSelector((state: RootState) => state.appState.user);
  const clusterID = useSelector((state: RootState) => state.appState.clusterID);

  React.useEffect(() => {
    if (segmentKey && loaded && !loadError && username && clusterID) {
      window.clusterID = clusterID;
      if (results) initSegment({ segmentKey, username, enabled: !results.disableTracking });
    }
  }, [clusterID, loadError, loaded, segmentKey, username, results]);
};