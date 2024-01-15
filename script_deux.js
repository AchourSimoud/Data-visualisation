// Définir les coordonnées du centre de Lyon
const lyonCoordinates = [45.75, 4.85];

// Initialiser la carte avec Leaflet
var map = L.map("map").setView(lyonCoordinates, 13);

// Utiliser la surcouche de OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
}).addTo(map);

L.svg().addTo(map);

d3.csv("Data/historique_pistes.csv").then(function (historique) {

        // Load the API data
        fetch("https://api.jcdecaux.com/vls/v1/stations?contract=Lyon&apiKey=2cb5e7d93cea69c9c015bb3a9bdd373ad43ed970")
            .then(response => response.json())
            .then(apiData => {
                data = apiData; // Assign the API data to the global variable
                // Print the data in the console
                // You can access and use the data here
                console.log(data[0]);

                // Insertions des bornes à vélos
                d3.select("#map")
                    .select("svg")
                    .selectAll("myCircles")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("cx", function(d){ return map.latLngToLayerPoint([d.position.lat, d.position.lng]).x })
                    .attr("cy", function(d){ return map.latLngToLayerPoint([d.position.lat, d.position.lng]).y })
                    .attr("r", 5)
                    .style("fill", function(d) {
                        return d.available_bikes === 0 ? 'red' : 'blue';
                    })
                    .style("stroke", function(d) {
                        return d.status === 'OPEN' ? 'green' : 'red';
                    })
                    .attr("stroke-width", 3)
                    .attr("fill-opacity", .4)
                    // mise à jour de la position des bornes 
                    map.on("moveend", update)
            })
            .catch(error => {
                console.error("Error:", error);
            });
});

var selected_graphe = d3.select("#filre");

// Fonction d'adaptation du zoom
function update() {
    d3.selectAll("circle")
      .attr("cx", function(d){ return map.latLngToLayerPoint([d.position.lat, d.position.lng]).x })
      .attr("cy", function(d){ return map.latLngToLayerPoint([d.position.lat, d.position.lng]).y })
}
