import { addPoint, addLine, clearMap } from '/static/tracerouteMapping.js';

let startTime;
let hopCount = 0;
let packetTravelledKm = 0;
let previousLatitude = null;
let previousLongitude = null;

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('runTracerouteButton').addEventListener('click', fetchTraceroute);
});

async function fetchTraceroute() {
    
    resetCounters();
    clearMap();

    const target = document.getElementById("target").value;
    if (!target) {
        Swal.fire({
            icon: "error",
            title: "Where's the target?",
            text: "Please enter a valid IP address or URL"
        });
        return;
    }

    // A toast message to inform the user
    const swalToastMessage = Swal.mixin({
        toast: true,
        position: "top",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
            popup: "colored-toast"
        }
    });

    // Open a WebSocket connection to the server
    const ws = new WebSocket(`ws://${window.location.host}/ws/traceroute/${target}`);
    const table = document.getElementById("resultsTable").getElementsByTagName("tbody")[0];
    table.innerHTML = ""; // Clear previous results
    startTime = Date.now(); // Start timing

    ws.onopen = function() {
        // Reset the counters and start timing on WebSocket open,
        // Also, clear the map and the table
        resetCounters();
        clearMap();

        swalToastMessage.fire({
            icon: "info",
            title: "Traceroute started to <code>" + target + "</code>"
        });
    };

    // Store the previous tracked traceroute hop's coordinates and the current
    let traceroutePointCoordinates = {
        "previous": {
            "latitude": null,
            "longitude": null
        },
        "current": {
            "latitude": null,
            "longitude": null
        }
    };

    // Handle incoming messages from the server
    // (Via websocket, the server sends the traceroute hop information as JSON objects in simultaneous chunks)
    ws.onmessage = function(event) {
        const ipInfo = JSON.parse(event.data);
        const row = table.insertRow();
        appendHopInfo(row, ipInfo);

        // Update counters
        hopCount++;
        document.getElementById("hopCounterNumber").setAttribute('value', hopCount);
        document.getElementById("timeCounterNumber").setAttribute('value', Date.now() - startTime);

        // Calculate the distance between the previous and current traceroute hop
        // Skip the first hop since there is no previous hop to calculate the distance
        // Skip if the current hop's coordinates are not available
        if (hopCount > 1 && ipInfo.ip_details 
                && ipInfo.ip_details.lat && ipInfo.ip_details.lon) {
            // Update the packet travelled distance counter
            traceroutePointCoordinates.previous.latitude = traceroutePointCoordinates.current.latitude;
            traceroutePointCoordinates.previous.longitude = traceroutePointCoordinates.current.longitude;
            traceroutePointCoordinates.current.latitude = ipInfo.ip_details.lat;
            traceroutePointCoordinates.current.longitude = ipInfo.ip_details.lon;

            // Calculate the distance between the previous and current traceroute hop
            const distance = calculateDistanceFromTwoCoordinatesEarth(
                traceroutePointCoordinates.previous.latitude,
                traceroutePointCoordinates.previous.longitude,
                traceroutePointCoordinates.current.latitude,
                traceroutePointCoordinates.current.longitude
            );

            // If the previous hop's coordinates are not available, the distance is calculated as zero, just update the traceroutePointCoordinates object
            if (traceroutePointCoordinates.previous.latitude && traceroutePointCoordinates.previous.longitude) {
                // Update the packet travelled distance counter
                packetTravelledKm += Math.round(distance);
                document.getElementById("packetTravelledDistanceCounterNumber").setAttribute('value', packetTravelledKm);
            }
        }

        // Add the blink class
        row.classList.add("blink");
        row.addEventListener('animationend', () => {
            row.classList.remove("blink");
        });

        // Add the traceroute hop to the map
        if (ipInfo.ip_details && ipInfo.ip_details.lat && ipInfo.ip_details.lon) {
            addPoint(ipInfo.ip_details.lat, 
                     ipInfo.ip_details.lon,
                     hopCount,
                     ipInfo.ip,
                     ipInfo.ip_details.country,
                     ipInfo.ip_details.region,
                     ipInfo.ip_details.regionName);
            if (previousLatitude != null && previousLongitude != null) {
                addLine(previousLatitude, 
                        previousLongitude, 
                        ipInfo.ip_details.lat, 
                        ipInfo.ip_details.lon);
            }
            previousLatitude = ipInfo.ip_details.lat;
            previousLongitude = ipInfo.ip_details.lon;
        }
    };

    ws.onerror = function() {
        console.error("WebSocket error occurred");
        swalToastMessage.fire({
            icon: "error",
            title: "An error occurred during the traceroute"
        });
    };

    ws.onclose = function() {
        console.log("WebSocket connection closed");
        swalToastMessage.fire({
            icon: "success",
            title: "Traceroute completed"
        });
    };
}

