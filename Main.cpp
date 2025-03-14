#include <iostream>
#include <fstream>
#include <random>
#include <vector>

#include <ConvexHull.h>

int main()
{
    std::string out_path{ "test.txt" };
    std::ofstream out_file{ out_path };
    if (out_file)
    {
        std::random_device random_device{};
        std::mt19937 generator{ random_device() };
        std::uniform_real_distribution<> distribution{ 0.0, 100.0 };

        int points_count{ 10 };
        std::vector<ch::v2> points(points_count);
        std::vector<ch::v2> hull(points_count);
        std::vector<int> adj_matrix(points_count * points_count);

        // generate points
        for (size_t i{}; i < points.size(); i++)
        {
            double x{ distribution(generator) };
            double y{ distribution(generator) };
            points[i] = ch::v2{ x, y };
        }

        // TODO: ???
        int hull_count{ ch::naive(points_count, points.data(), hull.data(), adj_matrix.data()) };

        // output points
        out_file << points_count << std::endl;
        for (const auto& p : points)
        {
            out_file << p.x << " " << p.y << std::endl;
        }
        // ouput hull
        out_file << hull_count << std::endl;
        for (const auto& p : hull)
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
