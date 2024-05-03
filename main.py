from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse    
import subprocess
import shlex
import re
import httpx
import asyncio

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

@app.get("/traceroute/{ip_address}")
async def run_traceroute(ip_address: str):
    if not is_valid_ip(ip_address):
        raise HTTPException(status_code=400, detail="Invalid IP address format")

    # command = f"traceroute {shlex.quote(ip_address)}"
    command = f"tracert {shlex.quote(ip_address)}"
    process = subprocess.Popen(
        command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()

    if process.returncode == 0:
        data = stdout.decode()
        ip_pattern = re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')
        ips = ip_pattern.findall(data)

        # Asynchronously fetch IP details
        return await fetch_ip_details(ips)
    else:
        return JSONResponse(status_code=500, content={"error": stderr.decode()})

async def fetch_ip_details(ips):
    async with httpx.AsyncClient() as client:
        tasks = [client.get(f"http://ip-api.com/json/{ip}") for ip in ips]
        # Simultaneously fetch IP details via async requests
        responses = await asyncio.gather(*tasks)
        ip_info_list = [response.json() for response in responses if response.status_code == 200]
        return JSONResponse(content={"IP Details": ip_info_list})

def is_valid_ip(ip: str) -> bool:
    parts = ip.split('.')
    if len(parts) != 4:
        return False
    for part in parts:
        if not part.isdigit() or not 0 <= int(part) <= 255:
            return False
    return True