# $ python -m venv .venv
# $ .venv/bin/pip install matplotlib
# $ python plot.py

import matplotlib.pyplot as plt


def parse(filename):
    with open(filename, "r") as f:
        lines = [line.strip() for line in f if line.strip()]

    # The first line contains the total number of points.
    num_points = int(lines[0])
    points = []

    # Next [num_points] lines contain the coordinates for each point.
    for i in range(1, num_points + 1):
        x, y = lines[i].split()
        points.append((float(x), float(y)))

    # The line after that is the number of hull points.
    hull_index = 1 + num_points
    num_hull = int(lines[hull_index])
    hull = []

    # Next [num_hull] lines contain the coordinates for each point of the hull.
    for i in range(hull_index + 1, hull_index + 1 + num_hull):
        x, y = lines[i].split()
        hull.append((float(x), float(y)))

    return points, hull


def plot(points, hull):
    if points:
        x, y = zip(*points)
    else:
        x, y = [], []

    plt.figure(figsize=(6, 6))
    plt.scatter(x, y, color="blue", label="Points")

    if hull:
        hull_x, hull_y = zip(*hull)

        # To close the hull, append the first point at the end.
        hull_x = list(hull_x) + [hull_x[0]]
        hull_y = list(hull_y) + [hull_y[0]]

        plt.plot(hull_x, hull_y, color="red", label="Convex Hull", linewidth=2)

    plt.xlabel("X")
    plt.ylabel("Y")
    plt.title("Points and Convex Hull")
    plt.legend()
    plt.axis("scaled")  # Alternative: "equal"
    plt.show()


if __name__ == "__main__":
    points, hull = parse("input.txt")
    plot(points, hull)
