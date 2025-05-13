import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslatorService {

  private apiKey = 'TU_CLAVE_API'; // Reemplaza con tu clave de API de Microsoft
  private endpoint = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=es';

  constructor(private http: HttpClient) { }

  // Método para traducir texto
  translateText(text: string): Observable<any> {
    const headers = new HttpHeaders({
      'Ocp-Apim-Subscription-Key': this.apiKey,
      'Content-Type': 'application/json'
    });

    const body = [{
      'Text': text
    }];

    return this.http.post<any>(this.endpoint, body, { headers });
  }
}
