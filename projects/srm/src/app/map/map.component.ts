import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MapboxService } from '../mapbox.service';

import * as mapboxgl from 'mapbox-gl';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { StateService } from '../state.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements OnInit, AfterViewInit {

  STYLE = 'mapbox://styles/srm-kolzchut/cksprr4sy0hbg18o5ct2ty2oc/draft';

  @ViewChild('map') mapEl: ElementRef;

  map: mapboxgl.Map;
  moveEvents = new Subject<mapboxgl.LngLatBounds>();
  
  OFFSETS = [[[0.0, 0.0]],
             [[0.0, -0.5], [0.0, 0.5]],
             [[0.0, -0.577], [0.5, 0.289], [-0.5, 0.289]], 
             [[0.0, -0.707], [0.707, -0.0], [0.0, 0.707], [-0.707, 0.0]], 
             [[0.0, -0.851], [0.809, -0.263], [0.5, 0.688], [-0.5, 0.688], [-0.809, -0.263]],
             [[0.0, -1.0], [0.866, -0.5], [0.866, 0.5], [0.0, 1.0], [-0.866, 0.5], [-0.866, -0.5]],
             [[0.0, 0.0], [0.0, -1.0], [0.866, -0.5], [0.866, 0.5], [0.0, 1.0], [-0.866, 0.5], [-0.866, -0.5]]];

  constructor(private mapboxService: MapboxService, private state: StateService) {
    this.moveEvents.pipe(
      debounceTime(1000),
    ).subscribe(bounds => {
      state.bounds = bounds;
    })
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    if (this.mapEl && this.mapEl.nativeElement && this.mapboxService.init) {
      try {
        this.map = new mapboxgl.Map({
          container: this.mapEl.nativeElement,
          style: this.STYLE,
          minZoom: 3,
        });
        this.map.on('moveend', (event: DragEvent) => {
          this.moveEvents.next(this.map?.getBounds());
        });
        this.state.bounds = this.map.getBounds();
      } catch {
        console.log('FAILED TO LOAD')
      }
      this.map.on('load', () => {
        console.log('LOADED');
        for (const layerName of ['points-on', 'points-stroke-on']) {
          const layer = this.map.getStyle().layers?.filter((l) => l.id === layerName)[0] as mapboxgl.CircleLayer;
          console.log(layer);
          for (const countList of this.OFFSETS) {
            const count = countList.length;
            for (const offsetIdx_ in countList) {
              const offsetIdx = parseInt(offsetIdx_);
              const offset = countList[offsetIdx];
              const radius = 17;
              const modifiedOffset = [offset[0] * radius, offset[1] * radius];
              const offsetLayerName = `${layerName}-${count}-${offsetIdx+1}`;
              const newLayer: any = {
                id: offsetLayerName, 
                type: layer.type,
                source: layer.source,
                'source-layer': layer['source-layer'],
                layout: layer.layout || {},
                paint: Object.assign(layer.paint, {'circle-translate': modifiedOffset}),
                filter: ['==', ['get', 'offset'], `${count}-${offsetIdx+1}`]
              };
              console.log(offsetLayerName, count, offsetIdx, offset, modifiedOffset);
              this.map.addLayer(newLayer, layerName);
            }
          }
          this.map.setLayoutProperty(layerName, 'visibility', 'none');
        }
        this.map.getStyle().layers?.filter((l) => l.id === 'labels-active' || l.id.indexOf('points-stroke-on-') === 0).forEach((layer) => {
          const layerName = layer.id;
          this.map.on('click', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
            if (e.features && e.features.length > 0) {
              const props: any = e.features[0].properties;
              const records = JSON.parse(props.records);
              console.log(`${layerName} clicked:`, props.offset, props.service_count, '#records', records.length);
              for (const record of records) {
                console.log(record);
              }
            }
          });
        });
      });
    }
  }

}
