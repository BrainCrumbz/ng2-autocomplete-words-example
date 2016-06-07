import {
  Directive, Input, AfterViewInit, OnDestroy,
  DynamicComponentLoader, ElementRef, ViewContainerRef, ComponentRef
} from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';

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

    // TODO turn this into a subject/observable, so to feed it into ListDriver
    this.completions = values
      .filter(value => typeof value === 'string');
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

    this.setComponentMatches = this.noopMatches;
    this.setComponentIndex = this.noopIndex;

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
        this.setComponentIndex(currentIndex);
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
      this.getMatches.bind(this),
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
      .then(componentRef => {
        const newInstanceId = this.makeNewId();

        this.hostAriaControls = newInstanceId;

        this.matchesComponent = componentRef.instance;

        this.matchesComponent.id = newInstanceId;
        this.matchesComponent.matches = [];

        // update component inputs upon driver outputs changing
        this.setComponentMatches = matches => {
          this.matchesComponent.matches = matches;
        };

        this.setComponentIndex = index => {
          this.matchesComponent.activeIndex = index;
        };

        // forward component outputs to driver inputs, using Subject as bypass
        this.matchesComponent.select
          .subscribe((index: number) => {
            this.listIndexClickedEmitter.next(index);
          })
          .addTo(this.subscription);

        this.matchesComponent.over
          .subscribe((index: number) => {
            this.listIndexHoveredEmitter.next(index);
          })
          .addTo(this.subscription);

        return componentRef;
      });
  }

  ngOnDestroy(): void {
    if (this.componentLoadPromise) {
      this.componentLoadPromise.then(componentRef => {
        this.setComponentMatches = this.noopMatches;
        this.setComponentIndex = this.noopIndex;
        this.matchesComponent = void 0;
        this.componentLoadPromise = void 0;
        this.hostAriaControls = null;

        componentRef.destroy();
      });
    }

    this.subscription.unsubscribe();
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
    this.setListDriverMatches(matches);
    this.setComponentMatches(matches);
  }

  private setListDriverMatches(matches: string[]) {
    this.matchesEmitter.next(matches);
  }

  private noopMatches(matches: string[]) {
    // do nothing
  }

  private noopIndex(index: number) {
    // do nothing
  }

  private getMatches(text: string): Observable<string[]> {
    if (this.completions) {
      const defaultMatches = AcwAutoCompleteDirective
        .defaultSearch(this.completions, text);

      return Observable.of(defaultMatches);
    }

    if (this.findMatches) {
      return this.findMatches(text);
    }

    return Observable.of([]);
  }

  private makeNewId(): string {
    const inputId = this.elementRef.nativeElement.id;

    const idSuffix: string = inputId
      ? inputId
      : (++AcwAutoCompleteDirective.counter).toString();

    const newId = this.idPrefix + idSuffix;

    return newId;
  }

  private completions: string[];

  private findMatches: (text: string) => Observable<string[]>;

  private listDriver: AcwListDriver;

  private componentLoadPromise: Promise<ComponentRef<AcwMatchesComponent>>;

  private matchesComponent: AcwMatchesComponent;

  private matchesEmitter: Observer<string[]>;

  private keyUpEmitter: Observer<KeyboardEvent>;

  private keyDownEmitter: Observer<KeyboardEvent>;

  private listIndexClickedEmitter: Observer<number>;

  private listIndexHoveredEmitter: Observer<number>;

  private setComponentMatches: (matches: string[]) => void;

  private setComponentIndex: (index: number) => void;

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
