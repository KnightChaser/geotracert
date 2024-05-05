am5.ready(function () {
    // Create a root element
    let root = am5.Root.new("chartdiv");

    // Set themes
    root.setThemes([
        am5themes_Animated.new(root)
    ]);

    // Create map chart with a dark background
    let chart = root.container.children.push(
        am5map.MapChart.new(root, {
            panX: "rotateX",
            panY: "rotateY",
            projection: am5map.geoNaturalEarth1(),
            background: am5.Rectangle.new(root, {
                fill: am5.color(0x000000),
                fillOpacity: 1
            })
        })
    );

    // Create polygon series with neon effects and tooltips
    let polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
            geoJSON: am5geodata_worldLow,
            exclude: ["AQ"],
            fill: am5.color(0x222222),
            stroke: am5.color(0x00ff00),
            strokeWidth: 1.5
        })
    );

    // Enable tooltips
    polygonSeries.mapPolygons.template.setAll({
        tooltipText: "{name}", // Uses the 'name' field from the geoJSON data
        tooltipPosition: "fixed"
    });

    // Configure tooltips appearance
    root.tooltipContainer.setAll({
        background: am5.Rectangle.new(root, {
            fill: am5.color(0x000000),
            fillOpacity: 0.7,
            stroke: am5.color(0x00ff00),
            strokeWidth: 2
        }),
        autoTextColor: false,
        textColor: am5.color(0x00ff00)
    });

    // Create point series for the traceroute path
    let pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));

    pointSeries.bullets.push(function () {
        let circle = am5.Circle.new(root, {
            radius: 7,
            tooltipY: 0,
            fill: am5.color(0xff00ff),
            stroke: root.interfaceColors.get("background"),
            strokeWidth: 2,
            draggable: true,
        });

        return am5.Bullet.new(root, {
            sprite: circle,
        });
    });

    // Optional: Add zoom control with styled buttons
    let zoomControl = chart.set("zoomControl", am5map.ZoomControl.new(root, {
        layout: root.verticalLayout,
        plusButton: {
            background: am5.Circle.new(root, {
                fill: am5.color(0x00ff00)
            })
        },
        minusButton: {
            background: am5.Circle.new(root, {
                fill: am5.color(0x00ff00)
            })
        }
    }));
});
