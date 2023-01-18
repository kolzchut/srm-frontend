import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-branch-details',
  templateUrl: './branch-details.component.html',
  styleUrls: ['./branch-details.component.less']
})
export class BranchDetailsComponent implements OnInit {

  @Input() card: Card;
  @Input() compact = true;

  constructor() { }

  ngOnInit(): void {
  }

}
