#include <cassert>
#include <cmath>
#include <iostream>
#include <fstream>
#include <random>
#include <vector>

#include <ConvexHull.h>

static bool are_collinear(ch::v2 u, ch::v2 v, ch::v2 w, double threshold = 1.0)
{
    ch::v2 u_to_v{ v - u };
    ch::v2 u_to_w{ w - u };
    return std::abs(ch::determinant(u_to_v, u_to_w)) < threshold;
}

static std::vector<ch::v2> generate_points(int points_count)
{
    assert(points_count >= 3);

    std::random_device random_device{};
    std::mt19937 generator{ random_device() };
    //std::mt19937 generator{ 0 };
    std::uniform_real_distribution<> distribution{ 0.0, static_cast<double>(points_count) * 10.0 };

    std::vector<ch::v2> points{};
    while (points.size() < points_count)
    {
        double x{ distribution(generator) };
        double y{ distribution(generator) };
        ch::v2 p{ x, y };

        bool discard{ false };

        // check that two points don't have the same (or close) x or y coordinates
        for (int i{}; i < static_cast<int>(points.size()) && !discard; i++)
        {
            ch::v2 q{ points[i] };
            double dx{ std::abs(p.x - q.x) };
            double dy{ std::abs(p.y - q.y) };

            if (dx < 1.0 || dy < 1.0) // TODO: 1.0 should change based on points count?
            {
                discard = true;
            }
        }

        // check whether or not we should discard p (if p is collinear to any other two previously generated points, trash it)
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

static bool validate_hull(const std::vector<ch::v2>& truth, const std::vector<ch::v2>& hull)
{
    if (truth.size() != hull.size())
    {
        return false;
    }

    ch::v2 first{ truth.front() };
    if (auto it{ std::find(hull.begin(), hull.end(), first) }; it != hull.end())
    {
        bool are_equal{ true };
        int hull_start_idx{ static_cast<int>(std::distance(hull.begin(), it)) };
        for (int i{}; i < static_cast<int>(truth.size()) && are_equal; i++)
        {
            ch::v2 a{ truth[i] };
            ch::v2 b{ hull[(hull_start_idx + i) % static_cast<int>(hull.size())] };
            are_equal = a == b;
        }
        return are_equal;
    }
    else
    {
        return false;
    }
}

static void dump_points_and_hull(const std::vector<ch::v2>& points, const std::vector<ch::v2>& hull)
{
    std::string out_path{ "test.txt" };
    std::ofstream out_file{ out_path };
    if (out_file)
    {
        // dump points
        out_file << points.size() << std::endl;
        for (const auto& p : points)
        {
            out_file << p.x << " " << p.y << std::endl;
        }
        // dump hull
        if (hull.size() > 0)
        {
            out_file << hull.size() << std::endl;
            for (ch::v2 p : hull)
            {
                out_file << p.x << " " << p.y << std::endl;
            }
        }
    }
    else
    {
        std::cerr << "points & hull dump failed: " << out_path << std::endl;
    }
}

int main()
{
    // generate points
    int points_count{ 100 };
    std::vector<ch::v2> points{ generate_points(points_count) };
    assert(points.size() == points_count); // sanity check

    // generate hull and test against oracle
    std::vector<ch::v2> naive_hull{ ch::naive(points) };
    std::vector<ch::v2> dc_hull{ ch::divide_and_conquer(points) };

    if (validate_hull(naive_hull, dc_hull))
    {
        dump_points_and_hull(points, dc_hull);
    }
    else
    {
        std::cerr << "hull validation failed" << std::endl;
    }

    return 0;
}
