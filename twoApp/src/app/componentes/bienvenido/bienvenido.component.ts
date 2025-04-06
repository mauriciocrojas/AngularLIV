import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-bienvenido',
  templateUrl: './bienvenido.component.html',
  styleUrls: ['./bienvenido.component.css']
})
export class BienvenidoComponent {
  usuario: string = '';

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.usuario = params['usuario'] || 'Usuario';
    });
  }
}
