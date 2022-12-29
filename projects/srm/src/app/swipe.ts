import { EMPTY, first, fromEvent, map, switchMap } from "rxjs";

export function swipe(el: HTMLElement) {
  return switchMap((e: TouchEvent) => {
    const contentTop = el?.getBoundingClientRect().top;
    const startY = e.changedTouches[0].clientY;
    if (startY > contentTop && startY < contentTop + 56) {
      const startTimestamp = e.timeStamp;
      console.log('GESTURE START', startY);
      return fromEvent<TouchEvent>(document, 'touchend').pipe(
        first(),
        map((e: TouchEvent) => {
          const endY = e.changedTouches[0].clientY;
          const endTimestamp = e.timeStamp;
          console.log('GESTURE END', endY);
          if (endTimestamp - startTimestamp < 500 && Math.abs(endY - startY) > 100) {
            return endY - startY;
          } else {
            return 0;
          }
        })
      );
    } else {
      return EMPTY;
    }
  });
}