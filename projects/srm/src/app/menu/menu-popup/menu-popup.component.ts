import { Location } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { timer } from 'rxjs';

@Component({
  selector: 'app-menu-popup',
  templateUrl: './menu-popup.component.html',
  styleUrls: ['./menu-popup.component.less'],
})
export class MenuPopupComponent implements OnInit {

  @Input() title: string;
  @Input() subtitle: string;

  constructor(private location: Location) { }

  ngOnInit(): void {
  }

  closeMe() {
    this.location.back();
  }
}
