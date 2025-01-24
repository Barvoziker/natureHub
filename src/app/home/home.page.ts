import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import {IonicModule} from "@ionic/angular";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  map: L.Map | undefined; // Initialisation explicite avec `undefined`
  centerMarker: L.Marker | undefined; // Idem pour `centerMarker`

  ngOnInit() {
    this.initMap();
  }

  initMap() {
    this.map = L.map('map').setView([48.866667, 2.333333], 12); // Initialisation de `map`
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Forcer le recalcul de la taille de la carte après un court délai
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100); // Délai de 100 ms
  }

  addPointAtCenter() {
    if (!this.map) return; // Vérification que `map` est bien initialisé

    const center = this.map.getCenter();

    if (this.centerMarker) {
      this.map.removeLayer(this.centerMarker);
    }

    this.centerMarker = L.marker([center.lat, center.lng], {
      icon: L.icon({
        iconUrl: 'assets/icon/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    }).addTo(this.map);

    this.centerMarker.bindPopup('Nouveau point ajouté !').openPopup();
  }
}
