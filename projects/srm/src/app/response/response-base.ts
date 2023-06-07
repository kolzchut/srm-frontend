import { getResponseIdColor } from "../colors";
import { TaxonomyItem } from "../consts";

export class ResponseBase {

  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  pointBorderColor: string;
  pointBgColor: string;
  linkColor: string;
  linkBgColor: string;
  fontWeight = 400;
  hover_ = false;

  initColors(response?: TaxonomyItem) {
    this.color = getResponseIdColor(response?.id || null);
  }

  recalcColors(): void {
    if (this.hover) {
      this.textColor = '#333231';
      this.bgColor = this.shade(10);
      this.borderColor = this.shade(30);
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.textColor;
      this.linkBgColor = this.shade(42);
      this.fontWeight = 300;
    } else {
      this.textColor = '#333231';
      this.bgColor = this.shade(5);
      this.borderColor = this.shade(20);
      this.pointBorderColor = '#fff';
      this.pointBgColor = this.color;
      this.linkColor = this.shade(70);
      this.linkBgColor = this.bgColor;
      this.fontWeight = 300;
    }
  }

  shade(opacity: number) {
    opacity = Math.ceil(opacity * 2.55);
    let hex = opacity.toString(16);
    if (hex.length === 1) {
      hex = '0' + hex;
    }
    return this.color + hex;
  }
  
  public set hover(value: boolean) {
    this.hover_ = value;
    this.recalcColors();
  }

  get hover() {
    return this.hover_;
  }

}