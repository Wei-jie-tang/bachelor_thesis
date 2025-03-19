import asyncio

async def refresh_data(node, key, value, interval=600):
    """ Re-store data every `interval` seconds """
    while True:
        await asyncio.sleep(interval)
        await node.set(key, value)
        print(f"[Refreshed] {key} → {value}")
