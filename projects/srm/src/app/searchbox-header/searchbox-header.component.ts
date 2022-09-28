import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-searchbox-header',
  templateUrl: './searchbox-header.component.html',
  styleUrls: ['./searchbox-header.component.less']
})
export class SearchboxHeaderComponent implements OnInit {

  @Input() query = '';

  constructor() { }

  ngOnInit(): void {
  }

}
