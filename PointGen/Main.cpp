#include <filesystem>
#include <format>
#include <fstream>
#include <iostream>
#include <random>
#include <vector>

static void WritePointsToFile(std::filesystem::path path, const std::vector<float>& points)
{
    path.make_preferred();
    auto path_str{ path.string() };

    std::ofstream f(path, std::ios::binary);
    if (!f) throw std::runtime_error{ std::format("failed to open file {}", path_str) };
    f.write(reinterpret_cast<const char*>(points.data()), points.size() * sizeof(*points.data()));
    if (!f) throw std::runtime_error{ std::format("failed to write points to file {}", path_str) };
}

int main()
{
    try
    {
        int count{ 10 };
        std::vector<float> points{};

        std::random_device random_device{};
        std::mt19937 generator{ random_device() };
        std::uniform_real_distribution distribution{ 0.0f, 1.0f };

        for (int i{}; i < count; i++)
        {
            float x{ distribution(generator) };
            float y{ distribution(generator) };
            points.emplace_back(x);
            points.emplace_back(y);
            std::cout << x << "," << y << std::endl;
        }

        WritePointsToFile("../Data/points.bin", points);
    }
    catch (const std::runtime_error& e)
    {
        std::cout << e.what() << std::endl;
    }

    return 0;
}
