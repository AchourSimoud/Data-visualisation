// Définir les coordonnées du centre de Lyon
const coordinates = {
    lyon: [45.75, 4.85],
    nancy: [48.692054, 6.184417],
    amiens: [49.894067, 2.295753],
    toulouse: [43.604652, 1.444209],
    cergypontoise: [49.036667, 2.076944],
    creteil: [48.783333, 2.466667],
    mulhouse: [47.75, 7.333333],
    nantes: [47.218371, -1.553621]
};

// Initialiser la carte avec Leaflet
var map = L.map("map").setView(coordinates.lyon, 13);

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
var switchButton = d3.select("#switchButton");
var citySelect = document.getElementById("cities");
var apiLink = "https://api.jcdecaux.com/vls/v3/stations?contract=Lyon";

citySelect.addEventListener("change", function () {
    // Get the selected value
    var selectedCity = citySelect.value;
    // Remove the symbol '-'

    // Update the API link
    apiLink = "https://api.jcdecaux.com/vls/v3/stations?contract=" + selectedCity;

    // console.log("Selected city: " + selectedCity);
    selectedCity = selectedCity.replace('-', '');
    map.setView(coordinates[selectedCity.toLowerCase()], 13);

    // Now you can use the updated API link in your fetch request
    fetchData(apiLink);
});

fetchData(apiLink);

