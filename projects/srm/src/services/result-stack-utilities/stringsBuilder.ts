import {_h, Card} from "../../app/consts";

const branchInfo = (card: Card):string => {
  if (card.national_service) return 'שירות ארצי';
  const primary = _h(card.address_parts, 'primary');
  const secondary = _h(card.address_parts, 'secondary');
  if (primary) {
    if (secondary) return `${primary}, ${secondary}`;
    return primary;
  }
  return _h(card, 'branch_address');
};

const branchName = ({branch_name}: Card): string => {
  if (!branch_name) return "";
  return ` ${branch_name}`;
};

const orgName = (card: Card): string => {
  return _h(card, 'branch_operating_unit') || _h(card.organization_name_parts, 'primary') || _h(card, 'organization_short_name') || _h(card, 'organization_name');
};

export default {branchInfo, branchName, orgName};
