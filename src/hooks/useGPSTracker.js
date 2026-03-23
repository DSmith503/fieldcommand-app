import { useEffect, useRef } from 'react';
import { api } from '../utils/api';

export function useGPSTracker(isClockedIn) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isClockedIn || !navigator.geolocation) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    function sendLocation() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api('/location', {
            method: 'POST',
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    sendLocation();
    intervalRef.current = setInterval(sendLocation, 120000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      api('/location/stop', { method: 'POST' }).catch(() => {});
    };
  }, [isClockedIn]);
}
