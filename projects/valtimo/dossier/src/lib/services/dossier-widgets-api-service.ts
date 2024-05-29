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
import {BaseApiService, ConfigService} from '@valtimo/config';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CaseWidgetsRes} from '../models';

@Injectable({
  providedIn: 'root',
})
export class DossierWidgetsApiService extends BaseApiService {
  constructor(
    protected readonly httpClient: HttpClient,
    protected readonly configService: ConfigService
  ) {
    super(httpClient, configService);
  }

  public getWidgetTabConfiguration(
    caseDefinitionName: string,
    tabKey: string
  ): Observable<CaseWidgetsRes> {
    return this.httpClient.get<CaseWidgetsRes>(
      this.getApiUrl(`v1/case-definition/${caseDefinitionName}/widget-tab/${tabKey}`)
    );
  }

  public getWidgetData(documentId: string, tabKey: string, widgetKey): Observable<object> {
    return this.httpClient.get<object>(
      this.getApiUrl(`v1/document/${documentId}/widget-tab/${tabKey}/widget/${widgetKey}`)
    );
  }
}