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

// Définir les dimensions du graphique
var margin = { top: 40, right: 20, bottom: 20, left: 40 };
const barPlotDiv = document.querySelector('.bar-plot');
const width = barPlotDiv.offsetWidth / 2 - margin.left - margin.right;
const height = barPlotDiv.offsetHeight - margin.top - margin.bottom;

// Initialiser la carte avec Leaflet
var map = L.map("map").setView(coordinates.lyon, 13);

// Utiliser la surcouche de OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    minZoom: 12,
}).addTo(map);

L.svg().addTo(map);

var switchButton = d3.select("#switchButton");
var citySelect = document.getElementById("cities");
var apiLink = "https://api.jcdecaux.com/vls/v3/stations?contract=Lyon";

citySelect.addEventListener("change", function () {
    // Obtenir la valeur sélectionnée
    var selectedCity = citySelect.value;
    // Supprimer le symbole '-'
    if (citySelect.value != "lyon") {
        document.getElementById("plot-section").style.display = "none";
    } else {
        document.getElementById("plot-section").style.display = "block";
    }
    // Mettre à jour le lien de l'API
    apiLink = "https://api.jcdecaux.com/vls/v3/stations?contract=" + selectedCity;

    selectedCity = selectedCity.replace('-', '');
    map.setView(coordinates[selectedCity.toLowerCase()], 13);

    // Maintenant, vous pouvez utiliser le lien de l'API mis à jour dans votre requête fetch
    fetchData(apiLink);
});

fetchData(apiLink);

function fetchData(apiLink) {
    // Charger les données de l'API
    fetch(apiLink + "&apiKey=2cb5e7d93cea69c9c015bb3a9bdd373ad43ed970")
        .then(response => response.json())
        .then(apiData => {
            data = apiData; // Assigner les données de l'API à la variable globale

            // Calculer la somme des vélos mécaniques disponibles
            var sumOfMechanicalBikes = data.reduce(function (total, d) {
                return total + d.mainStands.availabilities.mechanicalBikes;
            }, 0);

            // Calculer la somme des vélos électriques disponibles
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
                    document.getElementById("affichage").innerHTML = "<br><strong><span style='font-size: 20px;'>Nom de la station: </span></strong><br><span style='font-weight: bold; color: red;'>" + d.name + "</span>"
                        + "<br><br><img width=\"30\" height=\"30\" src=\"https://img.icons8.com/3d-fluency/94/map-pin.png\" alt=\"map-pin\"/>"
                        + "<span style='font-size: 15px;'>" + d.address + "</span>"
                        + "<br><br><strong><span style='font-size: 15px;'>Statut de la station : </span></strong><br><span style='font-weight: bold; color: red;'>" + d.status + "</span>"

                    // Calculer le ratio de vélos mécaniques et de vélos électriques
                    var mechanicalBikes = d.mainStands.availabilities.mechanicalBikes;
                    var electricalBikes = d.mainStands.availabilities.electricalBikes;
                    var stands = d.mainStands.availabilities.stands;
                    var capacity = d.mainStands.capacity;
                    var totalBikes = mechanicalBikes + electricalBikes;

                    if (mechanicalBikes !== 0 || electricalBikes !== 0) {
                        showBarChart(mechanicalBikes, electricalBikes, stands, capacity);
                    }
                });

            // Ajouter du texte au centre des cercles
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
    var zoomLevel = map.getZoom(); // Obtenir le niveau de zoom actuel

    d3.selectAll("circle")
        .attr("r", function (d) {
            // Ajuster la taille du cercle en fonction du niveau de zoom
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
            // Ajuster la taille de la police en fonction du niveau de zoom
            if (zoomLevel >= 14) {
                return zoomLevel - 8 * 0.5 + "px";
            } else {
                return 5 + "px";
            }
        })
        .attr("x", function (d) { return map.latLngToLayerPoint([d.position.latitude, d.position.longitude]).x })
        .attr("y", function (d) { return map.latLngToLayerPoint([d.position.latitude, d.position.longitude]).y });
}
var tooltip = d3
    .select("#barChart2")
    .append("div")
    .attr("class", " tooltip");

// Afficher le nombre de pistes par année dans la div avec l'id "plots"
d3.csv("Data/historique_pistes.csv").then(function (historique) {

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
    var svg = d3.select('#barChart1')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


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
        .attr('fill', 'steelblue')
        .on("mousemove", function (d) {
            // on recupere la position de la souris,
            d3.select(this).style("cursor", "pointer");
            var mousePosition = [d3.event.pageX, d3.event.pageY];
            // on affiche le toolip
            tooltip
                .classed("hidden", false)
                // on positionne le tooltip en fonction
                // de la position de la souris
                .attr(
                    "style",
                    "left:" +
                    (mousePosition[0] + 15) +
                    "px; top:" +
                    (mousePosition[1] - 35) +
                    "px"
                )
                // on recupere le nom de l'etat
                .html(d.value);
        })
        .on("mouseout", function () {
            // on cache le toolip
            tooltip.classed("hidden", true);
        });

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
    var svg = d3.select('#barChart2')
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
        .attr('fill', 'steelblue')
        .on("mousemove", function (d) {
            // on recupere la position de la souris,
            d3.select(this).style("cursor", "pointer");
            var mousePosition = [d3.event.pageX, d3.event.pageY];
            // on affiche le toolip
            tooltip
                .classed("hidden", false)
                // on positionne le tooltip en fonction
                // de la position de la souris
                .attr(
                    "style",
                    "left:" +
                    (mousePosition[0] + 15) +
                    "px; top:" +
                    (mousePosition[1] - 35) +
                    "px"
                )
                // on recupere le nom de l'etat et la valeur
                .html(d.key + ": " + d.value);
        })
        .on("mouseout", function () {
            // on cache le toolip
            tooltip.classed("hidden", true);
        });

    // Ajouter l'axe des x
    svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x));

    // Ajouter l'axe des y
    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("display", "none");
    // Ajouter un titre au graphique
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 0 - margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text('Construction des pistes cyclables dans les communes de Lyon');
});

