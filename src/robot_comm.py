# robot_comm.py
# Simulated Python communication protocol for industrial robots (KUKA, ABB, FANUC, CNC, RoboDK)
import time

class RobotConnection:
    def __init__(self, ip, port, brand):
        self.ip = ip
        self.port = port
        self.brand = brand
        self.connected = False

    def connect(self):
        print(f"[{self.brand}] Connecting to {self.ip}:{self.port}...")
        time.sleep(0.5)
        self.connected = True
        print(f"[{self.brand}] Connection established!")

    def send_command(self, cmd):
        if not self.connected:
            print(f"[{self.brand}] Not connected!")
            return
        print(f"[{self.brand}] Sending command: {cmd}")

    def disconnect(self):
        if self.connected:
            print(f"[{self.brand}] Disconnecting...")
            self.connected = False

if __name__ == "__main__":
    kuka = RobotConnection("192.168.1.10", 7000, "KUKA")
    abb = RobotConnection("192.168.1.20", 9000, "ABB")
    fanuc = RobotConnection("192.168.1.30", 8000, "FANUC")
    cnc = RobotConnection("192.168.1.40", 6000, "CNC")
    robodk = RobotConnection("192.168.1.50", 5000, "RoboDK")

    kuka.connect(); kuka.send_command("PTP X,Y,Z"); kuka.disconnect()
    abb.connect(); abb.send_command("MoveJ A,B,C"); abb.disconnect()
    fanuc.connect(); fanuc.send_command("J P[1]"); fanuc.disconnect()
    cnc.connect(); cnc.send_command("G01 X10 Y10"); cnc.disconnect()
    robodk.connect(); robodk.send_command("RunProgram Main"); robodk.disconnect()
