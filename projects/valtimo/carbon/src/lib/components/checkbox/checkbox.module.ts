// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {registerElement} from '@valtimo/angular-react';
import {CommonModule} from '@angular/common';
import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {Checkbox} from '@carbon/react';
import {VcdsCheckboxComponent} from './checkbox.component';

const components = [VcdsCheckboxComponent];

@NgModule({
  imports: [CommonModule],
  declarations: components,
  exports: components,
  schemas: [NO_ERRORS_SCHEMA],
})
export class VcdsCheckboxModule {
  constructor() {
    // Add any React elements to the registry (used by the renderer).
    registerElement('Checkbox', () => Checkbox);
  }
}
