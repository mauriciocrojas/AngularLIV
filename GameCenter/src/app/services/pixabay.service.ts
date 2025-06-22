import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PixabayService {

  private pixabayApiKey = '50260117-73e9586f630346a6461c04841';

  constructor(private http: HttpClient) { }

  searchImage(query: string): Observable<any> {
    const imageUrl = `https://pixabay.com/api/?key=${this.pixabayApiKey}&q=${encodeURIComponent(query)}&image_type=photo&lang=es&safesearch=true`;

    return this.http.get<any>(imageUrl);
  }
}
