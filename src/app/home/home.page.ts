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

  map: L.Map | undefined;
  centerMarker: L.Marker | undefined;
  showMarkerTypeList: boolean = false;
  isModalOpen: boolean = false;
  pointName: string = '';
  pointDescription: string = '';
  markers: L.Marker[] = []; // Liste des marqueurs
  currentMarkerType: string = ''; // Type de marqueur actuellement sélectionné

  // Icônes personnalisées pour chaque type de marqueur
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
    // Récupérer les coordonnées du centre depuis le localStorage
    const savedCenter = localStorage.getItem('mapCenter');
    const defaultCenter: L.LatLngExpression = [48.866667, 2.333333]; // Paris par défaut
    const initialCenter = savedCenter ? JSON.parse(savedCenter) : defaultCenter;

    const savedZoom = localStorage.getItem('mapZoom');
    const initialZoom = savedZoom ? parseInt(savedZoom) : 12;

    // Initialiser la carte avec le centre sauvegardé ou par défaut
    this.map = L.map('map').setView(initialCenter, initialZoom);

    // Récupérer le layer actif depuis le localStorage si il existe sinon on utilise OpenStreetMap
    const savedLayer = localStorage.getItem('mapLayer');

    if (savedLayer === "Google Satellite") {
      L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] }).addTo(this.map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(this.map);
    }

    // Ajouter le contrôleur de layer pour changer entre les deux layers
    const baseLayers = {
      "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }),
      "Google Satellite": L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] })
    };

    L.control.layers(baseLayers).addTo(this.map);

    // Sauvegarder le layer actif
    this.map.on('baselayerchange', (e) => {
      localStorage.setItem('mapLayer', e.name);
    });

    // Sauvegarder le centre de la carte à chaque déplacement
    this.map.on('moveend', () => {
      if (this.map) {
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        localStorage.setItem('mapCenter', JSON.stringify([center.lat, center.lng]));
        localStorage.setItem('mapZoom', zoom.toString());
      }
    });

    // Restaurer les marqueurs depuis le localStorage
    this.restoreMarkers();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  // Restaurer les marqueurs depuis le localStorage
  restoreMarkers() {
    const savedMarkers = localStorage.getItem('mapMarkers');
    if (savedMarkers) {
      const markersData = JSON.parse(savedMarkers);
      markersData.forEach((markerData: any) => {
        const marker = L.marker([markerData.lat, markerData.lng], {
          icon: this.markerIcons[markerData.type],
        }).bindPopup(`
          <strong>${markerData.name}</strong><br>
          ${markerData.description}<br>
          <button onclick="window.deleteMarker(${this.markers.length})">Supprimer</button>
        `);
        marker.addTo(this.map!);
        this.markers.push(marker);
      });
    }
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

    // Créer un marqueur avec l'icône correspondante et un popup vide
    this.centerMarker = L.marker([center.lat, center.lng], {
      icon: this.markerIcons[markerType],
    }).bindPopup(''); // Popup vide initialement

    this.centerMarker.addTo(this.map);
    this.currentMarkerType = markerType; // Sauvegarder le type de marqueur
    this.showMarkerTypeList = false; // Masquer la liste après avoir ajouté un point

    // Ouvrir le modal pour le formulaire
    this.isModalOpen = true;
  }

  // Fermer le modal
  closeModal() {
    this.isModalOpen = false;
    this.pointName = '';
    this.pointDescription = '';
  }

  // Soumettre le formulaire
  onSubmit() {
    if (this.centerMarker) {
      // Mettre à jour le contenu du popup avec les données du formulaire
      this.centerMarker.setPopupContent(`
        <strong>${this.pointName}</strong><br>
        ${this.pointDescription}<br>
        <button onclick="window.deleteMarker(${this.markers.length})">Supprimer</button>
      `).openPopup(); // Ouvrir le popup pour afficher les nouvelles informations

      // Sauvegarder les informations du marqueur dans le localStorage
      const markerData = {
        lat: this.centerMarker.getLatLng().lat,
        lng: this.centerMarker.getLatLng().lng,
        name: this.pointName,
        description: this.pointDescription,
        type: this.currentMarkerType,
      };

      // Récupérer les marqueurs existants depuis le localStorage
      const savedMarkers = localStorage.getItem('mapMarkers');
      const markersData = savedMarkers ? JSON.parse(savedMarkers) : [];

      // Ajouter le nouveau marqueur
      markersData.push(markerData);

      // Enregistrer les marqueurs dans le localStorage
      localStorage.setItem('mapMarkers', JSON.stringify(markersData));

      // Ajouter le marqueur à la liste
      this.markers.push(this.centerMarker);
    }

    // Fermer le modal
    this.closeModal();
  }

  // Supprimer un marqueur
  deleteMarker(index: number) {
    if (this.markers[index]) {
      this.map!.removeLayer(this.markers[index]); // Supprimer le marqueur de la carte
      this.markers.splice(index, 1); // Supprimer le marqueur de la liste

      // Mettre à jour le localStorage
      const markersData = this.markers.map(marker => {
        const latLng = marker.getLatLng();
        const popupContent = marker.getPopup()?.getContent() || '';
        const name = this.pointName; // Utiliser les données déjà stockées
        const description = this.pointDescription; // Utiliser les données déjà stockées
        const type = this.currentMarkerType; // Utiliser les données déjà stockées
        return {
          lat: latLng.lat,
          lng: latLng.lng,
          name,
          description,
          type,
        };
      });
      localStorage.setItem('mapMarkers', JSON.stringify(markersData));
    }
  }

  // Vérifie si les coordonnées sont valides
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
