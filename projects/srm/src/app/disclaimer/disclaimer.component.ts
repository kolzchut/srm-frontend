import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-disclaimer',
  templateUrl: './disclaimer.component.html',
  styleUrls: ['./disclaimer.component.less']
})
export class DisclaimerComponent implements OnInit {

  dontshow = false;
  uid = 'dontshow-' + Math.random().toString(36).substring(2);

  @Output() closed = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
  }

}
