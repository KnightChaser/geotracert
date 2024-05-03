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
        const cellDetails = row.insertCell();

        // Handle null values and rounding of RTT
        cellHop.textContent = ipInfo.hop || "-";
        cellIP.textContent = ipInfo.ip || "-";
        cellRTT.textContent = ipInfo.rtt ? `${Math.round(ipInfo.rtt * 1000)} ms` : "-";
        cellLocation.textContent = (ipInfo.ip_details && ipInfo.ip_details.lat && ipInfo.ip_details.lon) ?
                                   `${ipInfo.ip_details.lat}, ${ipInfo.ip_details.lon}` : "-";
        
        const detailsText = ipInfo.ip_details ? `
            Continent: ${ipInfo.ip_details.continent || "-"}\n
            Country: ${ipInfo.ip_details.country || "-"} (${ipInfo.ip_details.countryCode || "-"})\n
            Region: ${ipInfo.ip_details.regionName || "-"} (${ipInfo.ip_details.region || "-"})\n
            City: ${ipInfo.ip_details.city || "-"}\n
            ISP: ${ipInfo.ip_details.isp || "-"}\n
            Org: ${ipInfo.ip_details.org || "-"}\n
            AS: ${ipInfo.ip_details.as || "-"}
        ` : "-";

        cellDetails.textContent = detailsText.trim();
    });
}
