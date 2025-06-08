import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-branch-details-address',
  templateUrl: './branch-details-address.component.html',
  styleUrls: ['./branch-details-address.component.less']
})
export class BranchDetailsAddressComponent implements OnInit {

  @Input() card: Card;

  @Input() compact = true;
  public addressToDisplay: string;
  constructor() { }

  ngOnInit(): void {
    this.addressToDisplay = this.card?.address_parts?.primary.replace(',', '') || "";
  }

}
