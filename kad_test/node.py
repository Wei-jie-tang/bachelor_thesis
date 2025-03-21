from flask import Flask, request, jsonify
import asyncio
from kademlia.network import Server

class KadNode:
    def __init__(self, node_id, port):
        self.node = Server()
        self.node_id = node_id 
        self.port = port
        

    async def start(self, bootstrap_node=None):
        await self.node.listen(self.port)
        if bootstrap_node:
            await self.node.bootstrap([bootstrap_node])
    
    async def stop(self):
        self.node.stop()
