import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../consts';
import { LayoutService } from '../layout.service';

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
  @Input() compact = true;
  @Input() landingPage = false;

  constructor(public layout: LayoutService) { }

  ngOnInit(): void {
  }

}
