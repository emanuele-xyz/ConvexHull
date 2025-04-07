#include <cassert>
#include <chrono>
#include <cmath>
#include <iostream>
#include <fstream>
#include <format>
#include <functional>
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
    //std::mt19937 generator{ 1 };
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

template<typename Duration>
std::string format_duration(Duration d)
{
    using namespace std::chrono;

    // Convert the duration to various units
    auto ns = duration_cast<nanoseconds>(d).count();
    auto us = duration_cast<microseconds>(d).count();
    auto ms = duration_cast<milliseconds>(d).count();
    auto s = duration_cast<seconds>(d).count();

    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);

    if (ns < 1000)
    {
        oss << ns << " ns";
    }
    else if (us < 1000)
    {
        // convert to microseconds
        oss << us << " us";
    }
    else if (ms < 1000)
    {
        // convert to milliseconds
        oss << ms << " ms";
    }
    else
    {
        oss << s << " s";
    }

    return oss.str();
}


class Logger
{
public:
    Logger();
    ~Logger() = default;
    Logger(const Logger&) = delete;
    Logger(Logger&&) noexcept = delete;
    Logger& operator=(const Logger&) = delete;
    Logger& operator=(Logger&&) noexcept = delete;
public:
    void log(const std::string& msg);
    template<typename... Args>
    void logf(const std::format_string<Args...> fmt, Args&&... args)
    {
        log(std::vformat(fmt.get(), std::make_format_args(args...)));
    }
private:
    std::ofstream m_log_file;
};

Logger::Logger()
    : m_log_file{ "log.txt" }
{
}
void Logger::log(const std::string& msg)
{
    std::cout << msg << std::flush;
    m_log_file << msg;
    m_log_file.flush();
}

static std::vector<ch::v2> generate_dataset(Logger& logger, int capacity)
{
    std::vector<ch::v2> dataset{};
    {
        logger.log("generating points ... ");
        auto start{ std::chrono::high_resolution_clock::now() };
        dataset = generate_points(capacity);
        auto end{ std::chrono::high_resolution_clock::now() };
        auto duration_str{ format_duration(end - start) };
        logger.logf("DONE ... {}\n", duration_str);
    }
    return dataset;
}

using HullFn = std::function<std::vector<ch::v2>(std::vector<ch::v2>)>;
static void test(Logger& logger, std::vector<ch::v2> dataset, HullFn oracle, const std::string& oracle_name, HullFn func, const std::string& func_name)
{
    std::random_device rd{};
    std::mt19937 gen{ rd() };
    std::uniform_int_distribution<> distrib{ 5, 100 };
    int points_count{ distrib(gen) };
    while (points_count < static_cast<int>(dataset.size()))
    {
        logger.log("--------------------------------------------------------------------------------\n");
        logger.logf("points count: {}\n", points_count);

        // copy portion of point dataset
        std::vector<ch::v2> points{ dataset.begin(), dataset.begin() + points_count };

        logger.logf("{} ... ", oracle_name);
        std::vector<ch::v2> oracle_hull{};
        {
            auto start{ std::chrono::high_resolution_clock::now() };
            oracle_hull = oracle(points);
            auto end{ std::chrono::high_resolution_clock::now() };
            auto us{ std::chrono::duration_cast<std::chrono::microseconds>(end - start).count() };
            logger.logf("DONE ... {} us\n", us);
        }

        logger.logf("{} ... ", func_name);
        std::vector<ch::v2> func_hull{};
        {
            auto start{ std::chrono::high_resolution_clock::now() };
            func_hull = func(points);
            auto end{ std::chrono::high_resolution_clock::now() };
            auto us{ std::chrono::duration_cast<std::chrono::microseconds>(end - start).count() };
            logger.logf("DONE ... {} us\n", us);
        }

        if (validate_hull(oracle_hull, func_hull))
        {
            logger.log("hulls MATCH\n");
        }
        else
        {
            logger.log("hulls DON'T MATCH\n");
        }

        points_count += distrib(gen);
    }
}

static void test_dc_akl_toussaint()
{
    Logger logger{};

    int dataset_capacity{ 10000 };
    logger.log("--------------------------------------------------------------------------------\n");
    logger.logf("dataset capacity: {}\n", dataset_capacity);

    std::vector<ch::v2> dataset{ generate_dataset(logger, dataset_capacity) };
    test(logger, dataset, ch::divide_and_conquer, "divide_and_conquer", ch::akl_toussaint, "akl_toussaint");
}

#if 0
int main()
{
    // generate points
    int points_count{ 400 };
    std::vector<ch::v2> points{ generate_points(points_count) };
    assert(points.size() == points_count); // sanity check

    // generate hull and test against oracle
    //std::vector<ch::v2> naive_hull{ ch::naive(points) };
    std::vector<ch::v2> dc_hull{ ch::divide_and_conquer(points) };
    std::vector<ch::v2> akl_toussaint_hull{ ch::akl_toussaint(points) };

    dump_points_and_hull(points, akl_toussaint_hull);

    #if 1
    if (!validate_hull(dc_hull, akl_toussaint_hull))
    {
        std::cerr << "hull validation failed" << std::endl;
    }
    #endif

    return 0;
}
#else
int main()
{
    test_dc_akl_toussaint();
}
#endif