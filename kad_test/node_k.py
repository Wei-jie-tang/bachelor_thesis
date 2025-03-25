from flask import Flask, request, jsonify
import asyncio
import random
import socket
from node import KadNode
from storage import store_data, get_data
import threading
import psutil

app = Flask(__name__)

# Initialize node dictionary and seed node details
nodes = {}
seed_node_ip = "127.0.0.1"
seed_node_port = 8468

def is_port_in_use(port):
    """Check if the given port is already in use."""
    for conn in psutil.net_connections(kind='inet'):
        if conn.laddr.port == port:
            return True
    return False

def get_available_port():
    """Get an available port by checking if it's in use and retrying until one is found."""
    while True:
        port = random.randint(1024, 65535)  # Get a random port in the valid range
        print(f"Checking port {port}...")

        if not is_port_in_use(port):  # Check if the port is in use initially
            try:
                # Try binding to the port
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)  # Allow reuse of the socket
                    s.bind(("127.0.0.1", port))  # Try binding to the port
                    s.close()  # Successfully bound the socket, now close it

                print(f"Port {port} is available.")
                return port  # Return the available port
            except OSError:
                print(f"Port {port} is in use after binding check, trying another one.")
                continue  # If binding fails, try another port
        else:
            print(f"Port {port} is already in use, trying another one.")

def run_async_task(coro):
    """Run an asynchronous task in the current event loop."""
    loop = asyncio.new_event_loop()  # Create a new event loop for the thread
    asyncio.set_event_loop(loop)  # Set this loop as the current event loop
    loop.run_until_complete(coro)  # Run the coroutine
    loop.close()  # Close the loop after the task completes

@app.route("/register", methods=["POST"])
def register_node():
    data = request.json
    print("Received data:", data)

    ip = data.get("ip")
    port = data.get("port")

    if not ip:
        return jsonify({"error": "Missing IP"}), 400

    # If no port is provided, assign a random available port
    if not port:
        port = get_available_port()

    node_id = f"{ip}:{port}"

    if node_id in nodes:
        return jsonify({"message": "Node already registered"}), 200

    # Create new node and start it asynchronously
    new_node = KadNode(node_id, int(port))

    # Running the async task in a background thread to avoid blocking Flask
    thread = threading.Thread(target=run_async_task, args=(new_node.start(),))
    thread.start()

    bootstrap_node = (seed_node_ip, seed_node_port) if len(nodes) > 0 else None
    if bootstrap_node:
        thread = threading.Thread(target=run_async_task, args=(new_node.start(bootstrap_node),))
        thread.start()

    nodes[node_id] = new_node

    return jsonify({"message": f"Node {node_id} registered"}), 201


@app.route("/store", methods=["POST"])
def store():
    data = request.json
    key = data.get("key")
    value = data.get("value")

    if not key or value is None:
        return jsonify({"error": "Missing key or value"}), 400

    if not nodes:
        return jsonify({"error": "No available nodes"}), 500

    first_node = list(nodes.values())[0]

    # Running store_data asynchronously
    thread = threading.Thread(target=run_async_task, args=(store_data(first_node.node, key, value),))
    thread.start()

    return jsonify({"message": f"Stored {key} → {value}"}), 200


@app.route("/get", methods=["GET"])
def get_value():
    key = request.args.get("key")
    if not key:
        return jsonify({"error": "Missing key"}), 400

    if not nodes:
        return jsonify({"error": "No available nodes"}), 500

    first_node = list(nodes.values())[0]
    print(f"Attempting to retrieve key: {key} from node {first_node.node}")
    result = asyncio.run(get_data(first_node.node, key))

    if result is None:
        return jsonify({"message": "Key not found"}), 404
    return jsonify({"key": key, "value": result}), 200


if __name__ == "__main__":
    # Initialize the seed node
    bootstrap_node = KadNode("seed", seed_node_port)
    asyncio.run(bootstrap_node.start())

    # Add the seed node to the nodes dictionary
    nodes[f"{seed_node_ip}:{seed_node_port}"] = bootstrap_node

    # Run Flask app on port 5002
    app.run(host="0.0.0.0", port=5002)
