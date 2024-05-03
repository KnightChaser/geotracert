import socket
import struct
import time
from scapy.all import IP, UDP, sr1
from rich.console import Console

# Check if the given IP is valid
def is_valid_ip(ip:str) -> bool:
    try:
        socket.inet_aton(ip)
        return True
    except socket.error:
        return False
    
# Check if the given URL is valid
def is_valid_url(url:str) -> bool:
    try:
        socket.gethostbyname(url)
        return True
    except socket.error:
        return False

# A custom exception class for invalid IP address
def traceroute(destination:str, max_hops:int = 30, timeout_in_second:int = 3) -> list:
    if not destination:
        raise ValueError("Destination IP address is required")
    else:
        # Check if the given destination is a valid IP address or URL
        if not is_valid_ip(destination) and not is_valid_url(destination):
            raise ValueError(f"Invalid destination IP address or URL: {destination}")
    
    destination_ip:str = socket.gethostbyname(destination)
    if not destination_ip:
        raise ValueError(f"Invalid destination IP address: {destination}")
    
    port = 33434
    ttl  = 1
    result:list[dict] = []
    console:Console = Console()                         # For rich console output

    while True:
        ip_packet:IP = IP(dst=destination_ip, ttl=ttl)
        udp_packet:UDP = UDP(dport=port)
        packet:IP = ip_packet/udp_packet                # Combine IP and UDP packets
        reply:IP = sr1(packet, verbose=False, timeout=timeout_in_second)

        if reply is None:
            result.append({
                "hop": ttl,
                "ip": "*",
                "rtt": "Request timed out"
            })
        elif reply.type == 3:
            # Means the destination is reached
            result.append({
                "hop": ttl,
                "ip": reply.src,
                "rtt": reply.time - packet.sent_time
            })
        else:
            # Means the packet has reached an intermediate router
            result.append({
                "hop": ttl,
                "ip": reply.src,
                "rtt": reply.time - packet.sent_time
            })

        reply_source:str = reply.src if reply is not None else "*"
        reply_time:float = reply.time - packet.sent_time if reply is not None else "Request timed out"
        console.log(f"[bold]Hop:[/bold] {ttl} [bold]IP:[/bold] {reply_source} [bold]RTT:[/bold] {reply_time}")

        ttl += 1
        # Check if reply object has "type" attribute and its value is 3
        if ttl > max_hops or (reply is not None and reply.type == 3):
            break

    return result