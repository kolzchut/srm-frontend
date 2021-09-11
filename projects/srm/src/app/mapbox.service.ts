import * as mapboxgl from 'mapbox-gl';

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapboxService {

  ACCESS_TOKEN = 'pk.eyJ1Ijoic3JtLWtvbHpjaHV0IiwiYSI6ImNrcnhza3c5ZjBhd3Eydm1za3BvNjNxbzUifQ.dTyD9BD5jAsxZ2nUzSo-yw';

  constructor() {
    (mapboxgl as any).accessToken = this.ACCESS_TOKEN;
    mapboxgl.setRTLTextPlugin(
      'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
      (error) => {
        console.log('FAILED TO LOAD PLUGIN', error);
      },
      true // Lazy load the plugin
    );
  }
}
