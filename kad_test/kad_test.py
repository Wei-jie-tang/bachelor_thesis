import asyncio
import json
import socket
import random
from flask import Flask, request, jsonify
from kademlia.network import Server
from node import Node
from storage import store_data, get_data
app = Flask(__name__)

# Initialize Kademlia server
node_instances = {}
bootstrap_ip = None
bootstrap_port= None
async def start_node(ip):
    """Start the Kademlia node and set bootstrap IP if needed."""
    global bootstrap_ip, bootstrap_port
   

    try:
        
        port = random.randint(30000, 40000)
        node_name = f"node_{ip}_{port}" 
        node = Node(port)  # Create a new node instance
        node_instances[node_name] = node
       
        
     
        print(f"Node started on port {port}", flush=True)

        if bootstrap_ip is None:
            bootstrap_ip = ip 
             # Use the given IP as bootstrap
            bootstrap_port = port 
            print(f"Bootstrap node set to {bootstrap_ip}", flush=True)
            print(json.dumps({"status": "bootstrap_created", "ip": bootstrap_ip, "port": port}), flush=True)
            await asyncio.sleep(2) 
        else:
            try:
                bootstrap_node = (bootstrap_ip, bootstrap_port) 
                node.start(bootstrap_node)

                await asyncio.sleep(2) 
                print(f"Bootstrapped with {bootstrap_ip}:{bootstrap_port}", flush=True)
                print(json.dumps({"status": "bootstrapped", "ip": bootstrap_ip, "port": bootstrap_port}), flush=True)
            except Exception as e:
                print(json.dumps({"error": str(e)}), flush=True)
        return node_name
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)


async def register_node(ip, address,node_name):
    """Ensure bootstrap, then store node address -> IP in the DHT."""
    node = node_instances.get(node_name)
    await store_data(node.node,address, ip)
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
        #return {"status": "found", "address": address, "ip": value}
        return {value}
    else:
        return {"status": "not_found", "address": address}

@app.route("/register_store", methods=["POST"])
def register_store():
    """Handle node registration and store a key-value pair in the DHT."""
    

    data = request.get_json()
    ip = data.get("ip")
    address = data.get("address")
    key = data.get("address")
    value = data.get("ip")

    if not ip or not address:
        return jsonify({"error": "Missing required fields: 'ip', 'address'"}), 400
    
    node_name=asyncio.run(start_node(ip))

    asyncio.run(register_node(ip, address,node_name))


    return jsonify({"status": "registered_and_stored", "address": address, "ip": ip}), 200


@app.route("/get", methods=["POST"])
async def get():
    """Retrieve a value from the DHT."""
    data = request.get_json()  # Get the data from the request (this is synchronous)
    address = data.get("address")  # Extract 'address' from the JSON request body
    
    if address:
        # Await the result of get_node_ip, which should return a dictionary
        value =  await get_node_ip(address)  # Await the async function call

     
        
            
        return jsonify(value), 404
        
    else:
        # If 'address' is not in the request, return a 400 error
        return jsonify({"error": "Missing required field: 'address'"}), 400

if __name__ == "__main__":
   
    asyncio.run(start_node("0.0.0.0"))
    asyncio.run(start_node("0.0.0.0"))
    asyncio.run(start_node("0.0.0.0"))
    app.run(host="0.0.0.0", port=5002, threaded=True)  # Start Flask HTTP server
