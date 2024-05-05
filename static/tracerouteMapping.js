// tracerouteMapping.js

// Setup the amCharts map and expose functions to interact with it
let pointSeries, lineSeries = [], animatedLineSeries, chart, root;

// Load the map and set up the chart
am5.ready(function () {
    root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    chart = root.container.children.push(am5map.MapChart.new(root, {
        panX: "rotateX",
        panY: "rotateY",
        projection: am5map.geoMercator(),
        background: am5.Rectangle.new(root, {
            fill: am5.color(0x000000),
            fillOpacity: 1
        })
    }));

    let polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow,
        exclude: ["AQ"],
        fill: am5.color(0x222222),
        stroke: am5.color(0x00ff00),
        strokeWidth: 1.5
    }));

    // Enable tooltips
    polygonSeries.mapPolygons.template.set("tooltipText", "{name}");
    polygonSeries.mapPolygons.template.set("tooltipPosition", "fixed");

    // Point series for the hops
    pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    pointSeries.bullets.push(function() {
        let circle = am5.Circle.new(root, {
            radius: 7,
            fill: am5.color(0xff00ff),
            stroke: am5.color(0x00ff00),
            strokeWidth: 2,
            draggable: true,
            tooltipText: "{tooltipInfo}"
        });

        // Animation for blinking effect
        circle.animate({
            key: "scale",
            from: 1.5,
            to: 1,
            duration: 1500,
            easing: am5.ease.out(am5.ease.cubic)
        });

        return am5.Bullet.new(root, {
            sprite: circle
        });
    });

    // Line series for animation
    animatedLineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));
    animatedLineSeries.mapLines.template.setAll({
        stroke: am5.color(0x00ff00),
        strokeWidth: 3,
        strokeOpacity: 0.75,
    });

    // Add zoom control
    chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
    let currentMode = "map";

    // Switch between projections with the external button
    document.getElementById('toggleMapModeButton').addEventListener('click', function() {
        if (currentMode === "map") {
            chart.setAll({
                projection: am5map.geoOrthographic(),
                panX: "rotateX",
                panY: "rotateY"
            });
            currentMode = "globe";
        } else {
            chart.setAll({
                projection: am5map.geoMercator(),
                panX: "rotateX",
                panY: "rotateY"
            });
            currentMode = "map";
        }
    });    
});

// Expose functions to interact with the map
export function addPoint(latitude, longitude, hopNumber, ip, country, region, regionName) {
    pointSeries.pushDataItem({
        latitude: latitude,
        longitude: longitude,
        hopNumber: hopNumber,
        tooltipInfo: `[fontFamily: SF Mono]Hop: ${hopNumber}\nIP: ${ip}\nLatitude: ${latitude.toFixed(2)}, Longitude: ${longitude.toFixed(2)}\nLocation: ${country} ${region}(${regionName})`
    });
}

// Add a line between two points
export function addLine(sourceLatitude, sourceLongitude, destinationLatitude, destinationLongitude) {
    let lineDataItem = animatedLineSeries.pushDataItem({
        geometry: {
            type: "LineString",
            coordinates: [
                [sourceLongitude, sourceLatitude],
                [destinationLongitude, destinationLatitude]
            ]
        }
    });

    lineSeries.push(lineDataItem);
}

// Clear the map
export function clearMap() {
    pointSeries.data.clear();
    animatedLineSeries.data.clear();
    lineSeries = [];
}
