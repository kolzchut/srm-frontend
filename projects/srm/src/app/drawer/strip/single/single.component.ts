import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-strip-single',
  templateUrl: './single.component.html',
  styleUrls: ['./single.component.less']
})
export class SingleComponent implements OnInit {

  @Input() service: any;
  @Output() selected = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

}
