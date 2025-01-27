import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { AlertController } from '@ionic/angular'; // Pour afficher des alertes

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  //TODO: VOIR POUR CREER UNE CLASSE POUR LES POINTS D'INTERET
  map: L.Map | undefined;
  centerMarker: L.Marker | undefined;
  showMarkerTypeList: boolean = false;
  isModalOpen: boolean = false;
  pointName: string = '';
  pointDescription: string = '';

  markerIcons: { [key: string]: L.Icon } = {
    poste: L.icon({
      iconUrl: 'assets/icon/poste.png',
      iconSize: [48, 48],
      iconAnchor: [24, 48],
    }),
    'lieu de passage': L.icon({
      iconUrl: 'assets/icon/passage.png',
      iconSize: [48, 48],
      iconAnchor: [24, 48],
    }),
    'point eau': L.icon({
      iconUrl: 'assets/icon/eau.png',
      iconSize: [48, 48],
      iconAnchor: [24, 48],
    }),
  };

  constructor(private alertController: AlertController) {}

  ngOnInit() {
    this.initMap();
  }

  initMap() {
    const savedCenter = localStorage.getItem('mapCenter');
    const defaultCenter: L.LatLngExpression = [48.866667, 2.333333];
    const initialCenter = savedCenter ? JSON.parse(savedCenter) : defaultCenter;

    const savedZoom = localStorage.getItem('mapZoom');
    const initialZoom = savedZoom ? parseInt(savedZoom) : 12;

    // Initialiser la carte avec le centre sauvegardé ou par défaut
    this.map = L.map('map').setView(initialCenter, initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('moveend', () => {
      if (this.map) {
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        localStorage.setItem('mapCenter', JSON.stringify([center.lat, center.lng]));
        localStorage.setItem('mapZoom', zoom.toString());
      }
    });

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  openMarkerTypeList() {
    this.showMarkerTypeList = !this.showMarkerTypeList;
  }

  async addPointAtCenter(markerType: string) {
    if (!this.map) return;

    const center = this.map.getCenter();

    // Vérification des coordonnées
    if (!this.areCoordinatesValid(center.lat, center.lng)) {
      await this.showAlert('Erreur', 'Les coordonnées ne sont pas valides.');
      return;
    }

    if (this.centerMarker) {
      this.map.removeLayer(this.centerMarker);
    }

    this.centerMarker = L.marker([center.lat, center.lng], {
      icon: this.markerIcons[markerType],
    }).bindPopup('');

    this.centerMarker.addTo(this.map);
    this.showMarkerTypeList = false;

    this.isModalOpen = true;
  }

  // Fermer le modal
  closeModal() {
    this.isModalOpen = false;
    this.pointName = '';
    this.pointDescription = '';
  }

  onSubmit() {
    if (this.centerMarker) {
      this.centerMarker.setPopupContent(`
        <strong>${this.pointName}</strong><br>
        ${this.pointDescription}
      `).openPopup();
    }

    this.closeModal();
  }

  areCoordinatesValid(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // Affiche une alerte
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
