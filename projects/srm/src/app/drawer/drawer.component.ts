import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.less']
})
export class DrawerComponent implements OnInit, AfterViewInit {

  @Input() state = 'card';
  @Output() handle = new EventEmitter<string>();
  @ViewChild('handleEl') handleEl: ElementRef;

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
    const diff = endY - this.startY;
    if (diff > 100) {
      this.handle.emit('down');
    }
    if (diff < 100) {
      this.handle.emit('up');
    }
  }
}
