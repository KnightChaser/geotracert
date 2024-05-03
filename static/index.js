async function fetchTraceroute() {
    const ip = document.getElementById('ipAddress').value;
    const response = await fetch(`/traceroute/${ip}`);
    const data = await response.json();
    const table = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    table.innerHTML = ""; // Clear previous results
    data['IP Details'].forEach(ipInfo => {
        const row = table.insertRow();
        const ipCell = row.insertCell(0);
        const detailsCell = row.insertCell(1);
        ipCell.textContent = ipInfo.query;
        detailsCell.textContent = JSON.stringify(ipInfo, null, 2);
    });
}