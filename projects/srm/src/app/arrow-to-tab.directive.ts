import { AfterContentInit, AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appArrowToTab]'
})
export class ArrowToTabDirective implements AfterViewInit {

  index = -1;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.el.nativeElement.addEventListener('keydown', (event: KeyboardEvent) => {
      console.log('keydown', event.key);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.updateIndex();
        this.select(this.index + 1);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.updateIndex();
        this.select(this.index - 1);
      }
    });
  }

  updateIndex() {
    const el = this.el.nativeElement;
    const options: HTMLElement[] = el.querySelectorAll('.focusable');
    for (let i = 0; i < options.length; i++) {
      if (options[i] === document.activeElement) {
        this.index = i;
        break;
      }
    }
  }

  select(index: number) {
    const el = this.el.nativeElement;
    const options: HTMLElement[] = el.querySelectorAll('.focusable');
    if (index < 0) {
      index = 0;
    }
    if (index > options.length - 1) {
      index = options.length - 1;
    }
    if (index !== this.index) {
      console.log('found options', options.length, 'selecting', index);
      if (index >= 0) {
        options[index].focus();
        this.index = index;
      }
    }
  }
}
