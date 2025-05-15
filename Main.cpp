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

static bool validate_points_subset(
    const std::vector<ch::v2>& points, const std::vector<ch::v2>& points_sample, const std::vector<ch::v2>& hull, const std::vector<ch::v2>& approximate_hull
)
{
    bool ok{ true };

    // check that all samples are in the original point set
    if (ok)
    {
        bool all_belong{ true };
        for (int i{}; i < static_cast<int>(points_sample.size()) && all_belong; i++)
        {
            ch::v2 p{ points_sample[i] };
            auto it{ std::find(points.begin(), points.end(), p) };
            all_belong = it != points.end();
        }
        ok = ok && all_belong;
    }

    // check that all the points in the approximated hull are in the correct hull
    if (ok)
    {
        bool all_belong{ true };
        for (int i{}; i < static_cast<int>(approximate_hull.size()) && all_belong; i++)
        {
            ch::v2 p{ approximate_hull[i] };
            auto it{ std::find(hull.begin(), hull.end(), p) };
            all_belong = it != points.end();
        }
        ok = ok && all_belong;
    }

    return ok;
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

static void test_akl_toussaint_against_dc()
{
    Logger logger{};

    logger.log("akl-toussaint against divide and conquer\n");

    int dataset_capacity{ 10000 };
    logger.log("--------------------------------------------------------------------------------\n");
    logger.logf("dataset capacity: {}\n", dataset_capacity);

    std::vector<ch::v2> dataset{ generate_dataset(logger, dataset_capacity) };
    test(logger, dataset, ch::divide_and_conquer, "divide and conquer", ch::akl_toussaint, "akl-toussaint");
}

static void test_torch_against_akl_toussaint()
{
    Logger logger{};

    logger.log("torch against akl-toussaint\n");

    int dataset_capacity{ 10000 };
    logger.log("--------------------------------------------------------------------------------\n");
    logger.logf("dataset capacity: {}\n", dataset_capacity);

    std::vector<ch::v2> dataset{ generate_dataset(logger, dataset_capacity) };
    test(logger, dataset, ch::akl_toussaint, "akl-toussaint", ch::torch, "torch");
}

static void test_naive_akl_toussaint_against_naive()
{
    Logger logger{};

    logger.log("naive akl-toussaint against naive\n");

    int dataset_capacity{ 1000 };
    logger.log("--------------------------------------------------------------------------------\n");
    logger.logf("dataset capacity: {}\n", dataset_capacity);

    std::vector<ch::v2> dataset{ generate_dataset(logger, dataset_capacity) };
    test(logger, dataset, ch::naive, "naive", ch::naive_akl_toussaint, "naive akl-toussaint");
}

static void test_dc_akl_toussaint_against_dc()
{
    Logger logger{};

    logger.log("divide and conquer akl-toussaint against divide and conquer\n");

    int dataset_capacity{ 10000 };
    logger.log("--------------------------------------------------------------------------------\n");
    logger.logf("dataset capacity: {}\n", dataset_capacity);

    std::vector<ch::v2> dataset{ generate_dataset(logger, dataset_capacity) };
    test(logger, dataset, ch::divide_and_conquer, "divide and conquer", ch::divide_and_conquer_akl_toussaint, "divide and conquer akl-toussaint");
}

static void test_torch_akl_toussaint_against_torch()
{
    Logger logger{};

    logger.log("torch akl-toussaint vs torch\n");

    int dataset_capacity{ 10000 };
    logger.log("--------------------------------------------------------------------------------\n");
    logger.logf("dataset capacity: {}\n", dataset_capacity);

    std::vector<ch::v2> dataset{ generate_dataset(logger, dataset_capacity) };
    test(logger, dataset, ch::torch, "torch", ch::torch_akl_toussaint, "torch akl-toussaint");
}

static void test_sample_points_for_subset()
{
    Logger logger{};

    logger.log("test sample points for subset\n");

    int dataset_capacity{ 10000 };
    logger.log("--------------------------------------------------------------------------------\n");
    logger.logf("dataset capacity: {}\n", dataset_capacity);

    std::vector<ch::v2> dataset{ generate_dataset(logger, dataset_capacity) };

    std::random_device rd{};
    std::mt19937 gen{ rd() };
    std::uniform_int_distribution<> points_count_increment_distrib{ 5, 100 };
    int points_count{ points_count_increment_distrib(gen) };
    while (points_count < static_cast<int>(dataset.size()))
    {
        std::uniform_int_distribution<> k_increment_distrib{ 1, points_count / 2 };
        int k{ k_increment_distrib(gen) };
        while (k < points_count)
        {
            logger.log("--------------------------------------------------------------------------------\n");
            logger.logf("points count: {}\n", points_count);
            logger.logf("k: {}\n", k);

            // copy portion of point dataset
            std::vector<ch::v2> points{ dataset.begin(), dataset.begin() + points_count };

            logger.log("sampling ... ");
            std::vector<ch::v2> points_sample{};
            {
                auto start{ std::chrono::high_resolution_clock::now() };
                points_sample = ch::sample_points_for_subset(points, k);
                auto end{ std::chrono::high_resolution_clock::now() };
                auto us{ std::chrono::duration_cast<std::chrono::microseconds>(end - start).count() };
                logger.logf("DONE ... {} us\n", us);
            }

            logger.log("computing approximate convex hull ... ");
            std::vector<ch::v2> approximate_hull{};
            {
                auto start{ std::chrono::high_resolution_clock::now() };
                approximate_hull = ch::akl_toussaint(points_sample);
                auto end{ std::chrono::high_resolution_clock::now() };
                auto us{ std::chrono::duration_cast<std::chrono::microseconds>(end - start).count() };
                logger.logf("DONE ... {} us\n", us);
            }

            logger.log("computing correct convex hull ... ");
            std::vector<ch::v2> hull{};
            {
                auto start{ std::chrono::high_resolution_clock::now() };
                hull = ch::akl_toussaint(points);
                auto end{ std::chrono::high_resolution_clock::now() };
                auto us{ std::chrono::duration_cast<std::chrono::microseconds>(end - start).count() };
                logger.logf("DONE ... {} us\n", us);
            }

            if (validate_points_subset(points, points_sample, hull, approximate_hull))
            {
                logger.log("points sample is OK\n");
            }
            else
            {
                logger.log("points sample is WRONG\n");
            }

            k += k_increment_distrib(gen);
        }

        points_count += points_count_increment_distrib(gen);
    }
}

static void benchmark()
{
    Logger logger{};
    logger.log("--------------------------------------------------------------------------------\n");
    logger.log("Benchmark\n");

    int dataset_capacity{ 10000 };
    logger.log("--------------------------------------------------------------------------------\n");
    logger.logf("dataset capacity: {}\n", dataset_capacity);

    std::vector<ch::v2> dataset{ generate_dataset(logger, dataset_capacity) };

    HullFn algorithms[7]
    {
        ch::naive,
        ch::divide_and_conquer,
        ch::akl_toussaint,
        ch::torch,
        ch::naive_akl_toussaint,
        ch::divide_and_conquer_akl_toussaint,
        ch::torch_akl_toussaint,
    };
    const char* algorithms_names[7]
    {
        "naive",
        "divide_and_conquer",
        "akl_toussaint",
        "torch",
        "naive_akl_toussaint",
        "divide_and_conquer_akl_toussaint",
        "torch_akl_toussaint",
    };

    for (int i{}; i < 5; i++)
    {
        logger.log("--------------------------------------------------------------------------------\n");
        logger.logf("{}\n", algorithms_names[i]);

        int points_count{ 100 };
        constexpr long long ALLOTTED_SECONDS_FOR_ALGO_BENCHMARK{ 60 * 3 }; // three minutes
        long long seconds_since_algo_benchmark_start{};
        while (points_count < static_cast<int>(dataset.size()))
        {
            // copy portion of point dataset
            std::vector<ch::v2> points{ dataset.begin(), dataset.begin() + points_count };

            // run benchmark /w timing data
            auto start{ std::chrono::high_resolution_clock::now() };
            std::vector<ch::v2> hull{ algorithms[i](points) };
            auto end{ std::chrono::high_resolution_clock::now() };

            // print benchmark data point
            auto us{ std::chrono::duration_cast<std::chrono::microseconds>(end - start).count() };
            logger.logf("n={} t={}\n", points_count, us);

            // if it took more than one minute, it is probably too slow to go up to 10k points
            seconds_since_algo_benchmark_start += std::chrono::duration_cast<std::chrono::seconds>(end - start).count();
            if (seconds_since_algo_benchmark_start >= ALLOTTED_SECONDS_FOR_ALGO_BENCHMARK)
            {
                break;
            }

            // go to the next benchmark data point
            points_count += 100;
        }
    }
}

#if 0
int main()
{
    // generate points
    int points_count{ 500 };
    std::vector<ch::v2> points{ generate_points(points_count) };
    assert(points.size() == points_count); // sanity check

    // generate hull and test against oracle
    //std::vector<ch::v2> naive_hull{ ch::naive(points) };
    //std::vector<ch::v2> dc_hull{ ch::divide_and_conquer(points) };
    #if 1
    std::vector<ch::v2> akl_toussaint_hull{ ch::akl_toussaint(points) };
    std::vector<ch::v2> torch_hull{ ch::torch(points) };
    dump_points_and_hull(points, torch_hull);
    #else
    std::vector<ch::v2> sampled_points{ ch::sample_points_for_subset(points, 9) };
    dump_points_and_hull(sampled_points, {});
    #endif

    #if 1
    if (!validate_hull(akl_toussaint_hull, torch_hull))
    {
        std::cerr << "hull validation failed" << std::endl;
        return -1;
    }
    #endif

    return 0;
}
#else
int main()
{
    //test_akl_toussaint_against_dc();
    //test_torch_against_akl_toussaint();
    //test_naive_akl_toussaint_against_naive();
    //test_dc_akl_toussaint_against_dc();
    //test_torch_akl_toussaint_against_torch();

    //test_sample_points_for_subset();

    benchmark();
}
#endif
