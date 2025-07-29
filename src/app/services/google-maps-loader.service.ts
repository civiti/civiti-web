import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private platformId = inject(PLATFORM_ID);
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  loadGoogleMaps(): Promise<void> {
    // Only load in browser
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }
    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Check if API key is set
    if (!environment.googleMapsApiKey || 
        environment.googleMapsApiKey === 'YOUR_DEVELOPMENT_API_KEY' || 
        environment.googleMapsApiKey === 'YOUR_PRODUCTION_API_KEY' ||
        environment.googleMapsApiKey === 'VITE_GOOGLE_MAPS_API_KEY_PLACEHOLDER') {
      console.error('Google Maps API key is not configured. Please add your API key to src/environments/environment.ts');
      return Promise.reject(new Error('Google Maps API key not configured'));
    }

    this.loadPromise = new Promise<void>((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (typeof google !== 'undefined' && google.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = (error) => {
        reject(error);
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}