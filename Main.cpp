#include <cassert>
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
    assert(points_count >= 3);

    std::random_device random_device{};
    std::mt19937 generator{ random_device() };
    std::uniform_real_distribution<> distribution{ 0.0, static_cast<double>(points_count) * 10.0 };

    std::vector<ch::v2> points{};
    while (points.size() < points_count)
    {
        double x{ distribution(generator) };
        double y{ distribution(generator) };
        ch::v2 p{ x, y };

        // check whether or not we should discard p (if p is clollinear to any other two previously generated points, trash it)
        bool discard{ false };
        for (int i{}; i < static_cast<int>(points.size()) && !discard; i++)
        {
            for (int j{ i + 1 }; j < static_cast<int>(points.size()) && !discard; j++)
            {
                discard = are_collinear(p, points[i], points[j], 1.0);
            }
        }

        if (!discard)
        {
            points.emplace_back(p);
        }
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
        int points_count{ 1000 };
        std::vector<ch::v2> points{ generate_points(points_count) };
        std::vector<ch::v2> hull{ ch::naive(points) };

        #if 0
        {
            std::vector<ch::v2> dc_hull(points_count);
            std::vector<ch::v2> aux0(points_count);
            std::vector<ch::v2> aux1(points_count);
            ch::divide_and_conquer(points_count, points.data(), dc_hull.data(), aux0.data(), aux1.data());
        }
        #endif

        // output points
        out_file << points_count << std::endl;
        for (const auto& p : points)
        {
            out_file << p.x << " " << p.y << std::endl;
        }
        // ouput hull
        out_file << hull.size() << std::endl;
        for (ch::v2 p : hull)
        {
            out_file << p.x << " " << p.y << std::endl;
        }
    }
    else
    {
        std::cerr << "Oops, could not open file: " << out_path;
    }

    return 0;
}
