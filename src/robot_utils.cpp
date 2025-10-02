// robot_utils.cpp
// Utility functions for RoboCode C++ library
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

void printRobotList(const std::vector<std::string>& robots) {
    std::cout << "Connected robots:" << std::endl;
    for (const auto& r : robots) {
        std::cout << " - " << r << std::endl;
    }
}

std::string toUpper(const std::string& s) {
    std::string out = s;
    std::transform(out.begin(), out.end(), out.begin(), ::toupper);
    return out;
}

extern "C" void robot_asm_demo() {
    // Inline assembly for fun (x86 only)
    int result = 0;
    #if defined(__GNUC__) && defined(__x86_64__)
    asm("mov $42, %%eax; mov %%eax, %0" : "=r"(result));
    #endif
    std::cout << "[ASM] Inline assembly result: " << result << std::endl;
}
