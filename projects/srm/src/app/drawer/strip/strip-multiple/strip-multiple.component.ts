import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import { Card } from '../../../common/datatypes';

@Component({
  selector: 'app-strip-multiple',
  templateUrl: './strip-multiple.component.html',
  styleUrls: ['./strip-multiple.component.less']
})
export class StripMultipleComponent implements OnInit, AfterViewInit {

  PAD = 16;
  requested = false;
  leftPossible = true;
  rightPossible = false;

  @Input() cards: Card[] | null;
  @Output() selected = new EventEmitter<Card>();
  @Output() closed = new EventEmitter<void>();
  @ViewChild('container') container: ElementRef;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const el: HTMLDivElement = this.container.nativeElement;
    fromEvent(el, 'scroll').subscribe(() => {
      if (!this.requested) {
        this.requested = true;
        requestAnimationFrame(() => {
          this.leftPossible = el.clientWidth - el.scrollLeft + this.PAD < el.scrollWidth;
          this.rightPossible = el.scrollLeft + this.PAD < 0;
          this.requested = false;
        });
      }
    });
  }

  scroll(delta: number) {
    const el: HTMLDivElement = this.container.nativeElement;
    if (el) {
      el.scrollBy({left: delta * 240, behavior: 'smooth'}); // 80% of 300px
    }
  }
}
