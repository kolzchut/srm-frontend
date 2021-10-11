import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MapboxService } from '../mapbox.service';

import * as mapboxgl from 'mapbox-gl';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { StateService } from '../state.service';
import { ALL_CATEGORIES } from '../common/consts';
import { DomSanitizer } from '@angular/platform-browser';
import { Card } from '../common/datatypes';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements OnInit, AfterViewInit {

  STYLE = 'mapbox://styles/srm-kolzchut/cksprr4sy0hbg18o5ct2ty2oc/draft';

  @Output('points') points = new EventEmitter<Card[]>();
  @Output('map') newMap = new EventEmitter<mapboxgl.Map>();
  @ViewChild('map') mapEl: ElementRef;

  map: mapboxgl.Map;
  moveEvents = new Subject<mapboxgl.LngLatBounds>();
  
  OFFSETS = [
    [[0.0, 0.0]],
    [[0.0, -0.5], [0.0, 0.5]],
    [[0.0, -0.577], [0.5, 0.289], [-0.5, 0.289]], 
    [[0.0, -0.707], [0.707, -0.0], [0.0, 0.707], [-0.707, 0.0]], 
    // [[0.0, -0.851], [0.809, -0.263], [0.5, 0.688], [-0.5, 0.688], [-0.809, -0.263]],
    // [[0.0, -1.0], [0.866, -0.5], [0.866, 0.5], [0.0, 1.0], [-0.866, 0.5], [-0.866, -0.5]],
    // [[0.0, 0.0], [0.0, -1.0], [0.866, -0.5], [0.866, 0.5], [0.0, 1.0], [-0.866, 0.5], [-0.866, -0.5]]
];
  ALL_CATEGORIES = ALL_CATEGORIES; 

  constructor(private mapboxService: MapboxService, private state: StateService, private sanitizer: DomSanitizer) {
    this.moveEvents.pipe(
      debounceTime(1000),
    ).subscribe(bounds => {
      state.bounds = bounds;
    })
  }

  ngOnInit(): void {
  }

  tooltipImg(color: string) {
    const svg = `<svg width="82" height="24" viewBox="0 0 82 24" fill="blue" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 4C0 1.79086 1.79086 0 4 0H78C80.2091 0 82 1.79086 82 4V20C82 22.2091 80.2091 24 78 24H4C1.79086 24 0 22.2091 0 20V4Z" fill="${color}"/>
    </svg>`;
    return this.sanitizer.bypassSecurityTrustUrl('data:image/svg+xml;base64,' + btoa(svg));
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
          console.log('MOVED', this.map?.getBounds())
          this.moveEvents.next(this.map?.getBounds());
        });
        this.map.on('styleimagemissing', (e) => {
          const id = e.id;
          const el = document.getElementById(id) as HTMLImageElement;
          this.map.addImage(id, el);
        });
        this.map.on('load', () => {
          for (const layerName of ['points-on', 'points-stroke-on']) {
            const layer = this.map.getStyle().layers?.filter((l) => l.id === layerName)[0] as mapboxgl.CircleLayer;
            for (const countList of this.OFFSETS) {
              const count = countList.length;
              for (const offsetIdx_ in countList) {
                const offsetIdx = parseInt(offsetIdx_);
                const offset = countList[offsetIdx];
                const radius = 6;
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
                console.log('SS', newLayer.source, newLayer['source-layer']);
                this.map.addLayer(newLayer, layerName);
              }
            }
            this.map.setLayoutProperty(layerName, 'visibility', 'none');
          }
          this.map.getStyle().layers?.filter((l) => l.id.indexOf('points-stroke-on-') === 0).forEach((layer) => {
            const layerName = layer.id;
            this.map.on('click', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
              if (e.features && e.features.length > 0) {
                const props: any = e.features[0].properties;
                console.log('SELECTED', props);
                const records = JSON.parse(props.records) as Card[];
                this.points.next(records);
              }
            });
          });
        });
        this.newMap.next(this.map);
        this.state.bounds = this.map.getBounds();
      } catch {
        console.log('FAILED TO LOAD')
      }
    }
  }

}
