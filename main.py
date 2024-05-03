from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse    
from networking import traceroute 
import sys
import re
import httpx
import asyncio
from rich.console import Console

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

# Get IP details for a given IP/URL address
@app.get("/traceroute/{target}")
async def run_traceroute(target: str):

    # Run the traceroute function
    try:
        traceroute_result:list[dict] = traceroute(target)
        
        # Get the details of the available IP addresses, and append them to the traceroute result,
        # To the each hop in the traceroute result, we will add the IP details
        available_ip_lists:list[str] = [hop["ip"] for hop in traceroute_result if re.match(r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", hop["ip"])]
        ip_details = await fetch_ip_details(available_ip_lists)
        
        for hop in traceroute_result:
            if hop["ip"] in ip_details["ip_details"]:
                hop["ip_details"] = ip_details["ip_details"][hop["ip"]]

        return JSONResponse(content = traceroute_result)
    except Exception as exception:
        raise HTTPException(status_code = 400, detail = str(exception))

# Fetch IP details for a list of IP addresses
async def fetch_ip_details(ips: list[str]) -> dict:
    console:Console = Console()
    ip_details:dict = {}

    async with httpx.AsyncClient() as client:
        tasks = [client.get(f"http://ip-api.com/json/{ip}?fields=status,message,continent,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,isp,org,as,reverse,query") for ip in ips]
        # Simultaneously fetch IP details via async requests
        responses = await asyncio.gather(*tasks)
        for response in responses:
            if response.status_code != 200:
                console.log(f"[bold red]Failed to fetch IP details for [/bold red][red]{response.url}")
                continue
            else:
                console.log(f"[bold green]Successfully fetched IP details for [/bold green][green]{response.url}")
            ip_info = response.json()
            ip_details[ip_info["query"]] = ip_info
    
    return {"ip_details": ip_details}