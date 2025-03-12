#include <iostream>
#include <fstream>
#include <random>
#include <vector>

int main()
{
    std::string out_path{ "test.txt" };
    std::ofstream out_file{ out_path };
    if (out_file)
    {
        std::random_device random_device{};
        std::mt19937 generator{ random_device() };
        std::uniform_real_distribution<> distribution{ 0.0, 100.0 };

        const int points_count{ 10 };
        out_file << points_count << std::endl;
        for (int i{}; i < points_count; i++)
        {
            const double x{ distribution(generator) };
            const double y{ distribution(generator) };
            out_file << x << " " << y << std::endl;
        }
    }
    else
    {
        std::cerr << "Oops, could not open file: " << out_path;
    }

    return 0;
}
