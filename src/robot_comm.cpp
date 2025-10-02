
// robot_comm.cpp
// C++ communication library for industrial robots (KUKA, ABB, FANUC, CNC, RoboDK, Dobot)
#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include <vector>
#include <map>
#include <mutex>
#include <stdexcept>
#include <functional>

enum class RobotBrand {
    KUKA, ABB, FANUC, CNC, RoboDK, Dobot, Unknown
};

std::string brandToString(RobotBrand brand) {
    switch (brand) {
        case RobotBrand::KUKA: return "KUKA";
        case RobotBrand::ABB: return "ABB";
        case RobotBrand::FANUC: return "FANUC";
        case RobotBrand::CNC: return "CNC";
        case RobotBrand::RoboDK: return "RoboDK";
        case RobotBrand::Dobot: return "Dobot";
        default: return "Unknown";
    }
}

class RobotError : public std::runtime_error {
public:
    RobotError(const std::string& msg) : std::runtime_error(msg) {}
};

class RobotProtocol {
public:
    virtual ~RobotProtocol() = default;
    virtual std::string handshake() = 0;
    virtual std::string send(const std::string& cmd) = 0;
    virtual std::string receive() = 0;
};

class DummyProtocol : public RobotProtocol {
public:
    std::string handshake() override {
        return "OK";
    }
    std::string send(const std::string& cmd) override {
        return "SENT: " + cmd;
    }
    std::string receive() override {
        return "RESPONSE: OK";
    }
};

class RobotConnection {
public:
    RobotConnection(const std::string& ip, int port, RobotBrand brand)
        : ipAddress(ip), port(port), brand(brand), connected(false), protocol(new DummyProtocol()) {}

    ~RobotConnection() { disconnect(); delete protocol; }

    void setProtocol(RobotProtocol* proto) {
        std::lock_guard<std::mutex> lock(mtx);
        if (protocol) delete protocol;
        protocol = proto;
    }

    bool connect() {
        std::lock_guard<std::mutex> lock(mtx);
        std::cout << "[" << brandToString(brand) << "] Connecting to " << ipAddress << ":" << port << "...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(300));
        std::string handshakeResult = protocol->handshake();
        if (handshakeResult != "OK") throw RobotError("Handshake failed");
        connected = true;
        std::cout << "[" << brandToString(brand) << "] Connection established!\n";
        return connected;
    }

    std::string sendCommand(const std::string& cmd) {
        std::lock_guard<std::mutex> lock(mtx);
        if (!connected) throw RobotError("Not connected");
        std::cout << "[" << brandToString(brand) << "] Sending command: " << cmd << "\n";
        std::string result = protocol->send(cmd);
        std::string response = protocol->receive();
        std::cout << "[" << brandToString(brand) << "] Response: " << response << "\n";
        return response;
    }

    void disconnect() {
        std::lock_guard<std::mutex> lock(mtx);
        if (connected) {
            std::cout << "[" << brandToString(brand) << "] Disconnecting...\n";
            connected = false;
        }
    }

    bool isConnected() const { return connected; }
    RobotBrand getBrand() const { return brand; }
    std::string getIP() const { return ipAddress; }
    int getPort() const { return port; }

private:
    std::string ipAddress;
    int port;
    RobotBrand brand;
    bool connected;
    RobotProtocol* protocol;
    mutable std::mutex mtx;
};

class RobotManager {
public:
    void addRobot(const std::string& name, RobotConnection* conn) {
        std::lock_guard<std::mutex> lock(mtx);
        robots[name] = conn;
    }
    RobotConnection* getRobot(const std::string& name) {
        std::lock_guard<std::mutex> lock(mtx);
        if (robots.count(name)) return robots[name];
        return nullptr;
    }
    void broadcast(const std::string& cmd) {
        std::lock_guard<std::mutex> lock(mtx);
        for (auto& [name, conn] : robots) {
            try {
                if (conn->isConnected()) conn->sendCommand(cmd);
            } catch (const std::exception& e) {
                std::cerr << "[Manager] Error sending to " << name << ": " << e.what() << "\n";
            }
        }
    }
    void disconnectAll() {
        std::lock_guard<std::mutex> lock(mtx);
        for (auto& [name, conn] : robots) {
            conn->disconnect();
        }
    }
    ~RobotManager() {
        for (auto& [name, conn] : robots) delete conn;
    }
private:
    std::map<std::string, RobotConnection*> robots;
    std::mutex mtx;
};

// Example brand-specific protocol (stub)
class KukaProtocol : public RobotProtocol {
public:
    std::string handshake() override { return "OK"; }
    std::string send(const std::string& cmd) override { return "KUKA SENT: " + cmd; }
    std::string receive() override { return "KUKA RESPONSE: OK"; }
};

int main() {
    RobotManager manager;
    auto kuka = new RobotConnection("192.168.1.10", 7000, RobotBrand::KUKA);
    kuka->setProtocol(new KukaProtocol());
    auto abb = new RobotConnection("192.168.1.20", 9000, RobotBrand::ABB);
    auto fanuc = new RobotConnection("192.168.1.30", 8000, RobotBrand::FANUC);
    auto cnc = new RobotConnection("192.168.1.40", 6000, RobotBrand::CNC);
    auto robodk = new RobotConnection("192.168.1.50", 5000, RobotBrand::RoboDK);
    auto dobot = new RobotConnection("192.168.1.60", 5500, RobotBrand::Dobot);

    manager.addRobot("KUKA", kuka);
    manager.addRobot("ABB", abb);
    manager.addRobot("FANUC", fanuc);
    manager.addRobot("CNC", cnc);
    manager.addRobot("RoboDK", robodk);
    manager.addRobot("Dobot", dobot);

    // Connect all
    for (const std::string& name : {"KUKA","ABB","FANUC","CNC","RoboDK","Dobot"}) {
        auto* robot = manager.getRobot(name);
        if (robot) robot->connect();
    }

    // Send commands
    kuka->sendCommand("PTP X,Y,Z");
    abb->sendCommand("MoveJ A,B,C");
    fanuc->sendCommand("J P[1]");
    cnc->sendCommand("G01 X10 Y10");
    robodk->sendCommand("RunProgram Main");
    dobot->sendCommand("MoveTo 100,200,300");

    // Broadcast
    manager.broadcast("STATUS?");

    // Disconnect all
    manager.disconnectAll();

    return 0;
}
