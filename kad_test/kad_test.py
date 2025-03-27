import asyncio
import json
import subprocess
import time

def start_python_process():
    """Start a new Python subprocess running the Kademlia node."""
    return subprocess.Popen(
        ["python3", "kademlia_service.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

def send_command(process, command):
    """Send JSON command to the Python process and return response."""
    process.stdin.write(json.dumps(command) + "\n")
    process.stdin.flush()
    time.sleep(1)  # Wait for response
    return process.stdout.readline().strip()

def main():
    """Test Kademlia network."""
    print(" Starting Bootstrap Node...")
    bootstrap_process = start_python_process()
    response = send_command(bootstrap_process, {"action": "start"})
    print("🔹 Bootstrap Node:", response)

    bootstrap_info = json.loads(response)
    bootstrap_ip = "127.0.0.1"
    bootstrap_port = bootstrap_info.get("port")

    print("\nStarting Node 1 and Registering...")
    node1_process = start_python_process()
    response = send_command(node1_process, {
        "action": "register",
        "ip": "192.168.1.101",
        "address": "node1",
        "bootstrap_ip": bootstrap_ip
    })
    print(" Node 1:", response)

    print("\nStarting Node 2 and Registering...")
    node2_process = start_python_process()
    response = send_command(node2_process, {
        "action": "register",
        "ip": "192.168.1.102",
        "address": "node2",
        "bootstrap_ip": bootstrap_ip
    })
    print("🔹 Node 2:", response)

    print("\n Retrieving Node 1 IP...")
    response = send_command(node2_process, {"action": "get", "address": "node1"})
    print("🔹 Node 1 Lookup:", response)

    print("\n Retrieving Node 2 IP...")
    response = send_command(node1_process, {"action": "get", "address": "node2"})
    print("🔹 Node 2 Lookup:", response)

    # Cleanup: Terminate all processes
    bootstrap_process.terminate()
    node1_process.terminate()
    node2_process.terminate()
    print("\nTest Completed! Nodes Stopped.")

if __name__ == "__main__":
    main()
