import { Component, Input, OnInit } from '@angular/core';
import { TaxonomyGroup } from '../../../common/datatypes';
import { SituationsService, TaxonomyGroupEditor } from '../../../situations.service';

@Component({
  selector: 'app-situation-editor',
  templateUrl: './situation-editor.component.html',
  styleUrls: ['./situation-editor.component.less'],
  host: {
    '[class.active]': 'editor.active'
  }
})
export class SituationEditorComponent implements OnInit {

  @Input() editor: TaxonomyGroupEditor;

  constructor(public situations: SituationsService) { }

  ngOnInit(): void {
  }

  back(ev: Event) {
    ev.stopPropagation();
    this.situations.popEditor();
  }

  checkedImage(item: TaxonomyGroup) {
    if (this.situations.checked(item)) {
      return 'assets/img/icon-checkbox.svg';
    } else {
      return 'assets/img/icon-unchecked-box.svg';
    }
  }

  checkItem(item: TaxonomyGroup, ev: Event) {
    this.situations.check(item);
  }
}
