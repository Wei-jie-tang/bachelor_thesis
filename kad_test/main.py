import asyncio
from node import Node
from storage import store_data, get_data, store_multiple, get_multiple
async def main():
    # Start Node 1 (Bootstrap Node)
    node1 = Node(8468)
    await node1.start()

    # Start Node 2 and connect to Node 1
    node2 = Node(8470)
    await node2.start(("127.0.0.1", 8468))
    await store_data(node2.node, "temperature2", "15°C")
    node3 = Node(8471)
    await node3.start(("127.0.0.1", 8468))
    node4 = Node(8472)
    await node4.start(("127.0.0.1", 8468))
    node5 = Node( 8473)
    await node5.start(("127.0.0.1", 8468))

    # Store & Retrieve Data
    await store_data(node1.node, "temperature1", "25°C")
    await asyncio.sleep(2)  # Allow propagation
    #await store_data(node2.node, "temperature2", "15°C")
    #await asyncio.sleep(2)  
    await store_data(node3.node, "temperature3", "5°C")
    await asyncio.sleep(2)  
    await store_data(node4.node, "temperature4", "20°C")
    await asyncio.sleep(2)  
    await store_data(node5.node, "temperature5", "2°C")
    await asyncio.sleep(2)  
    await get_data(node2.node, "temperature1")
    await get_data(node2.node, "temperature2")
    await get_data(node2.node, "temperature3")
    await get_data(node2.node, "temperature4")
    await get_data(node2.node, "temperature5")
    await get_data(node3.node, "temperature1")
    await get_data(node3.node, "temperature2")
    await get_data(node3.node, "temperature3")
    await get_data(node3.node, "temperature4")
    await get_data(node3.node, "temperature5")
    await store_multiple(node1.node, {"name": "Bob", "age": "25", "city": "Berlin"})
    
    # Retrieve multiple values
    results = await get_multiple(node1.node, ["name", "age", "city", "unknown"])
    print(f"Retrieved multiple values: {results}")

    # Start auto-refresh on node1
    #asyncio.create_task(refresh_data(node1.node, "temperature", "25°C"))

    #await asyncio.sleep(3600)  # Run for 1 hour

# Run the event loop
asyncio.run(main())
