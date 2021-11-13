import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { from, fromEvent } from 'rxjs';
import { delay, first, tap } from 'rxjs/operators';
import { DrawerState } from '../common/datatypes';
import { LayoutService } from '../layout.service';

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

  constructor(public layout: LayoutService) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    const el = this.handleEl?.nativeElement as HTMLDivElement;
    if (el) {
      from([true]).pipe(
        delay(250),
      ).subscribe(() => {
        const height = el.clientHeight;
        if (height !== this.currentHeight) {
          this.currentHeight = height;
          this.height.emit(height);
        }
      });  
    }
  }

  ngAfterViewInit(): void {
    const el = this.handleEl.nativeElement;
    if (el) {
      if ('ontouchstart' in document.documentElement) {
        fromEvent(el, 'touchstart').subscribe((el) => {
          this.handleGestureStart(el as TouchEvent);
          fromEvent(window, 'touchend').pipe(first()).subscribe((el) => {
            this.handleGestureEnd(el as TouchEvent);
          });
        });
      } else {
        fromEvent(el, 'mousedown').subscribe((el) => {
          this.handleGestureStart(el as MouseEvent);
          fromEvent(window, 'mouseup').pipe(first()).subscribe((el) => {
            this.handleGestureEnd(el as MouseEvent);
          });
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
        this.handle.emit('click');
        event.stopPropagation();
      }  
    }
  }
}
