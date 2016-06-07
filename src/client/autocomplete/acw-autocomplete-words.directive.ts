import {
  Directive, Input, AfterViewInit, OnDestroy,
  DynamicComponentLoader, ElementRef, ViewContainerRef, ComponentRef
} from '@angular/core';
import { Observable, Observer, ReplaySubject, Subject, Subscription } from 'rxjs';

import { AcwMatchesDynamicWrapper } from './acw-matches-dynamic-wrapper';
import { AcwMatchesComponent } from './acw-matches.component';
import { AcwInputDriver } from './acw-input-driver';
import { AcwListDriver } from './acw-list-driver';
import './rx-ext/Subscription/addTo';

type SearchFn = (text: string) => Observable<string[]>;

@Directive({
  selector: '[acwAutocompleteWords]',
  host: {
    '(keyup)': 'onKeyUp($event)',
    '(keydown)': 'onKeyDown($event)',
    'aria-haspopup': 'true',
    '[attr.aria-controls]': 'hostAriaControls',
  },
})
export class AcwAutoCompleteDirective implements AfterViewInit, OnDestroy {

  @Input() set acwAutocompleteWords(values: string[]) {
    if (!values || !Array.isArray(values)) {
      values = [];
    }

    const textValues = values
      .filter(value => typeof value === 'string');

    this.completionsEmitter.next(textValues);
  }

  get acwAutocompleteWords(): string[] {
    throw new Error('\'acwAutocompleteWords\' property is write-only, cannot be read');
  }

  @Input() set acwSearch(value: SearchFn) {
    if (!value || typeof value !== 'function') {
      value = this.noopSearch;
    }

    this.findMatches = value;
  }

  get acwSearch(): SearchFn {
    throw new Error('\'acwSearch\' property is write-only, cannot be read');
  }

  @Input('acwMinLength') minWordLength: number = 2;

  @Input('acwDebounce') debounceMs: number = 200;

  constructor(
    private elementRef: ElementRef,
    private componentLoader: DynamicComponentLoader,
    private viewContainerRef: ViewContainerRef) {

    // TODO cancel completion when neither input nor list is focused

    this.matchesComponentWrapper = new AcwMatchesDynamicWrapper();
    this.shouldUnsubscribeFromWrapper = false;

    // remember last value for late subscribers
    const completionsSubject = new ReplaySubject<string[]>(1);
    this.completions$ = completionsSubject.asObservable();
    this.completionsEmitter = completionsSubject;

    const matchesSubject = new Subject<string[]>();
    const keyUpSubject = new Subject<KeyboardEvent>();
    const keyDownSubject = new Subject<KeyboardEvent>();
    const listIndexClickedSubject = new Subject<number>();
    const listIndexHoveredSubject = new Subject<number>();

    this.matchesEmitter = matchesSubject;
    this.keyUpEmitter = keyUpSubject;
    this.keyDownEmitter = keyDownSubject;
    this.listIndexClickedEmitter = listIndexClickedSubject;
    this.listIndexHoveredEmitter = listIndexHoveredSubject;

    this.listDriver = new AcwListDriver(
      matchesSubject.asObservable(),
      keyUpSubject.asObservable(),
      keyDownSubject.asObservable(),
      listIndexHoveredSubject.asObservable(),
      listIndexClickedSubject.asObservable());

    this.subscription.add(() => this.listDriver.dispose());

    this.listDriver.currentIndex$
      .subscribe(currentIndex => {
        this.matchesComponentWrapper.index = currentIndex;
      })
      .addTo(this.subscription);

    this.listDriver.doClose$
      .subscribe(_ => {
        this.setMatches([]);
      })
      .addTo(this.subscription);

    const inputDriver = new AcwInputDriver(
      keyUpSubject.asObservable(),
      this.listDriver.selectedMatch$,
      text => this.getMatches(text),
      {
        debounceMs: this.debounceMs,
        minWordLength: this.minWordLength,
      });

    inputDriver.matches$
      .subscribe(matches => {
        this.setMatches(matches);
      })
      .addTo(this.subscription);

    inputDriver.text$
      .subscribe(text => {
        // let list container close
        this.setMatches([]);

        // could not find another way to set value without
        // overwriting the one set from client code
        this.elementRef.nativeElement.value = text;

        // when selected by mouse click, give back focus to field
        const inputHasFocus = (this.elementRef.nativeElement === document.activeElement);

        if (!inputHasFocus) {
          this.elementRef.nativeElement.focus();
        }
      })
      .addTo(this.subscription);
  }