function resetCounters() {
    hopCount = 0;
    packetTravelledKm = 0;
    document.getElementById("hopCounterNumber").setAttribute('value', 0);
    document.getElementById("timeCounterNumber").setAttribute('value', 0);
    document.getElementById("packetTravelledDistanceCounterNumber").setAttribute('value', 0);
}

// Helper function to append traceroute hop information to the table
function appendHopInfo(row, ipInfo) {
    // Insert cells for each piece of traceroute data
    const cellHop = row.insertCell();
    const cellIP = row.insertCell();
    const cellRTT = row.insertCell();
    const cellLocation = row.insertCell();
    const cellCountry = row.insertCell();
    const cellOrganization = row.insertCell();
    const cellMoreInfo = row.insertCell();

    // Populate cells with traceroute data
    cellHop.textContent = ipInfo.hop || "-";
    cellIP.innerHTML = `<code>${ipInfo.ip}</code>` || "-";
    cellRTT.textContent = ipInfo.rtt ? `${(ipInfo.rtt * 1000).toFixed(3)} ms` : "-";
    cellLocation.textContent = ipInfo.ip_details && ipInfo.ip_details.lat && ipInfo.ip_details.lon ? `${ipInfo.ip_details.lat}, ${ipInfo.ip_details.lon}` : "-";
    cellCountry.textContent = ipInfo.ip_details ? ipInfo.ip_details.country : "-";
    cellOrganization.textContent = ipInfo.ip_details ? ipInfo.ip_details.org : "-";

    // Add flag emoji if country code is available
    if (ipInfo.ip_details && ipInfo.ip_details.countryCode) {
        cellCountry.innerHTML = `${getFlagEmoji(ipInfo.ip_details.countryCode)} ${cellCountry.textContent}`;
    }

    // Add a button to display more detailed information
    const moreInfoButton = document.createElement("button");
    moreInfoButton.className = "btn btn-primary";
    // Search icon from Bootstrap Icons
    moreInfoButton.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-search' viewBox='0 0 16 16'><path d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0'/></svg>" 
    moreInfoButton.onclick = () => showMoreInfo(ipInfo);
    cellMoreInfo.appendChild(moreInfoButton);
}

// Function to display detailed information in a modal popup
function showMoreInfo(ipInfo) {
    Swal.fire({
        title: 'More Information',
        html: generateDetailsTable(ipInfo.ip_details),
        confirmButtonText: 'Close'
    });
}

// Generate HTML content for the details table
function generateDetailsTable(ipInfo) {
    // Check if ipInfo exists and create fallback for missing data
    if (!ipInfo) {
        ipInfo = {};
        console.error("No IP information available for this hop");
    }

    // Define default value function to handle possibly undefined properties
    // Prevents "undefined" from being displayed in the table
    const getValue = (property) => {
        return ipInfo[property] ? ipInfo[property] : "-";
    };

    // Template for generating HTML table
    const tableHTML = `
        <table class='table'>
            <thead>
                <tr>
                    <th>Key</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>IP Address</td>
                    <td><code>${getValue('query')}</code></td>
                </tr>
                <tr>
                    <td>Continent</td>
                    <td>${getValue('continent')}</td>
                </tr>
                <tr>
                    <td>Country</td>
                    <td>${getValue('country')}</td>
                </tr>
                <tr>
                    <td>Region</td>
                    <td>${getValue('region')} (${getValue('regionName')})</td>
                </tr>
                <tr>
                    <td>City</td>
                    <td>${getValue('city')}</td>
                </tr>
                <tr>
                    <td>District</td>
                    <td>${getValue('district')}</td>
                </tr>
                <tr>
                    <td>ZIP</td>
                    <td>${getValue('zip')}</td>
                </tr>
                <tr>
                    <td>Timezone</td>
                    <td>${getValue('timezone')}</td>
                </tr>
                <tr>
                    <td>Reverse DNS</td>
                    <td><code>${getValue('reverse')}</code></td>
                </tr>
            </tbody>
        </table>`;

    return tableHTML;
}

// Function to generate flag emoji from a country code
function getFlagEmoji(countryCode) {
    const codePoints = countryCode.toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// Calculate the Euclidean distance between two coordinates on Earth(geodesic distance)
function calculateDistanceFromTwoCoordinatesEarth(latitude1, longtitude1, latitude2, longtitude2) {
    // Convert degrees to radians
    function degreeToRadian(deg) {
        return deg * Math.PI / 180;
    }

    const radius = 6371; // Earth radius in km
    const distanceLatitudes = degreeToRadian(latitude2 - latitude1);
    const distanceLongtitudes = degreeToRadian(longtitude2 - longtitude1);

    // Haversine formula
    const a = Math.sin(distanceLatitudes / 2) * Math.sin(distanceLatitudes / 2) +
              Math.cos(degreeToRadian(latitude1)) * Math.cos(degreeToRadian(latitude2)) *
              Math.sin(distanceLongtitudes / 2) * Math.sin(distanceLongtitudes / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = radius * c;
    return distance;
}