let startTime;
let hopCount = 0;

async function fetchTraceroute() {
    resetCounters();
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
        // Reset the counters and start timing on WebSocket open
        resetCounters();
        swalToastMessage.fire({
            icon: "info",
            title: "Traceroute started to <code>" + target + "</code>"
        });
    };

    ws.onmessage = function(event) {
        const ipInfo = JSON.parse(event.data);
        const row = table.insertRow();
        appendHopInfo(row, ipInfo);

        // Update counters
        hopCount++;
        document.getElementById("hopCounterNumber").setAttribute('value', hopCount);
        document.getElementById("timeCounterNumber").setAttribute('value', Date.now() - startTime);

        // Add the blink class
        row.classList.add("blink");
        row.addEventListener('animationend', () => {
            row.classList.remove("blink");
        });
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
    document.getElementById("hopCounterNumber").setAttribute('value', 0);
    document.getElementById("timeCounterNumber").setAttribute('value', 0);
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
    moreInfoButton.textContent = "More Info";
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