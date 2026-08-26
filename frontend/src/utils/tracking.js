import { haversineDistance } from './geo';

const STATIONARY_RADIUS_METERS = 150; // 150 meters threshold for being "Stationary"

export function segmentWorkerHistory(points) {
  if (!points || points.length === 0) return [];

  const segments = [];
  let currentSegment = null;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    
    if (!currentSegment) {
      // Start the very first stationary segment
      currentSegment = {
        type: 'STATIONARY',
        id: `seg_${Date.now()}_${i}`,
        points: [pt],
        startTime: pt.timestamp,
        endTime: pt.timestamp,
        startLatitude: pt.latitude,
        startLongitude: pt.longitude,
        endLatitude: pt.latitude,
        endLongitude: pt.longitude
      };
      continue;
    }

    if (currentSegment.type === 'STATIONARY') {
      const dist = haversineDistance(
        currentSegment.startLatitude, 
        currentSegment.startLongitude, 
        pt.latitude, 
        pt.longitude
      );

      if (dist <= STATIONARY_RADIUS_METERS) {
        // Still stationary within the radius
        currentSegment.points.push(pt);
        currentSegment.endTime = pt.timestamp;
        currentSegment.endLatitude = pt.latitude;
        currentSegment.endLongitude = pt.longitude;
      } else {
        // Left the stationary radius. Finalize current segment.
        segments.push({ ...currentSegment });
        
        // Create a MOVING segment from the anchor to this new point
        const moveSegment = {
          type: 'MOVING',
          id: `seg_${Date.now()}_${i}_move`,
          points: [points[i - 1], pt], // from last point of stationary to this point
          startTime: points[i - 1].timestamp,
          endTime: pt.timestamp,
          startLatitude: points[i - 1].latitude,
          startLongitude: points[i - 1].longitude,
          endLatitude: pt.latitude,
          endLongitude: pt.longitude
        };
        segments.push(moveSegment);

        // Start a new STATIONARY segment at the new point
        currentSegment = {
          type: 'STATIONARY',
          id: `seg_${Date.now()}_${i}`,
          points: [pt],
          startTime: pt.timestamp,
          endTime: pt.timestamp,
          startLatitude: pt.latitude,
          startLongitude: pt.longitude,
          endLatitude: pt.latitude,
          endLongitude: pt.longitude
        };
      }
    }
  }

  // Push the final segment
  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

export function calculateTotalDistance(points) {
  if (!points || points.length < 2) return 0;
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    dist += haversineDistance(points[i-1].latitude, points[i-1].longitude, points[i].latitude, points[i].longitude);
  }
  return dist;
}
