import { Component } from '@angular/core';
import { HomepageEntry } from '../consts';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-home-links',
  templateUrl: './home-links.component.html',
  styleUrl: './home-links.component.less'
})
export class HomeLinksComponent {
  groups: {
    title: string,
    query: string,
    group_link: string,
    items: HomepageEntry[]
  }[] = [];

  constructor(private api: ApiService) {
    api.getHomepage().subscribe((homepage: HomepageEntry[]) => {
      const groupMap = new Map<string, HomepageEntry[]>();
      homepage.forEach((entry) => {
        if (!groupMap.has(entry.group)) {
          groupMap.set(entry.group, []);
          this.groups.push({
            title: entry.group,
            query: entry.query,
            group_link: entry.group_link,
            items: groupMap.get(entry.group)!,
          });
        }
        if (entry.title) {
          groupMap.get(entry.group)!.push(entry);
        }
      });
    });
  }
}
