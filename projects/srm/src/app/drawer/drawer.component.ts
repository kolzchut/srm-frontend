import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { from, fromEvent, timer } from 'rxjs';
import { delay, first } from 'rxjs/operators';
import { DrawerState } from '../common/datatypes';
import { LayoutService } from '../layout.service';
import { WindowService } from '../window.service';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.less']
})
export class DrawerComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() state: DrawerState = DrawerState.Card;
  @Output() handle = new EventEmitter<string>();
  @Output() height = new EventEmitter<number>();
  @ViewChild('handleEl') handleEl: ElementRef;
  @ViewChild('scrollable') scrollable: ElementRef;

  DrawerState = DrawerState;
  
  startY: number;
  startTime: number;
  currentHeight = -1;
  hostHeight: number = 0;

  constructor(public layout: LayoutService, private window: WindowService, private host: ElementRef) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {}

  calcHeight(): number {
    this.hostHeight = this.host.nativeElement.clientHeight;
    if (this.layout.desktop) {
      return this.hostHeight;
    }
    if (this.state === DrawerState.Hidden) {
      return 0;
    } else if (this.state === DrawerState.Peek) {
      return 56;
    } else if (this.state === DrawerState.Card) {
      return 174;
    } else if (this.state === DrawerState.Most) {
      return 0.75 * this.hostHeight;
    } else if (this.state === DrawerState.Full) {
      return this.hostHeight;
    } else if (this.state === DrawerState.Presets) {
      return 152;
    }
    return 0;
  }

  calcTop(): number {
    this.hostHeight = this.host.nativeElement.clientHeight;
    return this.hostHeight - this.calcHeight();
  }

  ngAfterViewInit(): void {
    const el = this.handleEl.nativeElement as HTMLDivElement;
    if (el) {
      const doc = this.window.D || {};
      if (this.layout.mobile) {
        if ('ontouchstart' in doc) {
          fromEvent(el, 'touchstart').subscribe((ev) => {
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
  }

  handleGestureEnd(event: MouseEvent | TouchEvent): void {
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

    const diff = endY - this.startY;
    if (diff > 100) {
      if (scrollableEl.scrollTop === 0 || scrollableDiff > 0) {
        this.handle.emit('down');
        event.stopPropagation();
      }
    } else if (diff < -100) {
      if (scrollableEl.scrollHeight - scrollableEl.scrollTop - scrollableEl.clientHeight < 1 || scrollableDiff > 0) {
        this.handle.emit('up');
        event.stopPropagation();
      }
    } else if (this.startTime) {
      const timeDiff = performance.now() - this.startTime;
      if (Math.abs(diff) < 50 && timeDiff < 500) {
        timer(500 - timeDiff).subscribe(() => {
          this.handle.emit('click');
        });
        event.stopPropagation();
      }  
    }
  }
}
