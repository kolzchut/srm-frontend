import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { TaxonomyItem } from '../consts';
import { PlatformService } from '../platform.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.less']
})
export class HomepageComponent implements OnInit, AfterViewInit {

  slide_ = 0;
  numSituations = 0;
  numResponses = 0;
  totalServices = 0;

  seenOnce = [true, false, false, false];
  obs: IntersectionObserver | null = null;

  responses: TaxonomyItem[] = [];
  situations: TaxonomyItem[] = [];

  RESPONSE_IDS = [
    'care:navigating_the_system',
    'housing:residential_housing:long_term_housing',
    'health',
    'food',
    'work:special_employment:supported_employment',
    'community_services',
    'health:mental_health_care',
    'housing',
    'money',     
  ];
  SITUATION_IDS = [
    'age_group:seniors',
    'disability',
    'health',
    'disability:mental_illness',
    'age_group:teens',
    'benefit_holders:holocaust_survivors',
    'language:arabic_speaking',
    'role:family_caregivers',
    'gender:women',
  ];
  PLACES = [
    'ירושלים',
    'תל אביב',
    'אילת',
    'קרית שמונה',
    'נצרת',
    'מודיעין עלית',
    'שלומי',
    'אם אל פחם',
    'חיפה',
  ];

  constructor(private api: ApiService, private platform: PlatformService, private el: ElementRef) {
    api.getSituations().subscribe((situations) => {
      console.log(situations);
      this.numSituations = situations.length;
      for (const sid of this.SITUATION_IDS) {
        const situation = situations.find((s) => s.id === 'human_situations:' + sid);
        if (situation) {
          this.situations.push(situation);
        }
      }
      console.log(this.responses);
    });
    api.getResponses().subscribe((responses) => {
      this.numResponses = responses.length;
      for (const rid of this.RESPONSE_IDS) {
        const response = responses.find((r) => r.id === 'human_services:' + rid);
        if (response) {
          this.responses.push(response);
        }
      }
      console.log(this.responses);
    });
    api.getTotalServices().subscribe((total) => {
      console.log(total);
      this.totalServices = total;
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
      this.setupObserver();
  }

  setupObserver(): void {
    this.platform.browser(() => {
      this.obs?.disconnect();
      this.obs = null;
      this.obs = new IntersectionObserver((entries) => {
        const intersecting = entries.filter(e => e.isIntersecting);
        if (intersecting.length > 0) {
          const target = intersecting[0].target as HTMLElement;
          const slide = parseInt(target.getAttribute('data-slide') || '0', 10);
          this.slide_ = slide;
          if (slide >= 0 && slide < this.seenOnce.length) {
            this.seenOnce[slide] = true;
          }
        }
      }, {threshold: 0.5});
      this.el.nativeElement?.querySelectorAll('.slide').forEach((el: HTMLElement) => {
        this.obs?.observe(el);
      });
    });
  }

  get slide(): number {
    return this.slide_;
  }

  set slide(slide: number) {
    this.slide_ = slide;
    this.el.nativeElement?.querySelectorAll(`.slide[data-slide='${slide}']`).forEach((el: HTMLElement) => {
      el.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'nearest'});
    });
  }

  prepare(s?: string) {
    return s?.split(' ').join('_') || '_';
  }
}
