import {
  Directive, Input, AfterViewInit, OnDestroy,
  DynamicComponentLoader, ElementRef, ViewContainerRef, ComponentRef
} from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { AcwMatchesComponent } from './acw-matches.component';
import { AcwInputDriver } from './acw-input-driver';

type SearchFn = (text: string) => Observable<string[]>;

@Directive({
  selector: '[acwAutocompleteWords]',
  host: {
    '(keyup)': 'onKeyUp($event)',
    'aria-haspopup': 'true',
    '[attr.aria-controls]': 'hostAriaControls',
  },
})
export class AcwAutoCompleteDirective {

  @Input() set acwAutocompleteWords(values: string[]) {
    if (!values || !Array.isArray(values)) {
      values = [];
    }

    this.completions = values
      .filter(value => typeof value === 'string');
  }

  @Input() set acwSearch(value: SearchFn) {
    if (!value || typeof value !== 'function') {
      value = this.noopSearch;
    }

    this.findMatches = value;
  }

  @Input('acwMinLength') minWordLength: number = 2;

  @Input('acwDebounce') debounceMs: number = 200;

  constructor(
    private elementRef: ElementRef,
    private componentLoader: DynamicComponentLoader,
    private viewContainerRef: ViewContainerRef) {

    this.setMatches = this.noop;

    this.keyUpSubject = new Subject<KeyboardEvent>();
    this.matchSelectedSubject = new Subject<string>();

    const escPressed$ = this.keyUpSubject
      .filter(event => event.keyCode === 27)
      .do(event => event.preventDefault());

    const arrowUpPressed$ = this.keyUpSubject
      .filter(event => event.keyCode === 38)
      .do(event => event.preventDefault());

    const arrowDownPressed$ = this.keyUpSubject
      .filter(event => event.keyCode === 40)
      .do(event => event.preventDefault());

    const enterPressed$ = this.keyUpSubject
      .filter(event => event.keyCode === 13)
      .do(event => event.preventDefault());

    const tabPressed$ = this.keyUpSubject
      .filter(event => event.keyCode === 9 && !event.shiftKey
        && !event.ctrlKey && !event.key)
      .do(event => event.preventDefault());

    const inputDriver = new AcwInputDriver(
      this.keyUpSubject,
      this.matchSelectedSubject,
      this.getMatches.bind(this),
      {
        debounceMs: this.debounceMs,
        minWordLength: this.minWordLength,
      });

    inputDriver.matches$
      .subscribe(completions => {
        this.setMatches(completions);
      });

    inputDriver.text$.subscribe(text => {
      this.elementRef.nativeElement.value = text;

      this.setMatches([]);
    });
  }

  ngAfterViewInit(): void {
    this.componentLoadPromise = this.componentLoader
      .loadNextToLocation(AcwMatchesComponent, this.viewContainerRef)
      .then(componentRef => {
        const newInstanceId = this.makeNewId();

        this.matchesComponent = componentRef.instance;

        this.matchesComponent.id = newInstanceId;
        this.matchesComponent.matches = [];
        this.hostAriaControls = newInstanceId;

        this.setMatches = value => {
          this.matchesComponent.matches = value;
        };

        this.matchesComponent.selectItem
          .subscribe((match: string) => {
            this.matchSelectedSubject.next(match);
          });

        return componentRef;
      });
  }

  ngOnDestroy(): void {
    if (this.componentLoadPromise) {
      this.componentLoadPromise.then(componentRef => {
        this.setMatches = _ => {};
        this.matchesComponent = void 0;
        this.componentLoadPromise = void 0;
        this.hostAriaControls = null;

        componentRef.destroy();
      });
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    this.keyUpSubject.next(event);
  }

  hostAriaControls: string;

  private getMatches(text: string): Observable<string[]> {
    if (this.completions) {
      return AcwAutoCompleteDirective.findLowerCaseMatches(this.completions, text);
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

  private componentLoadPromise: Promise<ComponentRef<AcwMatchesComponent>>;

  private matchesComponent: AcwMatchesComponent;

  private keyUpSubject: Subject<KeyboardEvent>;

  private matchSelectedSubject: Subject<string>;

  private setMatches: (matches: string[]) => void;

  private static findLowerCaseMatches(
    completions: string[], text: string): Observable<string[]> {

    const lowerCaseText = text.toLocaleLowerCase();

    const matchingCompletions = completions
      .filter(completion => completion.toLocaleLowerCase().startsWith(lowerCaseText));

    return Observable.of(matchingCompletions);
  }

  private noop: (matches: string[]) => void = _ => {};

  private noopSearch: SearchFn = _ => Observable.of([]);

  private idPrefix = 'acw-matches-';

  private static counter: number = 0;
}