  ngAfterViewInit(): void {
    this.componentLoadPromise = this.componentLoader
      .loadNextToLocation(AcwMatchesComponent, this.viewContainerRef)
      .then((componentRef: ComponentRef<AcwMatchesComponent>) => {
        if (this.shouldUnsubscribeFromWrapper) {
          throw new Error(
            'Cannot load another instance, previous one should be unsubscribed first.');
        }

        const newInstanceId = this.makeNewId();

        this.hostAriaControls = newInstanceId;

        // inform dynamic wrapper with newly loaded component
        this.matchesComponentWrapper.load(componentRef);

        // set initial inputs
        this.matchesComponentWrapper.id = newInstanceId;
        this.matchesComponentWrapper.matches = [];

        // forward component outputs to driver inputs, using intermediate Observers
        this.matchesComponentWrapper.select
          .subscribe((index: number) => {
            this.listIndexClickedEmitter.next(index);
          })
          .addTo(this.subscription);

        this.matchesComponentWrapper.over
          .subscribe((index: number) => {
            this.listIndexHoveredEmitter.next(index);
          })
          .addTo(this.subscription);

        // NOTE: those subscriptions should be unsubscribed before loading again
        // another instance, but this does not happen at the moment. They are
        // unsubscribed with all the others during directive destruction.
        this.shouldUnsubscribeFromWrapper = true;
      });
  }

  ngOnDestroy(): void {
    if (this.componentLoadPromise) {
      this.componentLoadPromise.then(_ => {
        this.componentLoadPromise = null;
        this.hostAriaControls = null;

        this.matchesComponentWrapper.unload();
      });
    }

    this.subscription.unsubscribe();
    this.shouldUnsubscribeFromWrapper = false;
  }

  // Bound to view

  onKeyUp(event: KeyboardEvent): void {
    this.keyUpEmitter.next(event);
  }

  onKeyDown(event: KeyboardEvent): void {
    this.keyDownEmitter.next(event);
  }

  hostAriaControls: string;

  private setMatches(matches: string[]) {
    this.matchesEmitter.next(matches);
    this.matchesComponentWrapper.matches = matches;
  }

  private getMatches(text: string): Observable<string[]> {
    if (this.findMatches) {
      return this.findMatches(text);
    }

    const matches$ = Observable.of(text)
      .withLatestFrom(this.completions$)
      .map(tuple => {
        return AcwAutoCompleteDirective
          .defaultSearch(tuple[1], tuple[0]);
      });

    return matches$;
  }

  private makeNewId(): string {
    const inputId = this.elementRef.nativeElement.id;

    const idSuffix: string = inputId
      ? inputId
      : (++AcwAutoCompleteDirective.counter).toString();

    const newId = this.idPrefix + idSuffix;

    return newId;
  }

  private completionsEmitter: Subject<string[]>;
  private completions$: Observable<string[]>;

  private findMatches: (text: string) => Observable<string[]>;

  private listDriver: AcwListDriver;

  private componentLoadPromise: Promise<void>;

  private matchesComponentWrapper: AcwMatchesDynamicWrapper;

  private shouldUnsubscribeFromWrapper: boolean;

  private matchesEmitter: Observer<string[]>;

  private keyUpEmitter: Observer<KeyboardEvent>;

  private keyDownEmitter: Observer<KeyboardEvent>;

  private listIndexClickedEmitter: Observer<number>;

  private listIndexHoveredEmitter: Observer<number>;

  private noopSearch: SearchFn = _ => Observable.of([]);

  private subscription: Subscription = new Subscription();

  private idPrefix = 'acw-matches-';

  private static counter: number = 0;

  private static defaultSearch(
    completions: string[], text: string): string[] {

    // performs a case insensitive search,
    // looking for items starting with given text

    const lowerCaseText = text.toLocaleLowerCase();

    const matchingCompletions = completions
      .filter(completion => completion.toLocaleLowerCase().startsWith(lowerCaseText));

    return matchingCompletions;
  }
}
