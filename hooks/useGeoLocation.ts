import { useState } from 'react';
import { findClosestMatch } from '../utils/fuzzyMatcher';

interface LocationResult {
  detectedRawAddress: string | null;
  matchedDbStreet: string | null;
  found: boolean;
}

interface NominatimResponse {
  address?: {
    road?: string;
    street?: string;
    residential?: string;
    living_street?: string;
    pedestrian?: string;
    highway?: string;
    suburb?: string;
    village?: string;
    town?: string;
  };
}

export const useGeoLocation = () => {
  const [loading, setLoading] = useState(false);

  const getStreetName = (address: NominatimResponse['address']) => {
    if (!address) return '';
    return address.road || 
           address.street || 
           address.residential || 
           address.living_street ||
           address.pedestrian || 
           address.highway || 
           address.suburb || 
           address.village || 
           address.town || 
           '';
  };

  const detectLocation = async (availableStreets: string[]): Promise<LocationResult> => {
    setLoading(true);
    
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLoading(false);
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            let response;
            try {
              response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                  headers: {
                    'User-Agent': 'EParkirMadiun/1.0'
                  }
                }
              );
            } catch (networkErr) {
              throw new Error("Gagal terhubung ke layanan peta. Periksa koneksi internet anda.");
            }

            if (!response.ok) {
              throw new Error(`Nominatim API Error: ${response.status}`);
            }

            const data: NominatimResponse = await response.json();

            if (!data.address) {
               throw new Error("Respons API tidak memiliki data alamat.");
            }

            const rawStreetName = getStreetName(data.address);

            if (!rawStreetName) {
              setLoading(false);
              throw new Error("Jalan tidak terdaftar di peta GPS.");
            }

            const matchedDbStreet = findClosestMatch(rawStreetName, availableStreets || []);
            
            setLoading(false);
            resolve({
              detectedRawAddress: rawStreetName,
              matchedDbStreet: matchedDbStreet,
              found: !!matchedDbStreet
            });

          } catch (error: any) {
            console.error("GeoLocation Error:", error);
            setLoading(false);
            reject(error);
          }
        },
        (error) => {
          setLoading(false);
          let msg = "Gagal mendeteksi lokasi.";
          if (error.code === error.PERMISSION_DENIED) msg = "Izin lokasi ditolak via browser.";
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  return { detectLocation, loading };
};