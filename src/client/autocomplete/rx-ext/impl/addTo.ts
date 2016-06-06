import {Subscription} from 'rxjs/Subscription';

export function addTo(collectorSub: Subscription): void {
  collectorSub.add(this);
}

export interface AddToSignature {
  (collectorSub: Subscription): void;
}
