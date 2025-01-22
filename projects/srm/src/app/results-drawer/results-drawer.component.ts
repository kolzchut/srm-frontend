import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { animationFrameScheduler, from, fromEvent, Subscription, timer } from 'rxjs';
import { delay, distinctUntilChanged, first, map, tap, throttleTime, filter } from 'rxjs/operators';
import { DrawerState } from '../consts';
import { LayoutService } from '../layout.service';
import { WindowService } from '../window.service';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import { SearchState } from '../search-results/search-state';
import { PlatformService } from '../platform.service';

@UntilDestroy()
@Component({
  selector: 'app-results-drawer',
  templateUrl: './results-drawer.component.html',
  styleUrls: ['./results-drawer.component.less'],
  host: {
    '[class.minimal]': 'state === DrawerState.Minimal',
    '[class.hidden]': 'state === DrawerState.Hidden'
  }
})
export class ResultsDrawerComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() state: DrawerState = DrawerState.Full;
  @Input() scrollAll = false;
  @Input() nationalCount = 0;
  @Input() areaSearchState: AreaSearchState;
  @Input() searchState: SearchState;
  @Input() isHideMapIcon = false;
  @Output() handle = new EventEmitter<string>();
  @Output() scrollTop = new EventEmitter<boolean>();
  @Output() size = new EventEmitter<number>();
  @ViewChild('handleEl') handleEl: ElementRef;
  @ViewChild('mapWindow') mapWindow: ElementRef;
  @ViewChild('scrollable') scrollable: ElementRef;
  
  startY: number;
  startTime: number;
  currentHeight = -1;
  moveSub: Subscription | null = null;
  moveDiff = 0;
  gesture = false;
  lastHostHeight = 800;
  calcedHeight = 0;

  STICKINESS = 50;

  DrawerState = DrawerState;

  constructor(public layout: LayoutService, private window: WindowService, private host: ElementRef, private platform: PlatformService) { }

  ngOnInit(): void {
    if (this.layout.mobile()){
      this.state = DrawerState.Full;
    }
  }

  ngOnChanges(): void {
    this.calcHeight();
  }

  get hostHeight(): number {
    const hostHeight = this.host.nativeElement.clientHeight;
    if (hostHeight === 0) {
      return this.lastHostHeight;
    }
    this.lastHostHeight = hostHeight;
    return hostHeight;
  }

  calcHeight(): number {
    if (this.layout.desktop()) return this.hostHeight;
    const mobileDrawerHeightMap = {
      [DrawerState.Hidden]: this.hostHeight,
      [DrawerState.Peek]: this.hostHeight - 66,
      [DrawerState.Half]: this.hostHeight * 0.33,
      [DrawerState.Full]: 0,
      [DrawerState.Minimal]: this.hostHeight / 2,
    };
    let drawerHeight = mobileDrawerHeightMap[this.state] + this.moveDiff;
    if (drawerHeight > this.hostHeight) {
      drawerHeight = this.hostHeight;
    }
    this.calcedHeight = drawerHeight;
    return this.calcedHeight;
  }

  ngAfterViewInit(): void {
    const el = this.handleEl.nativeElement as HTMLDivElement;
    if (el) {
      const doc = this.window.D || {};
      if (this.layout.mobile()) {
        if ('ontouchstart' in doc) {
          fromEvent(el, 'touchstart').pipe(
            untilDestroyed(this),
          ).subscribe((ev) => {
            this.handleGestureStart(ev as TouchEvent);
            fromEvent(window, 'touchend').pipe(first()).subscribe((ev) => {
              this.handleGestureEnd(ev as TouchEvent);
            });
          });
        } else {
          fromEvent(el, 'mousedown').pipe(
            untilDestroyed(this),
          ).subscribe((ev) => {
            this.handleGestureStart(ev as MouseEvent);
            fromEvent(window, 'mouseup').pipe(first()).subscribe((ev) => {
              this.handleGestureEnd(ev as MouseEvent);
            });
          });  
        }
      }
      const mapWindowEl: HTMLElement = this.mapWindow.nativeElement;
      if (mapWindowEl) {
        fromEvent(mapWindowEl, 'transitionstart').pipe(
          untilDestroyed(this),
        ).subscribe((ev: Event) => {
          const height = this.calcHeight();
          if (height !== this.currentHeight) {
            this.currentHeight = height;
            this.size.emit(this.hostHeight - height);
          }
        });
      }
      const scrollableEl: HTMLElement = this.scrollable.nativeElement;
      if (scrollableEl) {
        fromEvent(scrollableEl, 'scroll').pipe(
          untilDestroyed(this),
          throttleTime(0, animationFrameScheduler),
          tap(() => {
            if (this.gesture) {
              this.gesture = false;
              this.moveDiff = 0;
              if (this.moveSub !== null) {
                this.moveSub.unsubscribe();
                this.moveSub = null;
              }
              this.calcHeight();
            }
          }),
          map(() => scrollableEl.scrollTop === 0),
          distinctUntilChanged(),
        ).subscribe((top: boolean) => {
          this.scrollTop.emit(top);
        });
      }
      this.platform.browser(() => {
        timer(100).subscribe(() => {
          this.currentHeight = this.calcHeight();
          this.size.emit(this.hostHeight - this.currentHeight);
        });
      });
    }
  }

  handleGestureStart(event: MouseEvent | TouchEvent): void {
    if (event instanceof MouseEvent) {
      this.startY = event.clientY;
    }
    else if (event instanceof TouchEvent) {
      this.startY = event.touches[0].clientY;
    }
    const handleTop = this.handleEl.nativeElement.getBoundingClientRect().top;
    if (this.startY > handleTop && this.startY < handleTop + 56) {
      this.startTime = performance.now();
      if (this.moveSub === null) {
        this.moveSub = fromEvent(window, 'touchmove').pipe(
          untilDestroyed(this),
          throttleTime(0, animationFrameScheduler),
        ).subscribe((ev) => {
          this.handleGestureMove(ev as TouchEvent);
        });
      }
    } else {
      this.startTime = 0;
    }
  }

  handleGestureMove(event: MouseEvent | TouchEvent): void {
    let endY: number = this.startY;
    if (event instanceof MouseEvent) {
      endY = event.clientY;
    }
    else if (event instanceof TouchEvent) {
      endY = event.changedTouches[0].clientY;
    }
    const diff = endY - this.startY;
    this.moveDiff = Math.abs(diff) < this.STICKINESS ? 0 : diff;
    this.gesture = Math.abs(diff) > this.STICKINESS / 2;
    this.calcHeight();
  }

  handleGestureEnd(event: MouseEvent | TouchEvent): void {
    this.moveDiff = 0;
    this.calcHeight();
    if (this.moveSub !== null) {
      this.moveSub.unsubscribe();
      this.moveSub = null;
    }
    if (!this.gesture) {
      return;
    }
    this.gesture = false;

    let endY: number = this.startY;
    if (event instanceof MouseEvent) {
      endY = event.clientY;
    }
    else if (event instanceof TouchEvent) {
      endY = event.changedTouches[0].clientY;
    }
    const scrollableEl: HTMLElement = this.scrollable.nativeElement;
    const scrollableTop = scrollableEl.getBoundingClientRect().top;
    const scrollableDiff = scrollableTop  + 48 - this.startY;

    timer(0).subscribe(() => {
      const diff = endY - this.startY;
      if (diff > this.STICKINESS) {
        if (scrollableEl.scrollTop === 0 || scrollableDiff > 0) {
          this.handle.emit('down');
          event.stopPropagation();
        }
      } else if (diff < -this.STICKINESS) {
        this.handle.emit('up');
        event.stopPropagation();
      } else if (this.startTime) {
        const timeDiff = performance.now() - this.startTime;
        if (Math.abs(diff) < this.STICKINESS && timeDiff < 500) {
          timer(500 - timeDiff).subscribe(() => {
            this.handle.emit('click');
          });
          event.stopPropagation();
        }
      }
    });
  }
}
