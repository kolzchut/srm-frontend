import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-single-service',
  templateUrl: './single-service.component.html',
  styleUrls: ['./single-service.component.less']
})
export class SingleServiceComponent implements OnInit {

  @Input() item: any = {};

  constructor() { }

  ngOnInit(): void {
  }

  geoLink() {
    if (this.item.address) {
      return 'geo:' + this.item.address.split(' ').join('+');
    }
    return '';
  }
}
