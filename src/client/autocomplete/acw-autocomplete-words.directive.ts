import {
  Directive, Input, AfterViewInit, OnDestroy,
  DynamicComponentLoader, ElementRef, ViewContainerRef, ComponentRef
} from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';

import { AcwMatchesComponent } from './acw-matches.component';
import { AcwInputDriver } from './acw-input-driver';
import './rx-ext/Subscription/addTo';

type SearchFn = (text: string) => Observable<string[]>;

@Directive({
  selector: '[acwAutocompleteWords]',
  host: {
    '(keyup)': 'onKeyUp($event)',
    'aria-haspopup': 'true',
    '[attr.aria-controls]': 'hostAriaControls',
  },
})
export class AcwAutoCompleteDirective implements AfterViewInit, OnDestroy {

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
        this.matchesComponent.keyUp$ = this.keyUpSubject;

        this.setMatches = value => {
          this.matchesComponent.matches = value;
        };

        this.matchesComponent.selectItem
          .subscribe((match: string) => {
            this.matchSelectedSubject.next(match);
          })
          .addTo(this.subscription);

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

    this.subscription.unsubscribe();
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

  private subscription: Subscription = new Subscription();

  private noop: (matches: string[]) => void = _ => {};

  private noopSearch: SearchFn = _ => Observable.of([]);

  private idPrefix = 'acw-matches-';

  private static counter: number = 0;

  private static findLowerCaseMatches(
    completions: string[], text: string): Observable<string[]> {

    const lowerCaseText = text.toLocaleLowerCase();

    const matchingCompletions = completions
      .filter(completion => completion.toLocaleLowerCase().startsWith(lowerCaseText));

    return Observable.of(matchingCompletions);
  }
}
