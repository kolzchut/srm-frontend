import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { MapboxService } from '../mapbox.service';

import { from, Observable, ReplaySubject, Subject, timer } from 'rxjs';
import { throttleTime, filter, distinctUntilChanged, switchMap, debounceTime, first, delay, tap, map } from 'rxjs/operators';
import { StateService, CenterZoomType, GeoType, BoundsType } from '../state.service';
import { ALL_CATEGORIES, CATEGORY_COLORS } from '../colors';
import { Card, Point as SRMPoint, SearchParams } from '../consts';
import { environment } from '../../environments/environment';
import { PlatformService } from '../platform.service';
import { LayoutService } from '../layout.service';

import * as mapboxgl from 'mapbox-gl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';
// declare var mapboxgl: any;

type MoveQueueItem = {
  action: (map: mapboxgl.Map) => void,
  description: string
};

const LAYER_LABELS_ACTIVE = 'labels-active';
const LAYER_POINTS_ACTIVE = 'points-active';
const LAYER_POINTS_STROKE_ACTIVE = 'points-stroke-active';

const LAYER_POINTS_ON_CENTER = 'points-on';
const LAYER_POINTS_STROKE_ON = 'points-stroke-on';

const LAYER_POINTS_OFF = 'points-off';
const LAYER_LABELS_OFF = 'labels-off';

const LAYER_POINTS_INACCURATE_ACTIVE = 'points-blur-on-active';
const LAYER_CLUSTERS_INACCURATE_ACTIVE = 'cluster-blur-active';
const LAYER_POINTS_INACCURATE_ON = 'points-blur-on';
const LAYER_POINTS_INACCURATE_OUT = 'points-blur-out';
const LAYER_CLUSTERS_INACCURATE_ON = 'cluster-blur';
const LAYER_LABELS_OFF_INACCURATE = 'labels-off-inaccurate';

const LAYERS_ACCURATE_SOURCE = [
  LAYER_POINTS_ON_CENTER,
  LAYER_POINTS_STROKE_ON,
  LAYER_POINTS_OFF,
  LAYER_LABELS_OFF,
];
const LAYERS_INACCURATE_SOURCE = [
  LAYER_POINTS_INACCURATE_ON,
  LAYER_POINTS_INACCURATE_OUT,
  LAYER_CLUSTERS_INACCURATE_ON,
  LAYER_LABELS_OFF_INACCURATE
];
const LAYERS_ACTIVE = [
  LAYER_LABELS_ACTIVE,
  LAYER_POINTS_ACTIVE,
  LAYER_POINTS_STROKE_ACTIVE,
  LAYER_POINTS_INACCURATE_ACTIVE,
  LAYER_CLUSTERS_INACCURATE_ACTIVE,
];
const LAYERS_CLICKABLE = [
  LAYER_POINTS_ON_CENTER,
  LAYER_POINTS_STROKE_ON,
  LAYER_POINTS_INACCURATE_ON,
  LAYER_POINTS_INACCURATE_OUT,
  LAYER_CLUSTERS_INACCURATE_ON,
];
const LAYERS_FILTERABLE = [
  ...LAYERS_CLICKABLE,
  LAYER_LABELS_OFF,
  LAYER_LABELS_OFF_INACCURATE,
];
const LAYERS_INACCURATE = [
  LAYER_POINTS_INACCURATE_ON,
  LAYER_CLUSTERS_INACCURATE_ON,
  LAYER_POINTS_INACCURATE_OUT,
];

const BASE_FILTERS: any = {};
BASE_FILTERS[LAYER_POINTS_INACCURATE_ACTIVE] = ['all', ['!', ['get', 'branch_location_accurate']], ['==', ['get', 'branch_count'], ['number', 1]]];
BASE_FILTERS[LAYER_CLUSTERS_INACCURATE_ACTIVE] = ['all', ['!', ['get', 'branch_location_accurate']], ['>', ['get', 'branch_count'], ['number', 1]]];
// BASE_FILTERS[LAYER_LABELS_ACTIVE] = ['get', 'branch_location_accurate'];
BASE_FILTERS[LAYER_POINTS_ACTIVE] = ['get', 'branch_location_accurate'];
BASE_FILTERS[LAYER_POINTS_STROKE_ACTIVE] = ['get', 'branch_location_accurate'];
BASE_FILTERS[LAYER_POINTS_INACCURATE_ON] = ['==', ['get', 'branch_count'], ['number', 1]];
BASE_FILTERS[LAYER_CLUSTERS_INACCURATE_ON] = ['>', ['get', 'branch_count'], ['number', 1]];