function showBarChart(mechanicalBikes, electricalBikes, stands, capacity) {
    document.getElementById("affichage").innerHTML += "<br><br><strong><span style='font-size: 15px;'>Ratio type de vélos disponibles : </span></strong><br><div id='barChartPlaces'></div>";

    // Définir les dimensions du graphique à barres
    var width = 300; // Ajustez la largeur selon vos besoins
    var height = 250; // Ajustez la hauteur selon vos besoins
    var iconSize = 40; // Ajustez la taille de l'icône selon vos besoins
    var marginTop = 20; // Ajustez la marge supérieure selon vos besoins
    var marginBottom = 40; // Ajustez la marge inférieure pour les étiquettes

    // Créer l'élément SVG du graphique à barres
    var svg = d3.select("#barChartPlaces")
        .append("svg")
        .attr("width", width)
        .attr("height", height + iconSize + marginTop + marginBottom); // Augmenter la hauteur pour les étiquettes

    // Appliquer une marge en haut et en bas de l'élément SVG
    svg.append("g")
        .attr("transform", "translate(0," + marginTop + ")");

    // Definir les données pour le graphique à barres
    var data = [
        { label: "Capacité", icon: "https://img.icons8.com/3d-fluency/94/parking.png", value: capacity },
        { label: "Libres", icon: "https://img.icons8.com/3d-fluency/94/bike-parking.png", value: stands },
        { label: "Mechaniques", icon: "https://img.icons8.com/3d-fluency/94/bicycle.png", value: mechanicalBikes },
        { label: "Electriques", icon: "https://img.icons8.com/3d-fluency/94/electric-bike.png", value: electricalBikes }
    ];

    // Definir l'échelle pour les couleurs
    var colorScale = d3.scaleOrdinal()
        .domain(data.map(function (d) { return d.label; }))
        .range(["#7fc97f", "#beaed4", "#fdc086", "#ffff99"]);

    // Définir l'échelle pour l'axe des x
    var xScale = d3.scaleBand()
        .domain(data.map(function (d) { return d.label; }))
        .range([0, width])
        .padding(0.2);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.value; }) + 5])
        .range([height, 0]);

    // Créer les dégradés pour les barres
    var gradient = svg.append("defs")
        .selectAll("linearGradient")
        .data(data)
        .enter().append("linearGradient")
        .attr("id", function (d) { return "gradient-" + d.label.replace(/\s+/g, ''); })
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", yScale(0))
        .attr("x2", 0)
        .attr("y2", function (d) { return yScale(d.value); });

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function (d) { return colorScale(d.label); });

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", function (d) { return d3.rgb(colorScale(d.label)).darker(); });

    // Créer les barres
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) { return xScale(d.label); })
        .attr("y", height) // Parametrer la position verticale à la hauteur initiale
        .attr("width", xScale.bandwidth())
        .attr("height", 0) // Parametrer la hauteur initiale à 0
        .attr("fill", function (d) {
            return "url(#gradient-" + d.label.replace(/\s+/g, '') + ")";
        })
        .attr("opacity", 0.8)
        .on("mouseover", function (d) {
            d3.select(this).transition()
                .duration(200)
                .attr("opacity", 1);
        })
        .on("mouseout", function (d) {
            d3.select(this).transition()
                .duration(200)
                .attr("opacity", 0.8);
        })
        .transition() // Ajouter une transition
        .delay(function (d, i) { return i * 200; }) // Délai de chargement de chaque barre
        .attr("y", function (d) { return yScale(d.value); })
        .attr("height", function (d) { return height - yScale(d.value); });

    // Ajouter des étiquettes pour chaque barre
    svg.selectAll("text.label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .text(function (d) { return d.value; })
        .attr("x", function (d) { return xScale(d.label) + xScale.bandwidth() / 2; })
        .attr("y", function (d) { return height + marginTop + 20; }) // Ajuster la position verticale
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "black");

    // Ajouter des icônes sous les barres
    svg.selectAll("image")
        .data(data)
        .enter()
        .append("image")
        .attr("x", function (d) { return xScale(d.label) + (xScale.bandwidth() - iconSize) / 2; })
        .attr("y", function (d) { return height + marginTop + 40; }) // Ajuster la position verticale
        .attr("width", iconSize)
        .attr("height", iconSize)
        .attr("xlink:href", function (d) { return d.icon; })
        .each(function (d) {
            // ajouter le text sous les icones
            svg.append("text")
                .text(d.label)
                .attr("x", xScale(d.label) + (xScale.bandwidth() - iconSize) / 2 + iconSize / 2)
                .attr("y", height + iconSize + 15)
                .attr("text-anchor", "middle")
                .attr("font-size", "9px")
                .attr("fill", "black");
        })
        .on("mouseover", function (d) {
            d3.select(this).transition()
                .duration(200)
                .attr("opacity", 1);
        })
        .on("mouseout", function (d) {
            d3.select(this).transition()
                .duration(200)
                .attr("opacity", 0.8);
        });

    // Ajouter des tooltips
    svg.selectAll("rect")
        .append("title")
        .text(function (d) { return d.label + " Loading: " + d.value; });
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
