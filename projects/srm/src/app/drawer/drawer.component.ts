import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import { first } from 'rxjs/operators';
import { DrawerState } from '../common/datatypes';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.less']
})
export class DrawerComponent implements OnInit, AfterViewInit {

  @Input() state: DrawerState = DrawerState.Card;
  @Output() handle = new EventEmitter<string>();
  @ViewChild('handleEl') handleEl: ElementRef;
  @ViewChild('scrollable') scrollable: ElementRef;

  DrawerState = DrawerState;
  
  startY: number;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const el = this.handleEl.nativeElement;
    if (el) {
      fromEvent(el, 'mousedown').subscribe((el) => {
        this.handleGestureStart(el as MouseEvent);
        fromEvent(window, 'mouseup').pipe(first()).subscribe((el) => {
          this.handleGestureEnd(el as MouseEvent);
        });
      });
      fromEvent(el, 'touchstart').subscribe((el) => {
        this.handleGestureStart(el as TouchEvent);
        fromEvent(window, 'touchend').pipe(first()).subscribe((el) => {
          this.handleGestureEnd(el as TouchEvent);
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
      }
    }
    if (diff < -100) {
      if (scrollableEl.scrollHeight - scrollableEl.scrollTop - scrollableEl.clientHeight < 1 || scrollableDiff > 0) {
        this.handle.emit('up');
      }
    }
  }
}
