import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-image-button',
  templateUrl: './image-button.component.html',
  styleUrls: ['./image-button.component.less']
})
export class ImageButtonComponent implements OnInit {

  @Input() imageUrl: string = '';
  @Output() click = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

  get cssUrl(): string {
    return `url(${this.imageUrl})`;
  }
}
