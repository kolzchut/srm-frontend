import * as mapboxgl from 'mapbox-gl';

import { Injectable } from '@angular/core';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class MapboxService {

  ACCESS_TOKEN = 'pk.eyJ1Ijoic3JtLWtvbHpjaHV0IiwiYSI6ImNrcnhza3c5ZjBhd3Eydm1za3BvNjNxbzUifQ.dTyD9BD5jAsxZ2nUzSo-yw';
  public init = false;

  constructor(private platform: PlatformService) {
    this.platform.browser(() => {
      this.init = true;
      (mapboxgl as any).accessToken = this.ACCESS_TOKEN;
      mapboxgl.setRTLTextPlugin(
        'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
        (error) => {
          console.log('FAILED TO LOAD PLUGIN', error);
        },
        true // Lazy load the plugin
      );
    });
  }
}
