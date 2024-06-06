/*
 * Copyright 2015-2024 Ritense BV, the Netherlands.
 *
 * Licensed under EUPL, Version 1.2 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Type} from '@angular/core';
import {DossierManagementWidgetFieldsComponent} from '../components/dossier-management-widget-configurators/fields/dossier-management-widget-fields.component';
import {WidgetContentComponent} from './widget-content.model';
import {CaseWidgetType} from '@valtimo/dossier';

enum WidgetWizardStep {
  TYPE,
  WIDTH,
  STYLE,
  CONTENT,
}

enum WidgetStyle {
  DEFAULT = 'default',
  HIGH_CONTRAST = 'high-contrast',
}

interface WidgetTypeSelection {
  titleKey: string;
  descriptionKey: string;
  illustrationUrl: string;
  type: CaseWidgetType;
  component: Type<WidgetContentComponent>;
}

const AVAILABLE_WIDGETS: WidgetTypeSelection[] = [
  {
    titleKey: 'widgetTabManagement.types.fields.title',
    descriptionKey: 'widgetTabManagement.types.fields.description',
    illustrationUrl: 'valtimo-layout/img/widget-management/types/fields.svg',
    type: CaseWidgetType.FIELDS,
    component: DossierManagementWidgetFieldsComponent,
  },
];

const WIDGET_WIDTH_LABELS: {[key: number]: string} = {
  1: 'widgetTabManagement.width.quarter.title',
  2: 'widgetTabManagement.width.half.title',
  3: 'widgetTabManagement.width.threeQuarters.title',
  4: 'widgetTabManagement.width.fullWidth.title',
};

const WIDGET_STYLE_LABELS: {[key: string]: string} = {
  [WidgetStyle.DEFAULT]: 'widgetTabManagement.style.default.title',
  [WidgetStyle.HIGH_CONTRAST]: 'widgetTabManagement.style.highContrast.title',
};

export {
  WidgetWizardStep,
  WidgetTypeSelection,
  AVAILABLE_WIDGETS,
  WidgetStyle,
  WIDGET_WIDTH_LABELS,
  WIDGET_STYLE_LABELS,
};