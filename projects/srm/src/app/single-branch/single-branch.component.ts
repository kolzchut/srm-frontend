import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Card} from "../consts";
import ariaLabel from "../../services/result-stack-utilities/ariaLabelBuilder";
import {ActivatedRoute, Router} from "@angular/router";
import StringsBuilder from "../../services/result-stack-utilities/stringsBuilder";

@Component({
  selector: 'app-single-branch',
  templateUrl: './single-branch.component.html',
  styleUrl: './single-branch.component.less'
})
export class SingleBranchComponent implements OnInit  {
  @Output() hoverCard = new EventEmitter<Card>();
  @Input() org: { key: string, vals: Card[], isDisplayed: boolean, maxDisplayCount: number }
  @Input() index = 0;
  singleBranch = {card_id: ""} as Card;
  constructor(private router: Router,private route: ActivatedRoute) { }

  ngOnInit(): void {
    if (!this.org) {
      throw new Error('Branch input is required');
    }
    if (!this.org.key || !Array.isArray(this.org.vals)) {
      throw new Error('Branch must have a valid key and vals array');
    }
    this.singleBranch = this.org.vals[0];
  }
  selectedItem(event: Event, card: Card, from: string, extra?: any) {
    event.preventDefault();
    let card_ = card;
    if (extra) {
      card_ = Object.assign({}, card, extra);
    }
    this.router.navigate(['c', card_.card_id], {
      relativeTo: this.route,
      queryParams: {li: this.index  || 0, from},
      queryParamsHandling: 'merge',
      preserveFragment: true
    });
    return false;
  }

  protected readonly ariaLabel = ariaLabel;
  protected readonly stringsBuilder = StringsBuilder;
}
