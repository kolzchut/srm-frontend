import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-branch-details-address',
  templateUrl: './branch-details-address.component.html',
  styleUrls: ['./branch-details-address.component.less']
})
export class BranchDetailsAddressComponent implements OnInit {

  @Input() card: Card;

  constructor() { }

  ngOnInit(): void {
  }

}
