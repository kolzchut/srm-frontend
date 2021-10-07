export const CATEGORY_COLORS = [
    // categories: education, work, care, health, housing, legal, money, emergency, transit
    {category: 'education', color: '#9b51e0'},
    {category: 'work', color: '#f2994a'},
    {category: 'care', color: '#27ae60'},
    {category: 'health', color: '#eb3cba'},

    {category: 'housing', color: '#a0a164'},
    {category: 'legal', color: '#a0a164'},
    {category: 'money', color: '#a0a164'},
    {category: 'emergency', color: '#a0a164'},
    {category: 'transit', color: '#a0a164'},
]
export const MULTIPLE_CATEGORY_COLOR = [
    {category: 'multiple', color: '#4F4F4F'},
];

export const ALL_CATEGORIES = [...CATEGORY_COLORS, ...MULTIPLE_CATEGORY_COLOR];

export function getResponseColor(id: string) {
    const category = id.split(':')[1];
    for (const cc of CATEGORY_COLORS) {
        if (cc.category === category) {
            return cc.color;
        }
    }
    return MULTIPLE_CATEGORY_COLOR[0].color;
}