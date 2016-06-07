import { Observable, Subject, Subscription } from 'rxjs';

import {
  isManagedKey, isAcceptSelectionKey, isArrowUpKey, isArrowDownKey, isEscKey,
  Disposable
} from './acw-utils';

export class AcwListDriver implements Disposable {
  constructor(
    matches$: Observable<string[]>,
    keyUp$: Observable<KeyboardEvent>,
    keyDown$: Observable<KeyboardEvent>,
    indexChangedByMouse$: Observable<number>,
    indexSelectedByClick$: Observable<number>) {

    // TODO cancel completion on left arrow
    // TODO cancel completion on lost focus (maybe this in parent directive)

    const isActive$ = matches$
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

    const indexReset$ = matches$
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
      .scan((acc, change) => acc + change, 0)
      .withLatestFrom(matches$)
      .filter(tuple => {
        const index: number = tuple[0];
        const matches: string[] = tuple[1];

        return (0 <= index && index < matches.length);
      })
      .map(tuple => tuple[0])
      .merge(indexChangedByMouse$, indexReset$);

    this.doClose$ = activeKeyUp$
      .filter(isEscKey)
      .map(_ => null as void);

    const selectByKey$ = activeKeyUp$
      .filter(isAcceptSelectionKey);

    const indexSelectedByKey$ = this.currentIndex$
      .sample(selectByKey$);

    const indexSelected$ = Observable
      .merge(indexSelectedByKey$, indexSelectedByClick$);

    this.selectedMatch$ = indexSelected$
      .withLatestFrom(matches$, (currentIndex, matches) => {
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
