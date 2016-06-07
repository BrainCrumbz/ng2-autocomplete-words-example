import { Observable, Subject, Subscription } from 'rxjs';

import {
  isManagedKey, isAcceptSelectionKey, isClosingKey,
  isArrowUpKey, isArrowDownKey, Disposable
} from './acw-utils';

export class AcwListDriver implements Disposable {
  constructor(
    matches$: Observable<string[]>,
    keyUp$: Observable<KeyboardEvent>,
    keyDown$: Observable<KeyboardEvent>,
    indexChangedByMouse$: Observable<number>,
    indexSelectedByClick$: Observable<number>) {

    // TODO cancel completion on lost focus (maybe this in parent directive)
    // TODO FIX when closing, matches are forced to empty, but driver still thinks is active
    // TODO FIX when new matches arrive, index is still the same. It seems like new matches
    // are not detected

    const safeMatches$ = matches$
      .startWith([]);

    // make sure not to use this, but only the initialized one
    matches$ = null;

    const isActive$ = safeMatches$
      .map(matches => matches.length !== 0);

    const activeKeyDown$ = keyDown$
      .withLatestFrom(isActive$)
      .filter(tuple => tuple[1])
      .map(tuple => tuple[0]);

    const activeKeyUp$ = keyUp$
      .withLatestFrom(isActive$)
      .filter(tuple => tuple[1])
      .map(tuple => tuple[0]);

    // when list is visible prevent default actions by keys managed later, during keyup event
    activeKeyDown$
      .filter(isManagedKey)
      .subscribe(AcwListDriver.stopEvent)
      .addTo(this.subscription);

    // when list is visible prevent default actions by keys managed now, during keyup event
    activeKeyUp$
      .filter(isManagedKey)
      .subscribe(AcwListDriver.stopEvent)
      .addTo(this.subscription);

    const indexReset$ = safeMatches$
      .filter(matches => matches.length > 0)
      .map(_ => 0);

    const arrowUpIndexChange$ = activeKeyUp$
      .filter(isArrowUpKey)
      .map(_ => -1);

    const arrowDownIndexChange$ = activeKeyUp$
      .filter(isArrowDownKey)
      .map(_ => +1);

    this.currentIndex$ = Observable
      .merge(arrowUpIndexChange$, arrowDownIndexChange$)
      .withLatestFrom(safeMatches$)
      .scan((acc, tuple) => {
        const change: number = tuple[0];
        const length: number = tuple[1].length;

        let index = acc + change;

        if (index < 0) {
          index = 0;
        } else if (!(index < length)) {
          index = length - 1;
        }

        return index;
      }, 0)
      .merge(indexChangedByMouse$, indexReset$)
      .startWith(0);

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
