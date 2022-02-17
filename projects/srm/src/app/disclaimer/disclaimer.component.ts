import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-disclaimer',
  templateUrl: './disclaimer.component.html',
  styleUrls: ['./disclaimer.component.less']
})
export class DisclaimerComponent implements OnInit {

  dontshow = false;

  @Output() closed = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
  }

}
