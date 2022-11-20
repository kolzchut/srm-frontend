export const CATEGORY_COLORS = [
    // categories: education, work, care, health, housing, legal, money, emergency, transit
    {category: 'health', color: '#07B2EA'},
    {category: 'care', color: '#27AE60'},
    {category: 'education', color: '#BB6BD9'},
    {category: 'legal', color: '#F2994A'},
    {category: 'work', color: '#F2C94C'},

    {category: 'goods', color: '#9B51E0'},
    {category: 'housing', color: '#EB3CBA'},
    {category: 'community_services', color: '#EB5757'},

    {category: 'money', color: '#a6761d'},
    {category: 'emergency', color: '#a6761d'},
    {category: 'culture_and_sports', color: '#a6761d'},
    {category: 'food', color: '#a6761d'},
];

export const MULTIPLE_CATEGORY_COLOR = [
    {category: 'multiple', color: '#4F4F4F'},
];

export const ALL_CATEGORIES = [...CATEGORY_COLORS, ...MULTIPLE_CATEGORY_COLOR];

export const CATEGORY_COLORS_MAP: any = CATEGORY_COLORS.reduce((obj: any, cat) => {
    obj[cat.category] = cat.color;  
    return obj
}, {})

export function getResponseCategoryColor(category: string) {
    return CATEGORY_COLORS_MAP[category] || MULTIPLE_CATEGORY_COLOR[0].color;
}

export function getResponseIdColor(id: string | null) {
    const category = id?.split(':')[1] || '';
    return getResponseCategoryColor(category);
}

export const SITUATIONS_PREFIX = 'human_situations:';