function fetchData(apiLink) {
    // Load the API data
    fetch(apiLink + "&apiKey=2cb5e7d93cea69c9c015bb3a9bdd373ad43ed970")
        .then(response => response.json())
        .then(apiData => {
            data = apiData; // Assign the API data to the global variable
            // Print the data in the console
            // You can access and use the data here
            // console.log(data);

            // Calculate the sum of available mechanical bikes
            var sumOfMechanicalBikes = data.reduce(function (total, d) {
                return total + d.mainStands.availabilities.mechanicalBikes;
            }, 0);

            // Calculate the sum of available electrical bikes
            var sumOfElectricalBikes = data.reduce(function (total, d) {
                return total + d.mainStands.availabilities.electricalBikes;
            }, 0);

            createBarChart(sumOfMechanicalBikes, sumOfElectricalBikes);
            d3.select("#map")
                .select("svg")
                .selectAll("myCircles")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", function (d) { return map.latLngToLayerPoint([d.position.latitude, d.position.longitude]).x })
                .attr("cy", function (d) { return map.latLngToLayerPoint([d.position.latitude, d.position.longitude]).y })
                .attr("r", 5)
                .style("pointer-events", "visible")
                .style("fill", function (d) {
                    if (d.mainStands.availabilities.bikes === 0) {
                        return 'red';
                    } else if (d.mainStands.availabilities.bikes >= 1 && d.mainStands.availabilities.bikes <= 5) {
                        return 'orange';
                    } else {
                        return 'green';
                    }
                })
                .style("stroke", function (d) {
                    return d.status === 'OPEN' ? 'green' : 'black';
                })
                .attr("stroke-width", 1)
                .attr("fill-opacity", 1)
                .on("click", function (d) {
                    console.log("here", d);
                    document.getElementById("affichage").innerHTML = "<br><strong><span style='font-size: 20px;'>Nom de la station: </span></strong><br><span style='font-weight: bold; color: red;'>" + d.name + "</span>"
                        + "<br><br><img width=\"30\" height=\"30\" src=\"https://img.icons8.com/3d-fluency/94/map-pin.png\" alt=\"map-pin\"/>"
                        + "<span style='font-size: 15px;'>" + d.address + "</span>"
                        + "<br><br><strong><span style='font-size: 15px;'>Nombre de vélos disponible : </span></strong><br><span style='font-weight: bold; color: red;'>" + d.mainStands.availabilities.bikes + "</span>"
                        + "<br><br><strong><span style='font-size: 15px;'>Nombre d'emplacements libres :  </span></strong><br><span style='font-weight: bold; color: red;'>" + d.mainStands.availabilities.stands + "</span>"
                        + "<br><br><img width=\"40\" height=\"40\" src=\"https://img.icons8.com/3d-fluency/94/bicycle.png\" alt=\"bicycle\"/>"
                        + "<span style='font-size: 25px;'>" + d.mainStands.availabilities.mechanicalBikes + "</span>"
                        + "<br><img width=\"40\" height=\"40\" src=\"https://img.icons8.com/3d-fluency/94/electric-bike.png\" alt=\"electric-bike\"/>"
                        + "<span style='font-size: 25px;'>" + d.mainStands.availabilities.electricalBikes + "</span>"
                        + "<br><img width=\"40\" height=\"40\" src=\"https://img.icons8.com/3d-fluency/94/bike-parking.png\" alt=\"bike-parking\"/>"
                        + "<span style='font-size: 25px;'>" + d.mainStands.capacity + "</span>"
                        + "<br><br><strong><span style='font-size: 15px;'>Statut de la station : </span></strong><br><span style='font-weight: bold; color: red;'>" + d.status + "</span>"


                    // Calculate the ratio of mechanicalBikes and electricalBikes
                    var mechanicalBikes = d.mainStands.availabilities.mechanicalBikes;
                    var electricalBikes = d.mainStands.availabilities.electricalBikes;
                    var totalBikes = mechanicalBikes + electricalBikes;

                    if (mechanicalBikes !== 0 || electricalBikes !== 0) {
                        showPieChart(mechanicalBikes, electricalBikes)
                    }
                });

            // Add text to the center of the circles
            d3.select("#map")
                .select("svg")
                .selectAll("myText")
                .data(data)
                .enter()
                .append("text")
                .attr("class", "station-text")
                .attr("x", function (d) { return map.latLngToLayerPoint([d.position.latitude, d.position.longitude]).x })
                .attr("y", function (d) { return map.latLngToLayerPoint([d.position.latitude, d.position.longitude]).y })
                .text(function (d) {
                    return d.mainStands.availabilities.bikes;
                })
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("fill", "white")
                .style("font-size", "7px");

            // mise à jour de la position des bornes 
            map.on("moveend", update)

            switchButton.on("change", function () {
                console.log("Switch button changed");
                var showAvailable = switchButton.property("checked");

                d3.selectAll(".station-text")
                    .text(function (d) {
                        return showAvailable ? d.mainStands.availabilities.stands : d.mainStands.availabilities.bikes;
                    });
                d3.selectAll("circle")
                    .style("fill", function (d) {
                        if (showAvailable) {
                            if (d.mainStands.availabilities.stands === 0) {
                                return 'red';
                            } else if (d.mainStands.availabilities.stands >= 1 && d.mainStands.availabilities.stands <= 5) {
                                return 'orange';
                            } else {
                                return 'green';
                            }
                        } else {
                            if (d.mainStands.availabilities.bikes === 0) {
                                return 'red';
                            } else if (d.mainStands.availabilities.bikes >= 1 && d.mainStands.availabilities.bikes <= 5) {
                                return 'orange';
                            } else {
                                return 'green';
                            }
                        }
                    })
                    .style("stroke", function (d) {
                        return d.status === 'OPEN' ? 'green' : 'black';
                    });
            })
        })
        .catch(error => {
            console.error("Error:", error);
        });
}
var selected_graphe = d3.select("#filre");

// Fonction d'adaptation du zoom
function update() {
    var zoomLevel = map.getZoom(); // Get the current zoom level
    console.log("Zoom level: " + zoomLevel);

    d3.selectAll("circle")
        .attr("r", function (d) {
            // Adjust the circle size based on the zoom level
            if (zoomLevel >= 14) {
                return zoomLevel - 8 * 0.5;
            } else {
                return 5;
            }
        })
        .attr("cx", function (d) { return map.latLngToLayerPoint([d.position.latitude, d.position.longitude]).x })
        .attr("cy", function (d) { return map.latLngToLayerPoint([d.position.latitude, d.position.longitude]).y });

    d3.selectAll(".station-text")
        .style("font-size", function (d) {
            // Adjust the circle size based on the zoom level
            if (zoomLevel >= 14) {
                return zoomLevel - 8 * 0.5 + "px";
            } else {
                return 5 + "px";
            }
        })
        .attr("x", function (d) { return map.latLngToLayerPoint([d.position.latitude, d.position.longitude]).x })
        .attr("y", function (d) { return map.latLngToLayerPoint([d.position.latitude, d.position.longitude]).y });
}

