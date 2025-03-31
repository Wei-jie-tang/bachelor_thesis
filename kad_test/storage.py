import asyncio

async def store_data(node ,key, value):
    """ Store a key-value pair in the network """
    node.set(key, value)
    print(f"[Stored] {key} → {value}")

async def get_data(node, key):
    """ Retrieve a value from the network """
    value = await node.get(key)
    if value:
        print(f"[Retrieved] {key} → {value}")
        return value
    else:
        print(f"[Not Found] {key}")
        return None
async def store_multiple(node, data_dict):
    """ Store multiple key-value pairs in the network. """
    results = {}
    for key, value in data_dict.items():
        results[key] = await store_data(node, key, value)
    return results

async def get_multiple(node, keys):
    """ Retrieve multiple values from the network. """
    results = {}
    for key in keys:
        results[key] = await get_data(node, key)
    return results

