// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  servicesURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/cards',
  countCategoriesURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/count',
  searchQueryURL: '',
  searchQueryMock: {
    search_results: [
      {type: 'response', source: {name: '<em>כפר</em> גמילה', count: 14}},
      {type: 'response', source: {name: '<em>כפר</em> מוגן', count: 9}},
      {type: 'response', source: {name: '<em>כפר</em> אולימפי', count: 2}},
      {type: 'place', source: {name: '<em>כפר</em> סבא'}},
      {type: 'place', source: {name: '<em>כפר</em> סאלד'}},
      {type: 'place', source: {name: '<em>כפר</em> קאסם'}},
      {type: 'service', source: {
          service_name: '<em>כפר</em> שיקום גראבסקי',
          address: 'הניצנים 7, מגדל העמק',
          description: 'מסגרת דיור טיפולית-שיקומית בקהילה המיועדת לתת מענה מותאם לאנשים עם מוגבלות בכל תחומי החיים.ישנם הוסטלים עבור ילדים/בוגרים בתפקודים ברמות שונות, המקדמים השתלבות בקהילה עד כמה שניתן.',
          urls: [
            {
              link: 'https://www.guidestar.org.il/organization/580324408',
              title: 'הארגון בגיידסטאר'  
            }
          ],
          responses: [
            {
              id: 'human_services:care:residential_care',
              category: 'care',
              name: 'מסגרות טיפוליות'
            }
          ]
        }
      },
      {type: 'service', source: {
          service_name: 'מעון הבית בחולון',
          address: 'רחל 12, <em>כפר</em> סבא, ישראל',
          phone_number: '03-5553434',
          description: 'מסגרת דיור טיפולית-שיקומית בקהילה המיועדת לתת מענה מותאם לאנשים עם מוגבלות בכל תחומי החיים.ישנם הוסטלים עבור ילדים/בוגרים בתפקודים ברמות שונות, המקדמים השתלבות בקהילה עד כמה שניתן.',
          details: 'מסגרת דיור המאפשרת לאנשים עם מוגבלות להשתלב בקהילה בכל תחומי החיים (תעסוקה, בריאות, פנאי, חברה, תרבות, שימוש במשאבי קהילה). מסגרת דיור טיפולית-שיקומית בקהילה המיועדת לתת מענה מותאם לאנשים עם מוגבלות בכל תחומי החיים.זמני הפעילות: המסגרות פועלות 365 ימים בשנה.מספר הדיירים במסגרת: המסגרת מיועדת לעד 24 דיירים, ופועלת בדרך כלל  במספר יחידות דיור.השירותים במסגרת כולליםשירותים פיזיים: טיפול פיזי, היגיינה אישית, כלכלה, תנאים פיזיים - מבנה, שירותי אחזקה, תשתיות וציוד. שירותים ומשאבי קהילה בתחומים: תעסוקה, פנאי, רפואה ועוד. תוכנית אישית: לכל דייר נבנית ומופעלת תוכנית אישית שמטרתה לסייע בשיפור מיומנויות תפקודיות שונות ולפתח עצמאות מרבית ככל הניתן.מסגרת דיור בתוך הקהילה, המסגרת מתוקצבת עבור 16 שעות ביממה והדייר זכאי לתקצוב נוסף לתחום התעסוקה. הדיור מיועד אנשים עם מוגבלות ברמות תפקוד שונות שמסוגלים להשתלב במסגרות דיור בקהילה, וזקוקים לרוב לליווי ותמיכה ברמה בינונית. המסגרות מהוות בתים לחיים - משך השהות במסגרת אינו מוגבל ואדם עם מוגבלות יכול להישאר במסגרת זו כל עוד היא תואמת את צרכיו ורצונותיו.',
          urls: [],
          responses: [
            {
              id: 'human_services:care:residential_care',
              category: 'care',
              name: 'מסגרות טיפוליות'
            }
          ],
          payment: true,
        },
      },
      {type: 'service', source: {
          service_name: '<em>כפר</em> שיקום גראבסקי',
          address: 'הניצנים 7, מגדל העמק',
          description: 'מסגרת דיור טיפולית-שיקומית בקהילה המיועדת לתת מענה מותאם לאנשים עם מוגבלות בכל תחומי החיים.ישנם הוסטלים עבור ילדים/בוגרים בתפקודים ברמות שונות, המקדמים השתלבות בקהילה עד כמה שניתן.',
          urls: [
            {
              link: 'https://www.guidestar.org.il/organization/580324408',
              title: 'הארגון בגיידסטאר'  
            }
          ],
          responses: [
            {
              id: 'human_services:care:residential_care',
              category: 'care',
              name: 'מסגרות טיפוליות'
            }
          ]
        }
      },
    ]
  }

};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
