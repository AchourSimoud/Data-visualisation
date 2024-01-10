// Définir les coordonnées du centre de Lyon
const lyonCoordinates = [45.75, 4.85];

// Initialiser la carte avec Leaflet
var map = L.map("map").setView(lyonCoordinates, 13);

// Utiliser la surcouche de OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
}).addTo(map);

L.svg().addTo(map);

// Charger le fichier contenant les lignes de tramway
//var url = 'https://data.grandlyon.com/fr/datapusher/ws/timeseries/jcd_jcdecaux.historiquevelov/all.json?maxfeatures=-1&start=1&separator=';

d3.json("Data/stationvelov.json").then(function (bornes) {

    var station_features = bornes.features;
    // Insertions des bornes à vélos
    d3.select("#map")
    .select("svg")
    .selectAll("myCircles")
    .data(station_features)
    .enter()
    .append("circle")
    .attr("cx", function(d){ return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x })
    .attr("cy", function(d){ return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y })
    .attr("r", 5)
    .style("fill", "green")
    .attr("stroke", "green")
    .attr("stroke-width", 3)
    .attr("fill-opacity", .4)
      
      // mise à jour de la position des bornes 
      map.on("moveend", update)
});

// Fonction d'adaptation du zoom
function update() {
    d3.selectAll("circle")
      .attr("cx", function(d){ return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x })
      .attr("cy", function(d){ return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y })
  }