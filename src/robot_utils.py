# robot_utils.py
# Utility functions for RoboCode Python library

def print_robot_list(robots):
    print("Connected robots:")
    for r in robots:
        print(f" - {r}")

def to_upper(s):
    return s.upper()

def robot_py_demo():
    print("[PYTHON] Demo function executed.")
