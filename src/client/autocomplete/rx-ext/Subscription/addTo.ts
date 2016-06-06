import { Subscription } from 'rxjs/Subscription';
import { addTo, AddToSignature } from '../impl/addTo';

// Create an augmentation for 'rxjs/Subscription' module
declare module 'rxjs/Subscription' {

  // Augment the 'Subscription' class definition with interface merging
  interface Subscription {
    addTo: AddToSignature;
  }

}

// Actually patch 'Subscription' type with added implementation
Subscription.prototype.addTo = addTo;
