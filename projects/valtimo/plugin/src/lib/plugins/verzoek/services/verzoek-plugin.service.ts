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

import {Injectable} from '@angular/core';
import {catchError, Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ConfigService} from '@valtimo/config';
import {Objecttype, Roltype} from '../models';

@Injectable({
  providedIn: 'root',
})
export class VerzoekPluginService {
  private valtimoEndpointUri: string;

  constructor(
    private http: HttpClient,
    configService: ConfigService
  ) {
    this.valtimoEndpointUri = configService.config?.valtimoApi?.endpointUri;
  }

  getAllObjects(): Observable<Objecttype[]> {
    return this.http.get<Objecttype[]>(
      `${this.valtimoEndpointUri}v1/object/management/configuration`
    );
  }

  getRoltypesByDocumentDefinitionName(documentDefinitionName: string): Observable<Array<Roltype>> {
    return this.http
      .get<
        Array<Roltype>
      >(`${this.valtimoEndpointUri}v1/case-definition/${documentDefinitionName}/zaaktype/roltype`)
      .pipe(catchError(() => of([])));
  }
}
