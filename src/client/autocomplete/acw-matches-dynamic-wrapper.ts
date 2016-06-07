import { ComponentRef } from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';

import { AcwMatchesComponent } from './acw-matches.component';
import { Disposable } from './acw-utils';
import './rx-ext/Subscription/addTo';

interface AcwMatchesHolder {
  setId (id: string): void;

  setMatches(matches: string[]): void;

  setIndex(index: number): void;

  getSelectObservable(): Observable<number>;

  getOverObservable(): Observable<number>;
}

export class AcwMatchesDynamicWrapper implements Disposable {
  constructor() {
    const selectSubject = new Subject<number>();
    this.select$ = selectSubject.asObservable();
    this.selectEmitter = selectSubject;

    const overSubject = new Subject<number>();
    this.over$ = overSubject.asObservable();
    this.overEmitter = overSubject;

    // by default, start with an empty holder
    this.holder = new AcwMatchesEmptyHolder();
  }

  dispose(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
      this.holder = null;
    }

    this.subscription.unsubscribe();
  }

  set id(id: string) {
    this.holder.setId(id);
  }

  set matches(matches: string[]) {
    this.holder.setMatches(matches);
  }

  set index(index: number) {
    this.holder.setIndex(index);
  }

  get select(): Observable<number> {
    return this.select$;
  }

  get over(): Observable<number> {
    return this.over$;
  }

  load(componentRef: ComponentRef<AcwMatchesComponent>): void {
    const instance: AcwMatchesComponent = componentRef.instance;

    this.holder = new AcwMatchesFullHolder(instance);

    this.subscribeNewHolder();
  }

  unload(): void {
    this.dispose();

    this.holder = new AcwMatchesEmptyHolder();

    this.subscribeNewHolder();
  }

  private subscribeNewHolder(): void {
    // unsubscribe previous
    // NOTE: assume that subscriptions are _all and only_ bound to held component
    this.subscription.unsubscribe();

    // subscribe new
    this.holder.getSelectObservable()
      .subscribe(value => this.selectEmitter.next(value))
      .addTo(this.subscription);

    this.holder.getOverObservable()
      .subscribe(value => this.overEmitter.next(value))
      .addTo(this.subscription);
  }

  private componentRef: ComponentRef<AcwMatchesComponent>;
  private holder: AcwMatchesHolder;

  private selectEmitter: Observer<number>;
  private select$: Observable<number>;

  private overEmitter: Observer<number>;
  private over$: Observable<number>;

  private subscription: Subscription = new Subscription();
}

class AcwMatchesFullHolder implements AcwMatchesHolder {
  constructor(private instance: AcwMatchesComponent) {
  }

  setId (id: string): void {
    this.instance.id = id;
  }

  setMatches(matches: string[]): void {
    this.instance.matches = matches;
  }

  setIndex(index: number): void {
    this.instance.activeIndex = index;
  }

  getSelectObservable(): Observable<number> {
    return this.instance.select;
  }

  getOverObservable(): Observable<number> {
    return this.instance.over;
  }
}

class AcwMatchesEmptyHolder implements AcwMatchesHolder {
  setId (id: string): void {
    // do nothing
  }

  setMatches(matches: string[]): void {
    // do nothing
  }

  setIndex(index: number): void {
    // do nothing
  }

  getSelectObservable(): Observable<number> {
    return Observable.empty<number>();
  }

  getOverObservable(): Observable<number> {
    return Observable.empty<number>();
  }
}
