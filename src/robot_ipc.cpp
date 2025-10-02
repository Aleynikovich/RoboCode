// robot_ipc.cpp
// Inter-process communication for RoboCode extension
#include <iostream>
#include <string>
#include <thread>
#include <mutex>
#include <queue>

class RobotIPC {
public:
    void sendMessage(const std::string& msg) {
        std::lock_guard<std::mutex> lock(mtx);
        messages.push(msg);
        std::cout << "[IPC] Sent: " << msg << std::endl;
    }
    std::string receiveMessage() {
        std::lock_guard<std::mutex> lock(mtx);
        if (messages.empty()) return "";
        std::string msg = messages.front();
        messages.pop();
        std::cout << "[IPC] Received: " << msg << std::endl;
        return msg;
    }
private:
    std::queue<std::string> messages;
    std::mutex mtx;
};
