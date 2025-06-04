import {Card} from "../../app/consts";

const ariaLabel = (card: Card)=> {
  let ret = '';
  if (card.national_service) {
    ret += 'שירות ארצי: ';
  } else if (card.branch_city) {
    ret += card.branch_city + ' ';
  }
  ret += card.service_name;
  if (card.branch_operating_unit) {
    ret += ' של ' + card.branch_operating_unit;
  } else if (card.organization_name_parts?.primary) {
    ret += ' של ' + card.organization_name_parts.primary;
  } else if (card.organization_short_name) {
    ret += ' של ' + card.organization_short_name;
  }
  ret += ' - פתיחת עמוד השירות';
  return ret;
}
export default ariaLabel;
