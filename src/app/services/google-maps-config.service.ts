import { Injectable } from '@angular/core';
import { googleMapsConfig } from '../../environments/google-maps-config';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsConfigService {
  // Store the initial API key
  private apiKey: string = googleMapsConfig.apiKey;
  private loadingPromise: Promise<void> | null = null;

  getApiKey(): string {
    return this.apiKey;
  }

  loadGoogleMapsScript(): Promise<void> {
    // Return existing promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Check if already loaded
    if (typeof google !== 'undefined' && google.maps) {
      return Promise.resolve();
    }

    // Create the loading promise
    this.loadingPromise = new Promise((resolve, reject) => {
      let keyToUse = this.apiKey;

      if (!keyToUse || keyToUse === 'YOUR_DEVELOPMENT_API_KEY') {
        // Try meta tag as fallback
        const metaTag = document.querySelector('meta[name="google-maps-api-key"]');
        const metaApiKey = metaTag?.getAttribute('content') || '';
        
        if (!metaApiKey || metaApiKey === 'YOUR_DEVELOPMENT_API_KEY') {
          reject(new Error('Google Maps API key not configured'));
          return;
        }
        
        // Update the stored API key
        keyToUse = metaApiKey;
        this.apiKey = metaApiKey;
      }

      // Add authentication failure handler
      (window as any).gm_authFailure = () => {
        console.error('Google Maps authentication failed. Please check your API key and restrictions.');
        reject(new Error('Google Maps authentication failed'));
      };

      this.loadScript(keyToUse, resolve, reject);
    });

    return this.loadingPromise;
  }

  private loadScript(apiKey: string, resolve: () => void, reject: (error: Error) => void): void {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // Script tag exists, wait for it to load
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
      } else {
        // Wait for existing script to load
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      this.loadingPromise = null; // Reset on error
      reject(new Error('Failed to load Google Maps'));
    };

    document.head.appendChild(script);
  }
}