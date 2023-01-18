import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-branch-details-org',
  templateUrl: './branch-details-org.component.html',
  styleUrls: ['./branch-details-org.component.less']
})
export class BranchDetailsOrgComponent implements OnInit {

  @Input() card: Card;
  @Input() compact = true;

  constructor() { }

  ngOnInit(): void {
  }

}
