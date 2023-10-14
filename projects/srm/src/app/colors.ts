export const CATEGORY_COLORS = [
    // categories: education, work, care, health, housing, legal, money, emergency, transit
    {category: 'health', color: '#469EB1'},
    {category: 'care', color: '#2da961'},
    {category: 'education', color: '#d067f7'},
    {category: 'legal', color: '#D0820D'},
    {category: 'work', color: '#a89400'},
    {category: 'housing', color: '#f84dc8'},
    {category: 'community_services', color: '#e96d6d'},

    {category: 'goods', color: '#a98d6f'},
    {category: 'money', color: '#a98d6f'},
    {category: 'emergency', color: '#9B0000'},
    {category: 'internal_emergency_services', color: '#9B0000'},
    {category: 'culture_and_sports', color: '#a98d6f'},
    {category: 'food', color: '#a98d6f'},
];

export const MULTIPLE_CATEGORY_COLOR = [
    {category: 'multiple', color: '#939393'},
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
