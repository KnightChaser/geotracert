// tracerouteMapping.js

// Setup the amCharts map and expose functions to interact with it
// Expose these functions to the global scope
let pointSeries, lineSeries = [], chart, root;

am5.ready(function () {
    root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    chart = root.container.children.push(am5map.MapChart.new(root, {
        panX: "rotateX",
        panY: "rotateY",
        projection: am5map.geoNaturalEarth1(),
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

    polygonSeries.mapPolygons.template.setAll({
        tooltipText: "{name}",
        tooltipPosition: "fixed"
    });

    pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    pointSeries.bullets.push(function () {
        return am5.Bullet.new(root, {
            sprite: am5.Circle.new(root, {
                radius: 7,
                fill: am5.color(0xff00ff),
                stroke: root.interfaceColors.get("background"),
                strokeWidth: 2,
                draggable: true,
            })
        });
    });
});

// Function to add points to the map
export function addPoint(latitude, longitude) {
    pointSeries.pushDataItem({
        latitude: latitude,
        longitude: longitude
    });
}

// Function to add lines to the map
export function addLine(sourceLatitude, sourceLongtitude, destinationLatitude, destinationLongtitude) {
    let lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));
    let previousPointObject = pointSeries.pushDataItem({
        latitude: sourceLatitude, 
        longitude: sourceLongtitude
    });
    let currentPointObject = pointSeries.pushDataItem({
        latitude: destinationLatitude, 
        longitude: destinationLongtitude
    });
    
    lineSeries.pushDataItem({
        pointsToConnect: [
            previousPointObject,
            currentPointObject
        ]
    });

    lineSeries.mapLines.template.setAll({
        stroke: am5.color(0xff0000),
        strokeWdith: 2,
        strokeOpacity: 0.75
    });
}

// Function to clear the map
export function clearMap() {
    // Clear all points
    pointSeries.data.clear();

    // Clear all lines by removing all line series from the chart
    lineSeries.forEach(series => {
        chart.series.removeIndex(chart.series.indexOf(series)).dispose();
    });

    // Reset the line series array
    lineSeries = [];
}