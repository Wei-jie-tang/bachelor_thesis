import asyncio
import json
import sys
import random
from kademlia.network import Server

node = Server()
bootstrap_ip = None
port = random.randint(30000, 40000)  # Use a random available port

async def start_node():
    """Start the Kademlia node on a random port."""
    await node.listen(port)
    print(f"Node started on port {port}", flush=True)
    print(json.dumps({"status": "node_started", "port": port}), flush=True)

async def bootstrap_if_needed(given_ip):
    """Bootstrap the network if no bootstrap node exists."""
    global bootstrap_ip
    if bootstrap_ip is None:  # No bootstrap node exists
        bootstrap_ip = given_ip
        print(f"Bootstrap created with IP {bootstrap_ip}", flush=True)
        print(json.dumps({"status": "bootstrap_created", "ip": bootstrap_ip}), flush=True)
    else:  # Bootstrap already exists, join the network
        try:
            await node.bootstrap([(bootstrap_ip, port)])
            print(f"Bootstrapped using IP {bootstrap_ip}", flush=True)
            print(json.dumps({"status": "bootstrapped", "ip": bootstrap_ip}), flush=True)
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)

async def register_node(ip, address, given_ip):
    """Ensure bootstrap, then register node address -> IP in the DHT."""
    await bootstrap_if_needed(given_ip)
    await node.set(address, ip)
    print(json.dumps({"status": "registered", "address": address, "ip": ip}), flush=True)

async def get_node_ip(address):
    """Retrieve the IP of a registered node."""
    value = await node.get(address)
    if value:
        print(json.dumps({"status": "found", "address": address, "ip": value}), flush=True)
    else:
        print(json.dumps({"status": "not_found", "address": address}), flush=True)

async def process_command(command):
    """Handle commands received from Node.js."""
    try:
        data = json.loads(command)
        if data["action"] == "start":
            await start_node()
        elif data["action"] == "register":
            await register_node(data["ip"], data["address"], data["ip"])
        elif data["action"] == "get":
            await get_node_ip(data["address"])
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)

async def main():
    """Listen for commands from Node.js via stdin."""
    while True:
        command = sys.stdin.readline().strip()
        if command:
            await process_command(command)

if __name__ == "__main__":
    asyncio.run(main())
