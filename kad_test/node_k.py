from flask import Flask, request, jsonify
import asyncio
from kademlia.network import Server

app = Flask(__name__)

node = Server()

@app.route("/start", methods=["POST"])
def start_node():
    port = request.json.get("port", 8468)
    asyncio.run(node.listen(port))
    return jsonify({"success": True, "message": "Node started", "port": port})

@app.route("/store", methods=["POST"])
def store_data():
    key = request.json["key"]
    value = request.json["value"]
    asyncio.run(node.set(key, value))
    return jsonify({"success": True, "message": f"Stored {key} → {value}"})

@app.route("/get", methods=["GET"])
def get_data():
    key = request.args.get("key")
    value = asyncio.run(node.get(key))
    return jsonify({"success": True, "value": value})

if __name__ == "__main__":
    app.run(host="0.0.0.0",port=5001)
