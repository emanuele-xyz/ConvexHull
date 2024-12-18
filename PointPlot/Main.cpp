#include <iostream>
#include <filesystem>
#include <format>
#include <fstream>
#include <vector>

static std::vector<float> LoadPointsFromFile(std::filesystem::path path)
{
    path.make_preferred();
    auto path_str{ path.string() };

    std::ifstream f(path, std::ios::binary);
    if (!f) throw std::runtime_error{ std::format("failed to open file {}", path_str) };

    f.seekg(0, std::ios::end);
    auto size_in_bytes{ f.tellg() };
    f.seekg(0, std::ios::beg);

    std::vector<float> points(size_in_bytes / sizeof(float));

    f.read(reinterpret_cast<char*>(points.data()), size_in_bytes);
    if (!f) throw std::runtime_error{ std::format("failed to read from file {}", path_str) };

    return points;
}

int main()
{
    try
    {
        auto points{ LoadPointsFromFile("../Data/points.bin") };

        int c{};
        for (float p : points)
        {
            std::cout << p;
            if (c % 2 == 0) std::cout << ",";
            if (c % 2 != 0) std::cout << std::endl;
            c++;
        }
    }
    catch (const std::runtime_error& e)
    {
        std::cout << e.what() << std::endl;
    }

    return 0;
}