// Afficher le nombre de pistes par année dans la div avec l'id "plots"
d3.csv("Data/historique_pistes.csv").then(function (historique) {
    var selected_graphe = d3.select("#filtre");
    update_graph(selected_graphe, historique);
    selected_graphe.on("change", function () {
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
        data = data.filter(function (d) {
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
        data = data.filter(function (d) {
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
        x.domain([0, d3.max(data, function (d) { return d.value; })]);
        y.domain(data.map(function (d) { return d.key; }));

        svg.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('y', function (d) { return y(d.key); })
            .attr('height', y.bandwidth())
            .attr('x', 0) // La barre commence à l'extrémité gauche
            .attr('width', function (d) { return x(d.value); })
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

function showPieChart(mechanicalBikes, electricalBikes) {
    document.getElementById("affichage").innerHTML += "<br><br><strong><span style='font-size: 15px;'>Ratio type de vélos disponibles : </span></strong><br><br><div id='pieChart'></div>";
    // Create the pie chart data
    var pieData = [
        { label: "⚙️", value: mechanicalBikes },
        { label: "⚡", value: electricalBikes }
    ];

    // Set up the pie chart dimensions
    var width = 150;
    var height = 150;
    var radius = Math.min(width, height) / 2;

    // Create the pie chart SVG element
    var svg = d3.select("#pieChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Define the pie chart layout
    var pie = d3.pie()
        .value(function (d) { return d.value; });

    // Define the arc for each slice of the pie chart
    var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Create the pie chart slices
    var slices = svg.selectAll("slice")
        .data(pie(pieData))
        .enter()
        .append("g");

    // Add the pie chart slices
    slices.append("path")
        .attr("d", arc)
        .attr("fill", function (d) { return d.data.label === "⚙️" ? "lightgrey" : "lightyellow"; });

    // Add the pie chart labels
    slices.append("text")
        .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
        .attr("text-anchor", "middle")
        .text(function (d) { return d.data.label + " (" + d.data.value + ")"; });
}


function createBarChart(value1, value2) {
    // Nettoyer le contenu existant dans la balise avec l'id "barChart"
    d3.select("#barChart").html("");
    // Calculer le pourcentage de chaque valeur
    var percentage1 = Math.round((value1 / (value1 + value2)) * 100);
    var percentage2 = Math.round((value2 / (value1 + value2)) * 100);

    // Définir les données pour le graphique à barres
    var data = [
        { label: "⚙️", percentage: percentage1, color: 'lightgrey' },
        { label: "⚡", percentage: percentage2, color: 'lightyellow' }
    ];

    // Définir la largeur et la hauteur du graphique à barres
    var width = 300;
    var height = 50;

    // Créer l'échelle pour l'axe des x
    var xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);

    // Sélectionner la balise div avec l'id "barChart"
    var chart = d3.select("#barChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Ajouter des rectangles pour chaque barre
    chart.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("width", function (d) { return xScale(d.percentage); })
        .attr("height", height)
        .attr("y", 0) // La position y est fixée à 0
        .attr("x", function (d, i) {
            // La position x de la deuxième barre commence là où se termine la première barre
            return i === 0 ? 0 : xScale(percentage1);
        })
        .attr("fill", function (d) { return d.color; });

    // Ajouter des étiquettes pour chaque barre
    chart.selectAll("text")
        .data(data)
        .enter().append("text")
        .attr("x", function (d, i) { return i === 0 ? 50 : 200; })
        .attr("y", height / 2)
        .text(function (d) { return d.label + " (" + d3.format(".0f")(d.percentage) + "%)"; })
        .attr("fill", "white")
        .attr("fill", "black");
}
