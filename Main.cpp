#include <cmath>
#include <iostream>
#include <fstream>
#include <random>
#include <vector>

#include <ConvexHull.h>

// returns the determinant of the matrix [u | v]
static double determinant(ch::v2 u, ch::v2 v)
{
    return u.x * v.y - u.y * v.x;
}

static bool are_collinear(ch::v2 u, ch::v2 v, ch::v2 w, double threshold = 1.0)
{
    ch::v2 u_to_v{ v - u };
    ch::v2 u_to_w{ w - u };
    return std::abs(determinant(u_to_v, u_to_w)) < threshold;
}

static std::vector<ch::v2> generate_points(int points_count)
{
    std::random_device random_device{};
    std::mt19937 generator{ random_device() };
    std::uniform_real_distribution<> distribution{ 0.0, 100.0 };

    std::vector<ch::v2> points(points_count);

    for (int i{}; i < points_count; i++)
    {
        double x{ distribution(generator) };
        double y{ distribution(generator) };
        ch::v2 p{ x, y };

        bool any_collinear{ false };
        for (int j{}; j < i && !any_collinear; j++)
        {
            for (int k{}; k < i && !any_collinear; k++)
            {
                if (j == k) continue;

                if (are_collinear(p, points[j], points[k], 3))
                {
                    i--;
                    any_collinear = true;
                }
            }
        }

        points[i] = p;
    }

    return points;
}

int main()
{
    std::string out_path{ "test.txt" };
    std::ofstream out_file{ out_path };
    if (out_file)
    {
        // generate points
        int points_count{ 10 };
        std::vector<ch::v2> points{ generate_points(points_count) };
        std::vector<ch::v2> hull(points_count);
        std::vector<int> adj_matrix(points_count * points_count);

        int hull_count{ ch::naive(points_count, points.data(), hull.data(), adj_matrix.data()) };

        {
            std::vector<ch::v2> hull(points_count);
            std::vector<ch::v2> aux0(points_count);
            std::vector<ch::v2> aux1(points_count);
            int dc_hull_count{ ch::divide_and_conquer(points_count, points.data(), hull.data(), aux0.data(), aux1.data()) };
        }

        // output points
        out_file << points_count << std::endl;
        for (const auto& p : points)
        {
            out_file << p.x << " " << p.y << std::endl;
        }
        // ouput hull
        out_file << hull_count << std::endl;
        for (int i{}; i < hull_count; i++)
        {
            ch::v2 p{ hull[i] };
            out_file << p.x << " " << p.y << std::endl;
        }
    }
    else
    {
        std::cerr << "Oops, could not open file: " << out_path;
    }

    return 0;
}
