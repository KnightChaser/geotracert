// Initialize the page
async function fetchTraceroute() {
    const ip = document.getElementById("target").value;
    const response = await fetch(`/traceroute/${ip}`);
    const data = await response.json();
    const table = document.getElementById("resultsTable").getElementsByTagName("tbody")[0];
    table.innerHTML = ""; // Clear previous results

    data.forEach(ipInfo => {
        const row = table.insertRow();
        const cellHop = row.insertCell();
        const cellIP = row.insertCell();
        const cellRTT = row.insertCell();
        const cellLocation = row.insertCell();
        const cellCountry = row.insertCell();
        const cellOrganization = row.insertCell();
        const cellMoreInfo = row.insertCell();

        // Handle null values and rounding of RTT
        cellHop.textContent = ipInfo.hop || "-";
        cellIP.innerHTML = "<code>" + ipInfo.ip + "</code>" || "-";
        if (isNaN(ipInfo.rtt))
            ipInfo.rtt = null;
        cellRTT.textContent = ipInfo.rtt ? `${(ipInfo.rtt * 1000).toFixed(3)} ms` : "-";
        cellLocation.textContent = (ipInfo.ip_details && ipInfo.ip_details.lat && ipInfo.ip_details.lon) ?
                                   `${ipInfo.ip_details.lat}, ${ipInfo.ip_details.lon}` : "-";
        cellCountry.textContent = ipInfo.ip_details ? ipInfo.ip_details.country : "-";
        if (ipInfo.ip_details && ipInfo.ip_details.countryCode)
            cellCountry.innerHTML = getFlagEmoji(ipInfo.ip_details.countryCode) + " " + cellCountry.innerHTML;
        cellOrganization.textContent = ipInfo.ip_details ? ipInfo.ip_details.org : "-";

        // Add a button to show more information
        // IP, Continent, country, region, regionName, city, district, zip, timezone, reverse 
        const moreInfoButton = document.createElement("button");
        moreInfoButton.setAttribute("class", "btn btn-primary");
        moreInfoButton.textContent = "More Info";
        cellMoreInfo.appendChild(moreInfoButton);
        moreInfoButton.onclick = () => {
        Swal.fire({
            title: "More Information",
            html: `
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
                            <td><code>${ipInfo.ip}</code></td>
                        </tr>
                        <tr>
                            <td>Continent</td>
                            <td>${ipInfo.ip_details.continent || "-"}</td>
                        </tr>
                        <tr>
                            <td>Country</td>
                            <td>${ipInfo.ip_details.country || "-"}</td>
                        </tr>
                        <tr>
                            <td>Region</td>
                            <td>${ipInfo.ip_details.region || "-"} (${ipInfo.ip_details.regionName || "-"})</td>
                        </tr>
                        <tr>
                            <td>City</td>
                            <td>${ipInfo.ip_details.city || "-"}</td>
                        </tr>
                        <tr>
                            <td>District</td>
                            <td>${ipInfo.ip_details.district || "-"}</td>
                        </tr>
                        <tr>
                            <td>ZIP</td>
                            <td>${ipInfo.ip_details.zip || "-"}</td>
                        </tr>
                        <tr>
                            <td>Timezone</td>
                            <td>${ipInfo.ip_details.timezone || "-"}</td>
                        </tr>
                        <tr>
                            <td>Reverse DNS</td>
                            <td>${ipInfo.ip_details.reverse || "-"}</td>
                        </tr>
                    </tbody>
                </table>`,
            confirmButtonText: "Close"
        });
    }});
}

// Get the flag emoji for a given country code
function getFlagEmoji(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char =>  127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}