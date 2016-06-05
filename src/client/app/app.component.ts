import {
  Component, OnInit, OnDestroy, DynamicComponentLoader, ViewContainerRef, ComponentRef
} from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';

import { AcMatchesComponent } from '../autocomplete/ac-matches.component';
import { AcInputDriver } from '../autocomplete/ac-input-driver';
import { countryNames } from './countries';

@Component({
  selector: 'my-app',
  template: `
    <input id="dummyInput" [(ngModel)]="dummyText" autofocus=""
           type="text" class="form-control" placeholder="Autocomplete on country names"
           aria-haspopup="true" aria-controls="dummyInputMatches"
           (keyup)="onKeyUp($event)">
    <!--
    <ac-matches id="dummyInputMatches" [matches]="matches"
                (select)="onMatchSelect($event)"></ac-matches>
    -->
  `,
  styles: [require('./app.component.css')],
  directives: [
    AcMatchesComponent,
  ],
  providers: [
  ],
})
export class AppComponent implements OnInit, OnDestroy {

  dummyText: string = '';

  constructor(
    private componentLoader: DynamicComponentLoader,
    private viewContainerRef: ViewContainerRef) {

    this.setMatches = _ => {};

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

    const inputDriver = new AcInputDriver(
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
      this.dummyText = text;

      this.setMatches([]);
    });
  }

  ngOnInit(): void {
    this.componentLoadPromise = this.componentLoader
      .loadNextToLocation(AcMatchesComponent, this.viewContainerRef)
      .then(componentRef => {
        this.matchesComponent = componentRef.instance;

        this.matchesComponent.matches = [];

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

        componentRef.destroy();
      });
    }
  }

  getMatches(text: string): Observable<string[]> {
    const lowerCaseText = text.toLocaleLowerCase();

    const matchingCompletions = this.completions
      .filter(completion => completion.toLocaleLowerCase().startsWith(lowerCaseText));

    return Observable.of(matchingCompletions);
  }

  onKeyUp(event: KeyboardEvent): void {
    this.keyUpSubject.next(event);
  }

  /*
  onMatchSelect(match: string): void {
    this.matchSelectedSubject.next(match);
  }
  */

  completions: string[] = countryNames;

  minWordLength: number = 2;

  debounceMs: number = 200;

  private setMatches: (matches: string[]) => void;

  private componentLoadPromise: Promise<ComponentRef<AcMatchesComponent>>;

  private matchesComponent: AcMatchesComponent;

  private keyUpSubject: Subject<KeyboardEvent>;

  private matchSelectedSubject: Subject<string>;
}
