import asyncio
import random
import sys
import json
from kademlia.network import Server
from node import Node
from storage import store_data, get_data

# Initialize Kademlia server
node_instances = {}
bootstrap_ip = "172.25.1.4"
bootstrap_port = 4444

async def start_node(ip,address):
    """Start the Kademlia node and set bootstrap IP if needed."""
    global bootstrap_ip, bootstrap_port, node_instances
    
    try:
        port = random.randint(30000, 40000)
        node_name = f"node_{ip}_{port}"
        node = Node(port)  # Create a new node instance
        node_instances[node_name] = node
        
        print(f"Node started on port {port}", flush=True)

        # First node becomes the bootstrap node
        if bootstrap_ip is None:
            bootstrap_ip = ip
            bootstrap_port = port
            print(f"Bootstrap node set to {bootstrap_ip}:{bootstrap_port}", flush=True)
            await asyncio.sleep(2) 
        else:
            
                bootstrap_node = (bootstrap_ip, bootstrap_port) 
                node.start(bootstrap_node)  # Start node with the bootstrap node
                await asyncio.sleep(2) 
                print(f"Bootstrapped with {bootstrap_ip}:{bootstrap_port}", flush=True)

        await store_data(node.node, address, ip)
        print(f"Successfully registered {address} -> {ip}", flush=True)

        return {"status": "started_and_registered", "node_name": node_name}
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)

async def register_node(ip, address, node_name):
    """Ensure bootstrap, then store node address -> IP in the DHT."""
    node = node_instances.get(node_name)
    await store_data(node.node, address, ip)
    print(json.dumps({"status": "registered", "address": address, "ip": ip}), flush=True)

async def get_node_ip(address):
    """Retrieve the IP of a registered node."""
    if not node_instances:
        return {"status": "error", "message": "No nodes available in the network"}
    
    node = next(iter(node_instances.values()), None)
    if node is None:
        return {"status": "error", "message": "No valid node found"}
    
    value = get_data(node.node, address)
    if value:
        return {"status": "found", "address": address, "ip": value}
    else:
        return {"status": "not_found", "address": address}

# Main loop to listen for commands from Node.js
if __name__ == "__main__":
    # Start a node and run forever to handle commands from Node.js
    loop = asyncio.get_event_loop()

    # This loop will continue running until we manually stop it
    while True:
        data = sys.stdin.readline().strip()
        if data:
            command = json.loads(data)

            if command["action"] == "start_node":
                ip = command["ip"]
                address = command["address"]
                node_name = asyncio.run(start_node(ip,address))
                sys.stdout.write(json.dumps({"status": "started", "node_name": node_name}) + "\n")
                sys.stdout.flush()

            elif command["action"] == "register_node":
                ip = command["ip"]
                address = command["address"]
                node_name = command["node_name"]
                asyncio.run(register_node(ip, address, node_name))
                sys.stdout.write(json.dumps({"status": "registered"}) + "\n")
                sys.stdout.flush()

            elif command["action"] == "get_node_ip":
                address = command["address"]
                result = asyncio.run(get_node_ip(address))
                sys.stdout.write(json.dumps(result) + "\n")
                sys.stdout.flush()
