import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-branch-header',
  templateUrl: './branch-header.component.html',
  styleUrls: ['./branch-header.component.less']
})
export class BranchHeaderComponent implements OnInit {

  @Input() card: Card | null;
  @Input() link: string[] | null;
  @Input() cardId: string;
  @Input() pointId: string;

  constructor() { }

  ngOnInit(): void {
  }

}
