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
/*
d3.csv("Data/historique_pistes.csv").then(function (historique) {
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
        .on("mouseover", function () {
            d3.select(this).attr("fill", "red");
        });
        // mise à jour de la position des bornes 
        map.on("moveend", update)

    });
});
*/

// Load the API data
fetch("https://api.jcdecaux.com/vls/v1/stations?contract=Lyon&apiKey=2cb5e7d93cea69c9c015bb3a9bdd373ad43ed970")
.then(response => response.json())
.then(apiData => {
    data = apiData; // Assign the API data to the global variable
    // Print the data in the console
    // You can access and use the data here
    console.log(data);

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
            return d.available_bikes === 0 ? 'red' : 'green';
        })
        .style("stroke", function(d) {
            return d.status === 'OPEN' ? 'green' : 'red';
        })
        .attr("stroke-width", 1)
        .attr("fill-opacity", 1)
        // mise à jour de la position des bornes 
        map.on("moveend", update)
})
.catch(error => {
    console.error("Error:", error);
});
var selected_graphe = d3.select("#filre");

// Fonction d'adaptation du zoom
function update() {
    d3.selectAll("circle")
      .attr("cx", function(d){ return map.latLngToLayerPoint([d.position.lat, d.position.lng]).x })
      .attr("cy", function(d){ return map.latLngToLayerPoint([d.position.lat, d.position.lng]).y })
}

// Afficher le nombre de pistes par année dans la div avec l'id "plots"
d3.csv("Data/historique_pistes.csv").then(function (historique) {
    var selected_graphe = d3.select("#filtre");
    update_graph(selected_graphe, historique);
    selected_graphe.on("change", function() {
        update_graph(selected_graphe, historique);
    });
});

// Fonction d'affichage des graphiques
function update_graph(filtre, historique) {
    d3.select('#plots').html(""); // Effacez le contenu actuel de la div

    if (filtre.property("value") === "annees") {
        // Définir les dimensions du graphique
        var margin = { top: 40, right: 20, bottom: 20, left: 40 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

        // Agréger les données par année
        var data = d3.nest()
            .key(function (d) { return d.anneelivraison; })
            .rollup(function (v) { return v.length; })
            .entries(historique);

        // Triez les données par ordre croissant en fonction de la clé
        data.sort(function (a, b) {
            return d3.ascending(a.key, b.key);
        });
        // Filtrer les données pour exclure les clés égales à 0
        data = data.filter(function(d) {
            return d.key !== "0";
        });
        // Affichage des barres plots
        var svg = d3.select('#plots')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .on("mouseover", function () {
                d3.select(this).style("cursor", "pointer");
            });

        // Échelle pour l'axe des x
        var x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);

        // Échelle pour l'axe des y
        var y = d3.scaleLinear()
            .range([height, 0]);

        // Définir les domaines des échelles en fonction des données
        x.domain(data.map(function (d) { return d.key; }));
        y.domain([0, d3.max(data, function (d) { return d.value; })]);

        // Ajouter les barres au graphique
        svg.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', function (d) { return x(d.key); })
            .attr('width', x.bandwidth())
            .attr('y', function (d) { return y(d.value); })
            .attr('height', function (d) { return height - y(d.value); })
            .attr('fill', 'steelblue');

        // Ajouter l'axe des x
        svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x));

        // Ajouter l'axe des y
        svg.append('g')
            .call(d3.axisLeft(y));

        // Ajouter un titre au graphique
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 0 - margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .text('Graphique de construction des pistes cyclables à Lyon');
    } else if (filtre.property("value") === "communes") {
        // Définir les dimensions du graphique
        var margin = { top: 40, right: 20, bottom: 20, left: 150 },
        width = 600 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

        // Agréger les données par commune
        var data = d3.nest()
            .key(function (d) { return d.commune1; })
            .rollup(function (v) { return v.length; })
            .entries(historique);

        // Triez les données par ordre croissant en fonction de la clé
        data.sort(function (a, b) {
            return d3.ascending(a.value, b.value);
        });

         // Filtrer les données pour exclure les clés vides
         data = data.filter(function(d) {
            return d.key !== "";
        });

        // Affichage des barres plots
        var svg = d3.select('#plots')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // Échelle pour l'axe des x
        var x = d3.scaleLinear()
            .range([0, width]);

        // Échelle pour l'axe des y
        var y = d3.scaleBand()
            .range([height, 0])
            .padding(0.1);

        // Définir les domaines des échelles en fonction des données
        x.domain([0, d3.max(data, function(d) { return d.value; })]);
        y.domain(data.map(function(d) { return d.key; }));
        
        svg.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('y', function(d) { return y(d.key); })
            .attr('height', y.bandwidth())
            .attr('x', 0) // La barre commence à l'extrémité gauche
            .attr('width', function(d) { return x(d.value); })
            .attr('fill', 'steelblue');

        // Ajouter l'axe des x
        svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x));

        // Ajouter l'axe des y
        svg.append('g')
            .call(d3.axisLeft(y));

        // Ajouter un titre au graphique
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 0 - margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .text('Graphique de construction des pistes cyclables à Lyon');
    }
}
