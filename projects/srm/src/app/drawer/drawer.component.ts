import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.less']
})
export class DrawerComponent implements OnInit {

  @Input() state = 'card';
  @Output() handle = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {
  }

}
