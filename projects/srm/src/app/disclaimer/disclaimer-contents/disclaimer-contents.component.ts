import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-disclaimer-contents',
  templateUrl: './disclaimer-contents.component.html',
  styleUrls: ['./disclaimer-contents.component.less']
})
export class DisclaimerContentsComponent implements OnInit {

  _dontshowAux = false;
  uid = 'dontshow-' + Math.random().toString(36).substring(2);

  @Input() about = false;
  @Output() dontshow = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
  }

  set dontshowAux(value: boolean) {
    this._dontshowAux = value;
    this.dontshow.next(value);
  }

  get dontshowAux(): boolean {
    return this._dontshowAux;
  }
  
}
