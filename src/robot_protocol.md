# Robot Communication Protocol

This document describes a simulated protocol for connecting to and controlling various industrial robots (KUKA, ABB, FANUC, CNC, RoboDK) from the RoboCode extension.

## Supported Brands
- <svg width="16" height="16"><rect width="16" height="16" fill="#f90"/></svg> **KUKA**
- <svg width="16" height="16"><rect width="16" height="16" fill="#e00"/></svg> **ABB**
- <svg width="16" height="16"><rect width="16" height="16" fill="#ff0"/></svg> **FANUC**
- <svg width="16" height="16"><rect width="16" height="16" fill="#0af"/></svg> **CNC**
- <svg width="16" height="16"><rect width="16" height="16" fill="#0c0"/></svg> **RoboDK**

## Protocol Overview

- **Connection**: TCP/IP socket to robot controller
- **Authentication**: Username/password or token (simulated)
- **Command Format**: Brand-specific text commands (see below)
- **Response**: Text status or error message

## Example Commands

| Brand  | Command Example         | Description                |
|--------|------------------------|----------------------------|
| KUKA   | `PTP X,Y,Z`            | Point-to-point move        |
| ABB    | `MoveJ A,B,C`          | Joint move                 |
| FANUC  | `J P[1]`               | Joint move to position 1   |
| CNC    | `G01 X10 Y10`          | Linear move                |
| RoboDK | `RunProgram Main`      | Run main program           |

## Simulated Workflow

1. Connect to robot (IP, port, brand)
2. Authenticate (if required)
3. Send command
4. Receive response
5. Disconnect

---

> This protocol is for simulation/demo purposes only. Real robot controllers require secure, brand-specific APIs.
