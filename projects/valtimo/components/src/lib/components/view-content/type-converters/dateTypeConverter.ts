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
import moment from 'moment';
import {TypeConverter} from './type-converters.model';

moment.locale(localStorage.getItem('langKey') ?? 'nl-NL');

export class DateTypeConverter implements TypeConverter {
  public getTypeString(): string {
    return 'date';
  }

  public convert(value: any, definition: any): string {
    if (!value) {
      return '-';
    }

    return moment(value).format(definition?.format || 'DD-MM-YYYY, hh:mm A');
  }
}
