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
    });
}

// Get the flag emoji for a given country code
function getFlagEmoji(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char =>  127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}