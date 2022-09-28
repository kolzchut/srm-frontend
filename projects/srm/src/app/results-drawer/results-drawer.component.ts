import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { animationFrameScheduler, from, fromEvent, Subscription, timer } from 'rxjs';
import { delay, distinctUntilChanged, first, map, tap, throttleTime } from 'rxjs/operators';
import { DrawerState } from '../consts';
import { LayoutService } from '../layout.service';
import { WindowService } from '../window.service';

@Component({
  selector: 'app-results-drawer',
  templateUrl: './results-drawer.component.html',
  styleUrls: ['./results-drawer.component.less']
})
export class ResultsDrawerComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() state: DrawerState = DrawerState.Half;
  @Output() handle = new EventEmitter<string>();
  @Output() height = new EventEmitter<number>();
  @Output() scrollTop = new EventEmitter<boolean>();
  @ViewChild('handleEl') handleEl: ElementRef;
  @ViewChild('scrollable') scrollable: ElementRef;
  
  startY: number;
  startTime: number;
  currentHeight = -1;
  moveSub: Subscription | null = null;
  moveDiff = 0;
  gesture = false;
  lastHostHeight = 800;

  STICKINESS = 50;

  constructor(public layout: LayoutService, private window: WindowService, private host: ElementRef) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
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
    const hostHeight = this.hostHeight;
    let ret = 0;
    if (this.layout.desktop) {
      ret = hostHeight;
    } else if (this.state === DrawerState.Peek) {
      ret = 56;
    } else if (this.state === DrawerState.Half) {
      ret = 0.5 * hostHeight;
    } else if (this.state === DrawerState.Most) {
      ret = 0.8 * hostHeight;
    } else if (this.state === DrawerState.Full) {
      ret = hostHeight;
    }
    ret -= this.moveDiff;
    return ret > hostHeight ? hostHeight : ret;
  }

  calcTop(): number {
    const hostHeight = this.hostHeight;
    return hostHeight - this.calcHeight();
  }

  ngAfterViewInit(): void {
    const el = this.handleEl.nativeElement as HTMLDivElement;
    if (el) {
      const doc = this.window.D || {};
      if (this.layout.mobile) {
        if ('ontouchstart' in doc) {
          fromEvent(el, 'touchstart').subscribe((ev) => {
            this.gesture = true;
            this.handleGestureStart(ev as TouchEvent);
            fromEvent(window, 'touchend').pipe(first()).subscribe((ev) => {
              this.handleGestureEnd(ev as TouchEvent);
            });
          });
        } else {
          fromEvent(el, 'mousedown').subscribe((ev) => {
            this.handleGestureStart(ev as MouseEvent);
            fromEvent(window, 'mouseup').pipe(first()).subscribe((ev) => {
              this.handleGestureEnd(ev as MouseEvent);
            });
          });  
        }
        fromEvent(el, 'transitionstart').subscribe((ev: Event) => {
          const height = this.calcHeight();
          if (height !== this.currentHeight) {
            this.currentHeight = height;
            this.height.emit(height);
          }
        });
        const scrollableEl: HTMLElement = this.scrollable.nativeElement;
        fromEvent(scrollableEl, 'scroll').pipe(
          throttleTime(0, animationFrameScheduler),
          tap(() => {
            if (this.gesture) {
              this.gesture = false;
              this.moveDiff = 0;
              if (this.moveSub !== null) {
                this.moveSub.unsubscribe();
                this.moveSub = null;
              }
            }
          }),
          map(() => scrollableEl.scrollTop === 0),
          distinctUntilChanged(),
        ).subscribe((top: boolean) => {
          this.scrollTop.emit(top);
        });
      }
      this.currentHeight = el.clientHeight;
      this.height.emit(this.currentHeight);
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
    } else {
      this.startTime = 0;
    }
    if (this.moveSub === null) {
      this.moveSub = fromEvent(window, 'touchmove').pipe(
        throttleTime(0, animationFrameScheduler),
      ).subscribe((ev) => {
        this.handleGestureMove(ev as TouchEvent);
        // console.log('MOVE', this.moveDiff);
      });
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
  }

  handleGestureEnd(event: MouseEvent | TouchEvent): void {
    this.moveDiff = 0;
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

  scrollToTop() {
    if (this.layout.desktop) {
      (this.scrollable.nativeElement as HTMLDivElement)?.scrollTo({top: 0});
    }
  }
}
