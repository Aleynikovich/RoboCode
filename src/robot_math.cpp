// robot_math.cpp
// Math utilities for robotics
#include <iostream>
#include <cmath>

extern "C" double robot_sin(double x) {
    return std::sin(x);
}

extern "C" double robot_cos(double x) {
    return std::cos(x);
}

extern "C" double robot_add(double a, double b) {
    return a + b;
}

extern "C" void robot_math_asm() {
    // Inline assembly for fun (x86 only)
    double result = 0.0;
    #if defined(__GNUC__) && defined(__x86_64__)
    asm("fldpi; fstpl %0" : "=m"(result));
    #endif
    std::cout << "[ASM] Pi from assembly: " << result << std::endl;
}