@UntilDestroy()
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements OnChanges, AfterViewInit {

  STYLE = environment.mapStyle;

  @Input() searchParams: SearchParams | null;
  @Input() pointId: string;
  @Input() cardId: string;
  @Input() markerProps: any;
  // @Output('points') points = new EventEmitter<SRMPoint | null>();
  // @Output('hover') pointsHover = new EventEmitter<string | null>();
  @Output('map') newMap = new EventEmitter<MapComponent>();
  @Output('mapBounds') mapBounds = new EventEmitter<number[][]>();
  
  @ViewChild('map') mapEl: ElementRef;
  @ViewChild('stablePopup') stablePopupEl: ElementRef;
  @ViewChild('hoverPopup') hoverPopupEl: ElementRef;

  map: mapboxgl.Map;
  addedImages: {[key: string]: boolean} = {};

  moveQueue: MoveQueueItem[] = [];
  geoChanges = new Subject<GeoType>();
  searchParamsQueue = new ReplaySubject<SearchParams>(1);
  bounds: mapboxgl.LngLatBounds;
  lastProps: any = {};

  ZOOM_THRESHOLD = 10;
  ALL_CATEGORIES = ALL_CATEGORIES; 
  savedChanges: SimpleChanges = {};
  pointIdsFilter: any[] = [];
  activePointFilter: any[] = [];
  pointCountMapping: any = {};

  stablePopup: mapboxgl.Popup | null = null;
  hoverPopup: mapboxgl.Popup | null = null;
  stablePopupProps: any = null;
  hoverPopupProps: any = null;
  pointsHover = new Subject<any>();
  
  constructor(private mapboxService: MapboxService, 
              private api: ApiService,
              private platform: PlatformService,
              private layout: LayoutService,
              private router: Router
             ) {
      
  }

  getTitle(card: Card, branch_count: number) {
    if (!card.branch_location_accurate && branch_count > 1) {
      return 'במיקום לא מדויק';
    } else {
      let title = (card.organization_short_name || card.organization_name);
      const max_len = 40;
      if (title && title.length > max_len) {
        title = title.slice(0, max_len) + '…';
      }
      if (!card.branch_location_accurate) {
        title += '*';
      } else {
        if (branch_count > 1) {
          title += ` +${branch_count - 1}`;
        }
      }
      return title;
    }
  }

  changed(changes: SimpleChanges, key: string) {
    return (changes?.[key]?.currentValue !== changes?.[key]?.previousValue || changes?.[key]?.firstChange || false);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.map) {
      Object.assign(this.savedChanges, changes);
      return;
    }
    if (this.changed(changes, 'markerProps') && changes?.markerProps?.currentValue) {
      this.updateMarkerProps(this.markerProps);
    } else if (this.changed(changes, 'pointId') && changes?.pointId?.currentValue) {
      this.api.getPoint(this.pointId, this.searchParams || undefined).subscribe((cards) => {
        if (cards.length > 0) {
          const branchIds: string[] = [];
          cards.forEach(card => {
            if (branchIds.indexOf(card.branch_id) === -1) {
              branchIds.push(card.branch_id);
            }
          });
          const title = this.getTitle(cards[0], branchIds.length);
          this.setActivePoint({
            point_id: this.pointId,
            response_category: cards[0].response_category,
            title: title,
            branch_count: branchIds.length,
            branch_location_accurate: cards[0].branch_location_accurate,
            coordinates: cards[0].branch_geometry
          });  
        }
      });
    } else if ((this.changed(changes, 'cardId') || this.changed(changes, 'pointId')) && !this.pointId?.length && this.cardId?.length) {
      this.api.getCard(this.cardId).pipe(
        switchMap((card) => {
          // if (card.branch_location_accurate) {
          return from([{card, branch_count: 1}]);
          // } else {
          //   return this.api.getPoint(card.point_id, this.searchParams || undefined).pipe(
          //     map((cards) => {
          //       const branchIds: string[] = [];
          //       cards.forEach(card => {
          //         if (branchIds.indexOf(card.branch_id) === -1) {
          //           branchIds.push(card.branch_id);
          //         }
          //       });      
          //       return {card, service_count: branchIds.length};
          //     })
          //   );
          // }
        }),
        map(({card, branch_count}) => {
          const title = this.getTitle(card, branch_count);
          return {
            point_id: card.point_id,
            response_category: card.response_category,
            branch_location_accurate: card.branch_location_accurate,
            branch_count: branch_count,
            title: title,
            coordinates: card.branch_geometry
          }
        })
      ).subscribe((props: any) => {
        this.setActivePoint(props);
      });
    }
    if (!this.pointId && !this.cardId) {
      this.setActivePoint(null);
    }
    if (this.changed(changes, 'searchParams') && changes?.searchParams?.currentValue) {
      this.searchParamsQueue.next(changes?.searchParams?.currentValue);
    }
    this.setPopup(true, null);
  }

  ngAfterViewInit(): void {
      this.mapboxService.init.subscribe(() => {
        this.initialize();
      });
  }

  initialize() {
    console.log('INIT MAP', this.mapEl.nativeElement);
    // let first_ = true;
    if (this.platform.browser() && this.mapEl && this.mapEl.nativeElement) {
      try {
        const mapParams: mapboxgl.MapboxOptions = {
          container: this.mapEl.nativeElement,
          style: this.STYLE,
          minZoom: 6.4,
          attributionControl: false,
          center: [34.9, 32],
          zoom: 8.5,
          maxBounds: [[30, 27], [40, 38]],
        };
        this.map = new mapboxgl.Map(mapParams);
        this.map.addControl(new mapboxgl.AttributionControl(), 'top-right');
        if (this.layout.desktop) {
          this.map.addControl(new mapboxgl.NavigationControl({showCompass: false}), 'top-left');
        }
        this.map.dragRotate.disable();
        this.map.touchZoomRotate.disableRotation();
        this.map.touchPitch.disable();
        this.map.on('styleimagemissing', (e) => {
          const id: string = e.id;
          if (this.addedImages[id]) {
            return;
          }
          this.addedImages[id] = true;
          this.map.addImage(id, {width: 0, height: 0, data: new Uint8Array()});
          const toAdd: {img: HTMLImageElement | null, options: any} = this.createLabelBg(id);
          if (toAdd.img !== null) {
            toAdd.img.onload = () => {
              this.map.setLayoutProperty(LAYER_LABELS_ACTIVE, 'visibility', 'none');
              this.map.removeImage(id);
              this.map.addImage(id, toAdd.img as HTMLImageElement, toAdd.options);
              timer(0).subscribe(() => {
                this.map.setLayoutProperty(LAYER_LABELS_ACTIVE, 'visibility', 'visible');
              });
            };
          }
        });
        this.map.on('load', () => {
          console.log('MAP LOADED', environment.production);
          if (!environment.production) {
            for (const layer of LAYERS_ACCURATE_SOURCE) {
              this.setStagingLayerSource(this.map, layer, true);
            }
            for (const layer of LAYERS_INACCURATE_SOURCE) {
              this.setStagingLayerSource(this.map, layer, false);
            }
          }
          this.addActivePointDataSource(this.map);
          this.addInaccuratePointsDataSource(this.map);
          const colorStyle = [
            "match",
            [
              "get",
              "response_category"
            ],
          ];
          CATEGORY_COLORS.forEach(cc => {
            colorStyle.push([cc.category]);
            colorStyle.push(cc.color);
          });
          colorStyle.push('#444444');
          this.map.setPaintProperty(LAYER_POINTS_ON_CENTER, 'circle-color', colorStyle);
          this.map.setPaintProperty(LAYER_POINTS_STROKE_ON, 'circle-stroke-color', colorStyle);

          this.map.getStyle().layers?.filter((l) => LAYERS_CLICKABLE.indexOf(l.id) >= 0).forEach((layer) => {
            const layerName = layer.id;
            this.map.on('click', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
              if (e.defaultPrevented) {
                return;
              }
              if (e.features && e.features.length > 0) {
                const props: any = e.features[0].properties;
                props.branch_geometry = (e.features[0].geometry as any || {})['coordinates'];
                console.log('CLICKED', props);
                const newCardId = props.card_id;
                const route = [];
                let dontRoute = false;
                console.log('CLICKED2', 's', this.searchParams?.ac_query, 'c', newCardId, 'p', props.point_id, 'l', this.layout.mobile, 'cp', this.pointId);
                if (this.searchParams?.ac_query) {
                  route.push('s', this.searchParams?.ac_query);
                }
                if (newCardId) {
                  route.push('c', newCardId);
                } else {
                  if (this.layout.mobile) {
                    if (this.cardId && (!this.pointId || this.pointId === props.point_id)) {
                      route.push('c', this.cardId, 'p', props.point_id);
                    } else {
                      route.push('p', props.point_id);
                    }
                  } else {
                    this.setPopup(true, props);
                    this.pointsHover.next(null);
                    dontRoute = true;
                  }
                }
                if (!dontRoute) {
                  route[0] = '/' + route[0];
                  this.router.navigate(route, {queryParamsHandling: 'preserve'});  
                }
                // this.points.next(props as SRMPoint);
              }
              e.preventDefault();
            });
            this.map.on('mousemove', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
              if (e.defaultPrevented || this.layout.mobile) {
                return;
              }
              e.preventDefault();
              if (e.features && e.features.length > 0) {
                const props: any = e.features[0].properties;
                if (props.point_id === this.stablePopupProps?.point_id) {
                  return;
                }
                props.branch_geometry = (e.features[0].geometry as any || {})['coordinates'];
                this.pointsHover.next(props);
                this.map.getCanvas().style.cursor = 'pointer';
              }
            });
            // this.map.on('mouseout', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
            //   if (e.defaultPrevented) {
            //     return;
            //   }
            //   e.preventDefault();
            //   this.pointsHover.next(null);
            //   this.map.getCanvas().style.cursor = '';
            // });
          });
          this.map.on('mousemove', (e: mapboxgl.MapLayerMouseEvent) => {
            if (e.defaultPrevented || this.layout.mobile) {
              return;
            }
            e.preventDefault();
            this.pointsHover.next(null);
            this.map.getCanvas().style.cursor = '';
          });
          this.map.on('click', (e: mapboxgl.MapLayerMouseEvent) => {
            if (e.defaultPrevented || this.layout.mobile) {
              return;
            }
            e.preventDefault();
            this.setPopup(true, null);
          });
          this.pointsHover.pipe(
            untilDestroyed(this),
            distinctUntilChanged((a, b) => a?.point_id === b?.point_id),
            switchMap((props) => {
              if (!props || props.branch_count) {
                return from([props]);
              } else {
                return this.api.getPoint(props.point_id, this.searchParams).pipe(
                  map((cards) => {
                    if (cards.length === 0) {
                      return {};
                    }
                    const ret: any = {
                      point_id: props.point_id,
                      service_count: cards.length,
                      branch_count: cards.map((b) => b.organization_name,).filter((v, i, a) => a.indexOf(v) === i).length,
                      branch_geometry: cards[0].branch_geometry,
                      title: cards[0].organization_name,
                      response_category: cards[0].response_category,
                      branch_location_accurate: cards[0].branch_location_accurate,
                      coordinates: cards[0].branch_geometry,
                      processed: true
                    };
                    if (cards.length === 1) {
                      ret.card_id = cards[0].card_id;
                    }
                    return ret;
                  }),
                );
              }
            }),
            switchMap((props) => {
              if (props?.card_id) {
                return this.api.getCard(props.card_id).pipe(
                  map((card) => {
                    props.card = card;
                    return props;
                  })
                );
              } else {
                return from([props]);
              }
            })
          ).subscribe((props) => {
            this.setPopup(false, props);
          });
          this.searchParamsQueue.pipe(
            untilDestroyed(this),
            debounceTime(500),
            distinctUntilChanged((a, b) => a.searchHash.localeCompare(b.searchHash) === 0),
            switchMap((params) => {
              if (params) {
                return this.api.getPoints(params).pipe(
                  tap((keys) => {
                    this.pointIdsFilter = ['in', ['get', 'point_id'], ['literal', [...keys]]];
                    this.applyFilters();
                  }),
                  map((result) => params)
                )
              } else {
                return from([params]);
              }
            }),
            switchMap((params) => {
              return this.api.getInaccuratePoints(params);
            }),
          ).subscribe((points) => {
            this.updateInaccuratePoints(points);
          });
          this.map.on('moveend', (event: mapboxgl.MapboxEvent<MouseEvent>) => {
            // console.log('MOVEEND', event);
            this.updateBounds();
            if (!(event as any).ignore) {
              this.setCenter(this.map.getCenter(), this.map.getZoom());
            }
            this.processAction();
          });
          this.bounds = this.map.getBounds();
          timer(100).subscribe(() => {
            this.newMap.next(this);
            this.ngOnChanges(this.savedChanges);
            this.updateBounds();
          });
        });
      } catch (e) {
        console.log('FAILED TO LOAD', e)
      }
    }
  }
  
  updateBounds() {
    this.bounds = this.map.getBounds();
    this.mapBounds.next([
      [
        this.bounds.getWest(),
        this.bounds.getNorth()
      ],
      [
        this.bounds.getEast(),
        this.bounds.getSouth()
      ]
    ]);
  }

  processAction() {
    if (this.moveQueue.length > 0) {
      const {action, description} = this.moveQueue.shift() as MoveQueueItem;
      if (!!action) {
        console.log('ACTION-QQ', description);
        action(this.map);  
      }
    }
  }

  setStagingLayerSource(map: mapboxgl.Map, layerId: string, accurate=true) {
    const oldLayers = map.getStyle().layers || [];
    const layerIndex = oldLayers.findIndex(l => l.id === layerId);
    const layerDef: any = oldLayers[layerIndex];
    const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;
    layerDef['source-layer'] = accurate ? 'geo_data_staging' : 'geo_data_inaccurate_staging';
    map.removeLayer(layerId);
    map.addLayer(layerDef, before);
  }

  addActivePointDataSource(map: mapboxgl.Map) {
    map.addSource('active-point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {
            title: ''
          }
        }]
      }
    });

    for (const layer of LAYERS_ACTIVE) {
      const oldLayers = map.getStyle().layers || [];
      const layerIndex = oldLayers.findIndex(l => l.id === layer);
      const layerDef: any = oldLayers[layerIndex];
      const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;

      map.removeLayer(layer);
      map.addLayer({
        id: layer,
        type: layerDef.type,
        source: 'active-point',
        layout: Object.assign(layerDef.layout || {}, {visibility: 'visible'}),
        paint: layerDef.paint || {}
      }, before);
      map.setFilter(layer, BASE_FILTERS[layer] || null);  //TODO add filter for inaccurate, ensure inaccurate is part of the props
    }
  }

  addInaccuratePointsDataSource(map: mapboxgl.Map) {
    map.addSource('inaccurate-points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    for (const layer of LAYERS_INACCURATE) {
      const oldLayers = map.getStyle().layers || [];
      const layerIndex = oldLayers.findIndex(l => l.id === layer);
      const layerDef: any = oldLayers[layerIndex];
      const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;

      map.removeLayer(layer);
      map.addLayer({
        id: layer,
        type: layerDef.type,
        source: 'inaccurate-points',
        layout: Object.assign(layerDef.layout || {}, {visibility: 'visible'}),
        paint: layerDef.paint || {}
      }, before);
      map.setFilter(layer, BASE_FILTERS[layer] || null);
    }
  }

  createLabelBg(id: string): {img: HTMLImageElement | null, options: any} {
    let src: string | null = null;
    let img: any = null;
    let options: any = {};
    for (const cc of ALL_CATEGORIES) {
      if (id === 'tooltip-rc-' + cc.category) {
        img = new Image(164, 48);
        src = this.generateTooltipImg(cc.color);
        options = {
          content: [2, 0, 162, 48],
          stretchX: [[8, 156]],
          stretchY: [[8, 40]],
        };
        break;
      } else if (id === 'cluster-blur-rc-' + cc.category) {
        img = new Image(40, 40);
        src = this.generateInaccurateClusterImg(cc.color);
        break;
      } else if (id === 'point-blur-rc-' + cc.category) {
        img = new Image(16, 16);
        src = this.generateInaccuratePointImg(cc.color);
        break;
      }
    } //TODO Add both inaccurate images here, also update the style
    if (src !== null) {
      src = 'data:image/svg+xml;base64,' + btoa(src);
      img.src = src;
      return {img, options};
    }
    return {img: null, options};
  }

  queueAction(action: (map: mapboxgl.Map) => void, description: string) {
    this.moveQueue.push({action, description});
    if (!this.map.isMoving()) {
      this.processAction();
    }
  }

  applyFilters() {
    const filters: any[] = [];
    if (this.activePointFilter && this.activePointFilter.length) {
      filters.push(this.activePointFilter);
    }
    if (this.pointIdsFilter && this.pointIdsFilter.length) {
      filters.push(this.pointIdsFilter);
    }
    for (const layer of LAYERS_FILTERABLE) {
      let layerFilters: any[] | null = filters.slice();
      if (BASE_FILTERS[layer]) {
        layerFilters.push(BASE_FILTERS[layer]);
      }
      if (layerFilters.length > 1) {
        layerFilters.unshift('all');
      } else if (layerFilters.length === 1) {
        layerFilters = layerFilters[0];
      } else {
        layerFilters = null;
      }
      this.map.setFilter(layer, layerFilters);
    }
  }

  setActivePoint(props: any) {
    if (props) {
      this.activePointFilter = ['!=', ['get', 'point_id'], ['string', props.point_id]];
    } else {
      this.activePointFilter = [];
    }
    this.applyFilters();
    this.lastProps = props;
    this.updateMarkerProps({});
  }

  // processPointIds(ids: string[], singlePointMode: boolean, props: any | null = null) {
  //   const pointIds = ids || [];
  //   const activePointId = singlePointMode ? pointIds[0] : null;
  //   console.log('MMM SET FILTER', singlePointMode, this.currentPointIds?.length, activePointId);
  //   if (singlePointMode) {
  //     if (this.currentPointIds?.length) {
  //       for (const layer of LAYERS_CLICKABLE) {
  //         this.map.setFilter(layer, ['in', ['get', 'point_id'], ['literal', [...this.currentPointIds.filter(id => id !== activePointId)]]]);
  //       }
  //     }
  //   } else {
  //     for (const layer of LAYERS_CLICKABLE) {
  //       this.map.setFilter(layer, ['in', ['get', 'point_id'], ['literal', [...pointIds]]]);
  //     }
  //     this.currentPointIds = pointIds;
  //   }
  //   if (activePointId && props) {
  //     console.log('MMM PROPS', props);
  //     this.lastProps = props;
  //     this.updateMarkerProps({});
  //   } 
  // }

  setCenter(center: mapboxgl.LngLat, zoom: number) {
    const fragment = 'g' + center.lng.toFixed(5) + '/' + center.lat.toFixed(5) + '/' + zoom.toFixed(2);
    this.router.navigate([], {
      fragment,
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  }

  updateInaccuratePoints(points: any[]) {
    const source = this.map.getSource('inaccurate-points') as mapboxgl.GeoJSONSource;
    const data: any[] = points.map((p) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: p.geometry
      },
      properties: p
    }));
    source?.setData({
      type: 'FeatureCollection',
      features: data
    });
  }

  updateMarkerProps(props: any) {
    const overlaid = Object.assign({}, this.lastProps, props);
    (this.map.getSource('active-point') as mapboxgl.GeoJSONSource)?.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: overlaid && overlaid.coordinates || [0, 0]
        },
        properties: overlaid
      }]
    });
  }

  generateTooltipImg(color: string) {
    return `<svg width="82" height="24" viewBox="0 0 82 24" fill="blue" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 4C0 1.79086 1.79086 0 4 0H78C80.2091 0 82 1.79086 82 4V20C82 22.2091 80.2091 24 78 24H4C1.79086 24 0 22.2091 0 20V4Z" fill="${color}"/>
    </svg>`;
  }

  generateInaccurateClusterImg(color: string) {
    return `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g fill='${color}'>
        <g opacity="0.05"><circle cx="20" cy="20" r="20"/></g>
        <g opacity="0.1"><circle cx="20" cy="20" r="19"/></g>
        <g opacity="0.1"><circle cx="20" cy="20" r="18"/></g>
        <g opacity="0.1"><circle cx="20" cy="20" r="17"/></g>
        <g opacity="0.1"><circle cx="20" cy="20" r="16"/></g>
        <g opacity="0.1"><circle cx="20" cy="20" r="15"/></g>
        <g opacity="0.1"><circle cx="20" cy="20" r="14"/></g>
        <g opacity="0.1"><circle cx="20" cy="20" r="13"/></g>
        <g opacity="0.1"><circle cx="20" cy="20" r="12"/></g>
        <g opacity="0.1"><circle cx="20" cy="20" r="11"/></g>
    </g>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M33.9575 21.0995L32.9605 21.0221C32.9866 20.685 33 20.3442 33 20C33 19.6558 32.9866 19.315 32.9605 18.9779L33.9575 18.9005C33.9856 19.2633 34 19.63 34 20C34 20.37 33.9856 20.7367 33.9575 21.0995ZM33.6161 16.7304L32.6436 16.963C32.4838 16.2952 32.2724 15.6474 32.0139 15.024L32.9377 14.641C33.2162 15.3126 33.444 16.0107 33.6161 16.7304ZM31.9388 12.6842L31.0866 13.2075C30.7294 12.6257 30.3275 12.0741 29.8858 11.5574L30.6459 10.9076C31.1214 11.4638 31.5541 12.0577 31.9388 12.6842ZM29.0924 9.35406L28.4426 10.1142C27.9259 9.67246 27.3743 9.27063 26.7925 8.91339L27.3158 8.06123C27.9423 8.44595 28.5362 8.87859 29.0924 9.35406ZM25.359 7.06233L24.976 7.98605C24.3526 7.72755 23.7048 7.5162 23.037 7.35642L23.2696 6.38387C23.9893 6.55604 24.6874 6.78379 25.359 7.06233ZM21.0995 6.04254L21.0221 7.03954C20.685 7.01335 20.3442 7 20 7C19.6558 7 19.315 7.01335 18.9779 7.03954L18.9005 6.04254C19.2633 6.01436 19.63 6 20 6C20.37 6 20.7367 6.01436 21.0995 6.04254ZM16.7304 6.38387L16.963 7.35642C16.2952 7.5162 15.6474 7.72755 15.024 7.98605L14.641 7.06233C15.3126 6.78379 16.0107 6.55604 16.7304 6.38387ZM12.6842 8.06123L13.2075 8.91338C12.6257 9.27063 12.0741 9.67246 11.5574 10.1142L10.9076 9.35406C11.4638 8.87859 12.0577 8.44595 12.6842 8.06123ZM9.35406 10.9076L10.1142 11.5574C9.67246 12.0741 9.27063 12.6257 8.91339 13.2075L8.06123 12.6842C8.44595 12.0577 8.87859 11.4638 9.35406 10.9076ZM7.06233 14.641L7.98605 15.024C7.72755 15.6474 7.5162 16.2952 7.35642 16.963L6.38387 16.7304C6.55604 16.0107 6.78379 15.3126 7.06233 14.641ZM6.04254 18.9005C6.01436 19.2633 6 19.63 6 20C6 20.37 6.01436 20.7367 6.04254 21.0995L7.03954 21.0221C7.01335 20.685 7 20.3442 7 20C7 19.6558 7.01335 19.315 7.03954 18.9779L6.04254 18.9005ZM6.38387 23.2696L7.35642 23.037C7.5162 23.7048 7.72755 24.3526 7.98605 24.976L7.06233 25.359C6.78379 24.6874 6.55604 23.9893 6.38387 23.2696ZM8.06123 27.3158L8.91338 26.7925C9.27063 27.3743 9.67246 27.9259 10.1142 28.4426L9.35406 29.0924C8.87859 28.5362 8.44595 27.9423 8.06123 27.3158ZM10.9076 30.6459C11.4638 31.1214 12.0577 31.5541 12.6842 31.9388L13.2075 31.0866C12.6257 30.7294 12.0741 30.3275 11.5574 29.8858L10.9076 30.6459ZM14.641 32.9377L15.024 32.0139C15.6474 32.2724 16.2952 32.4838 16.963 32.6436L16.7304 33.6161C16.0107 33.444 15.3126 33.2162 14.641 32.9377ZM18.9005 33.9575L18.9779 32.9605C19.315 32.9866 19.6558 33 20 33C20.3442 33 20.685 32.9866 21.0221 32.9605L21.0995 33.9575C20.7367 33.9856 20.37 34 20 34C19.63 34 19.2633 33.9856 18.9005 33.9575ZM23.2696 33.6161L23.037 32.6436C23.7048 32.4838 24.3526 32.2724 24.976 32.0139L25.359 32.9377C24.6874 33.2162 23.9893 33.444 23.2696 33.6161ZM27.3158 31.9388L26.7925 31.0866C27.3743 30.7294 27.9259 30.3275 28.4426 29.8858L29.0924 30.6459C28.5362 31.1214 27.9423 31.5541 27.3158 31.9388ZM30.6459 29.0924L29.8858 28.4426C30.3275 27.9259 30.7294 27.3743 31.0866 26.7925L31.9388 27.3158C31.5541 27.9423 31.1214 28.5362 30.6459 29.0924ZM32.9377 25.359L32.0139 24.976C32.2724 24.3526 32.4838 23.7048 32.6436 23.037L33.6161 23.2696C33.444 23.9893 33.2162 24.6874 32.9377 25.359Z" fill="white"/>
    </svg>`;
  }

  generateInaccuratePointImg(color: string) {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g fill="${color}">
        <g opacity="0.64"><circle cx="8" cy="8" r="3"/></g>
        <g opacity="0.32"><circle cx="8" cy="8" r="4"/></g>
        <g opacity="0.16"><circle cx="8" cy="8" r="5"/></g>
        <g opacity="0.08"><circle cx="8" cy="8" r="6"/></g>
        <g opacity="0.04"><circle cx="8" cy="8" r="7"/></g>
    </g>
    <g opacity="1" fill="#f9f4f1"><circle cx="8" cy="8" r="3"/></g>
    </svg>`;
  }

  setPopup(stable: boolean, props: any) {
    let obs: Observable<any> | null = null;
    if (stable) {
      this.stablePopupProps = null;
      obs = from([{props, stable}]).pipe(
        delay(100),
        tap(({props, stable}) => {
          this.stablePopupProps = props;
        }),
        delay(100)
      );
    } else {
      this.hoverPopupProps = null;
      obs = from([{props, stable}]).pipe(
        delay(10),
        tap(({props, stable}) => {
          this.hoverPopupProps = props;
        }),
        delay(10)
      );  
    }    
    obs?.subscribe(({props: any, stable: boolean}) => {
      const el = (stable ? this.stablePopupEl : this.hoverPopupEl)?.nativeElement as HTMLElement;
      let popup: mapboxgl.Popup | null = null;
      if (props && el) {
        const mapPopup = el.querySelectorAll('*')[0] as HTMLElement;
        if (mapPopup) {
          popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            // anchor: 'bottom',
            // offset: [-2, -10],
            className: stable ? 'map-popup-stable' : 'map-popup-hover',
          }).setLngLat(props.branch_geometry)
            .setDOMContent(mapPopup)
            .setMaxWidth("300px")
            .addTo(this.map);
        }
      }
      if (stable) {
        if (this.stablePopup) {
          this.stablePopup.remove();
        }
        this.stablePopup = popup;        
      } else {
        if (this.hoverPopup) {
          this.hoverPopup.remove();
        }
        this.hoverPopup = popup;
      }    
    });
  }
}
