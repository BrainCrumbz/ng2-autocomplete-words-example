import { Observable, Subject, Subscription } from 'rxjs';

import {
  isManagedKey, isAcceptSelectionKey, isClosingKey,
  isArrowUpKey, isArrowDownKey, Disposable, limitPositive
} from './acw-utils';
import './rx-ext/Subscription/addTo';

export class AcwListDriver implements Disposable {
  constructor(
    matches$: Observable<string[]>,
    keyUp$: Observable<KeyboardEvent>,
    keyDown$: Observable<KeyboardEvent>,
    indexChangedByMouse$: Observable<number>,
    indexSelectedByClick$: Observable<number>) {

    const safeMatches$ = matches$
      .startWith([]);

    // make sure not to use this, but only the initialized one
    matches$ = null;

    const isActive$ = safeMatches$
      .map(matches => matches.length !== 0);

    let activeKeyDown$ = keyDown$
      .withLatestFrom(isActive$)
      .filter(tuple => tuple[1])
      .map(tuple => tuple[0]);

    const activeKeyUp$ = keyUp$
      .withLatestFrom(isActive$)
      .filter(tuple => tuple[1])
      .map(tuple => tuple[0]);

    // when list is visible, prevent default actions to keys custom managed
    Observable
      .merge(activeKeyDown$, activeKeyUp$)
      .filter(isManagedKey)
      .subscribe(AcwListDriver.stopEvent)
      .addTo(this.subscription);

    // make sure not to use keydown version by mistake, instead of keyup version
    activeKeyDown$ = null;

    this.currentIndex$ = safeMatches$
      .map(matches => {
        const length = matches.length;

        // when list is empty or only with one item, index can only be 0
        if (matches.length <= 1) {
          return Observable.of(0);
        }

        const initialIndex = 0;

        // it does not work if using active keyup events, and
        // there's no need anyway: logic takes care of empty match list too

        const arrowUpIndexChange$ = keyUp$
          .filter(isArrowUpKey)
          .map(_ => -1);

        const arrowDownIndexChange$ = keyUp$
          .filter(isArrowDownKey)
          .map(_ => +1);

        const arrowKeyIndexChange$ = Observable
          .merge(arrowUpIndexChange$, arrowDownIndexChange$);

        const arrowKeyIndex$ = arrowKeyIndexChange$
          .scan((acc, change) => {
            const index = limitPositive(acc + change, length);

            return index;

          }, initialIndex)
          .startWith(0);

        return arrowKeyIndex$;
      })
      .switch()
      .merge(indexChangedByMouse$)
      .share();

    this.doClose$ = activeKeyUp$
      .filter(isClosingKey)
      .map(_ => null as void);

    const selectByKey$ = activeKeyUp$
      .filter(isAcceptSelectionKey);

    const indexSelectedByKey$ = this.currentIndex$
      .sample(selectByKey$);

    const indexSelected$ = Observable
      .merge(indexSelectedByKey$, indexSelectedByClick$);

    this.selectedMatch$ = indexSelected$
      .withLatestFrom(safeMatches$, (currentIndex, matches) => {
        const match = matches[currentIndex];

        return match;
      });
  }

  dispose(): void {
    this.subscription.unsubscribe();
  }

  currentIndex$: Observable<number>;

  selectedMatch$: Observable<string>;

  doClose$: Observable<void>;

  private static stopEvent(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private subscription: Subscription = new Subscription();
}
