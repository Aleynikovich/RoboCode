# robot_ipc.py
# Inter-process communication for RoboCode extension
from queue import Queue

class RobotIPC:
    def __init__(self):
        self.messages = Queue()
    def send_message(self, msg):
        self.messages.put(msg)
        print(f"[IPC] Sent: {msg}")
    def receive_message(self):
        if self.messages.empty():
            return ""
        msg = self.messages.get()
        print(f"[IPC] Received: {msg}")
        return msg
