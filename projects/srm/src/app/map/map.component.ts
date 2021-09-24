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

  STYLE = 'mapbox://styles/srm-kolzchut/cksprr4sy0hbg18o5ct2ty2oc';

  @ViewChild('map') mapEl: ElementRef;

  map: mapboxgl.Map;
  moveEvents = new Subject<mapboxgl.LngLatBounds>();
  
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
    }
  }

}
