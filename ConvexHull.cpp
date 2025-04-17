#include <ConvexHull.h>

#include <cassert>
#include <algorithm>
#include <unordered_map>

template<>
struct std::hash<ch::v2>
{
    std::size_t operator()(const ch::v2& s) const noexcept
    {
        std::size_t h1{ std::hash<double>{}(s.x) };
        std::size_t h2{ std::hash<double>{}(s.y) };
        return h1 ^ (h2 << 1);
    }
};

namespace ch
{
    enum class Direction
    {
        CLOCKWISE,
        COUNTER_CLOCKWISE,
    };

    static bool is_hull_clockwise(const std::vector<v2> hull)
    {
        assert(hull.size() >= 3);

        v2 a{ hull[0] };
        v2 b{ hull[1] };
        v2 c{ hull[2] };

        v2 a_to_b{ b - a };
        v2 b_to_c{ c - b };
        return determinant(a_to_b, b_to_c) <= 0;

        //return (i.x - i_prev.x) * (i_next.y - i.y) - (i.y - i_prev.y) * (i_next.x - i.x) <= 0;
    }

    std::vector<v2> naive(const std::vector<v2>& points)
    {
        assert(points.size() >= 3);

        std::unordered_map<v2, std::vector<v2>> graph{};

        // find hull edges
        for (int i{}; i < static_cast<int>(points.size()); i++)
        {
            for (int j{ i + 1 }; j < static_cast<int>(points.size()); j++)
            {
                v2 u{ points[i] };
                v2 v{ points[j] };
                v2 u_to_v{ v - u };
                v2 normal{ v2::normal(u_to_v) };

                int positive_halfplane{};
                int negative_halfplane{};
                for (int k{}; k < static_cast<int>(points.size()); k++)
                {
                    if (k == i || k == j) continue;

                    v2 p{ points[k] };
                    v2 u_to_p{ p - u };
                    double dot{ v2::dot(normal, u_to_p) };
                    /*
                        It is not possible for dot to be zero.
                        This is because, by precondition, we assume that our set does not contain collinear points.
                    */
                    assert(dot != 0);
                    if (dot > 0)
                    {
                        positive_halfplane++;
                    }
                    else // dot < 0
                    {
                        negative_halfplane++;
                    }
                }

                // update edge list
                if (positive_halfplane == 0 || negative_halfplane == 0)
                {
                    graph[points[i]].emplace_back(points[j]);
                    graph[points[j]].emplace_back(points[i]);
                }
            }
        }

        // build hull
        std::vector<v2> hull{};
        {
            assert(graph.begin() != graph.end());
            v2 first_hull_point{ graph.begin()->first };

            v2 previous_hull_point{ first_hull_point };
            v2 current_hull_point{ first_hull_point };
            do
            {
                hull.emplace_back(current_hull_point);

                auto next{ std::find_if(graph[current_hull_point].begin(), graph[current_hull_point].end(), [=](v2 p) { return p != previous_hull_point; }) };
                assert(next != graph[current_hull_point].end());
                previous_hull_point = current_hull_point;
                current_hull_point = *next;
            } while (current_hull_point != first_hull_point);
        }

        // make hull clockwise
        if (!is_hull_clockwise(hull))
        {
            std::reverse(hull.begin(), hull.end());
        }

        return hull;
    }

    static int get_next_idx_cw(int i, size_t size)
    {
        return (i + 1) % static_cast<int>(size);
    }

    static int get_next_idx_ccw(int i, size_t size)
    {
        int isize = static_cast<int>(size);
        return (((i - 1) % isize) + isize) % isize;
    }

    static double get_intersect_y(double middle_x, v2 p, v2 q)
    {
        double m{ (p.y - q.y) / (p.x - q.x) };
        double b{ p.y - m * p.x }; // b = y - mx
        double intersect_y{ m * middle_x + b }; // y = mx + b
        return intersect_y;
    }

    static std::vector<v2> divide_and_conquer_merge(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b)
    {
        assert(hull_a.size() > 0);
        assert(hull_b.size() > 0);

        // find rightmost point of a and leftmost point of b
        int leftmost_idx{}, rightmost_idx{};
        {
            auto leftmost_iterator{ std::min_element(hull_b.begin(), hull_b.end(), [](const v2& a, const v2& b) { return a.x < b.x; }) };
            auto rightmost_iterator{ std::max_element(hull_a.begin(), hull_a.end(), [](const v2& a, const v2& b) { return a.x < b.x; }) };
            leftmost_idx = static_cast<int>(std::distance(hull_b.begin(), leftmost_iterator));
            rightmost_idx = static_cast<int>(std::distance(hull_a.begin(), rightmost_iterator));
        }

        double middle_line{ (hull_a[rightmost_idx].x + hull_b[leftmost_idx].x) / 2.0 }; // middle vertical line (the x value) separating the two hulls

        // find upper tangent
        int upper_tangent_a_idx{}, upper_tangent_b_idx{};
        {
            int i{ rightmost_idx };
            int j{ leftmost_idx };

            while (true)
            {
                int next_i{ get_next_idx_ccw(i, hull_a.size()) };
                int next_j{ get_next_idx_cw(j, hull_b.size()) };

                if (get_intersect_y(middle_line, hull_a[next_i], hull_b[j]) > get_intersect_y(middle_line, hull_a[i], hull_b[j]))
                {
                    i = next_i;
                }
                else if (get_intersect_y(middle_line, hull_a[i], hull_b[next_j]) > get_intersect_y(middle_line, hull_a[i], hull_b[j]))
                {
                    j = next_j;
                }
                else
                {
                    break;
                }
            }

            upper_tangent_a_idx = i;
            upper_tangent_b_idx = j;
        }

        // find lower tangent
        int lower_tangent_a_idx{}, lower_tangent_b_idx{};
        {
            int i{ rightmost_idx };
            int j{ leftmost_idx };

            while (true)
            {
                int next_i{ get_next_idx_cw(i, hull_a.size()) };
                int next_j{ get_next_idx_ccw(j, hull_b.size()) };

                if (get_intersect_y(middle_line, hull_a[next_i], hull_b[j]) < get_intersect_y(middle_line, hull_a[i], hull_b[j]))
                {
                    i = next_i;
                }
                else if (get_intersect_y(middle_line, hull_a[i], hull_b[next_j]) < get_intersect_y(middle_line, hull_a[i], hull_b[j]))
                {
                    j = next_j;
                }
                else
                {
                    break;
                }
            }

            lower_tangent_a_idx = i;
            lower_tangent_b_idx = j;
        }

        // clockwise merge the two hulls using the found tangents
        std::vector<v2> hull{};
        for (int i{ lower_tangent_a_idx }; i != upper_tangent_a_idx; i = get_next_idx_cw(i, hull_a.size()))
        {
            hull.emplace_back(hull_a[i]);
        }
        hull.emplace_back(hull_a[upper_tangent_a_idx]);
        for (int j{ upper_tangent_b_idx }; j != lower_tangent_b_idx; j = get_next_idx_cw(j, hull_b.size()))
        {
            hull.emplace_back(hull_b[j]);
        }
        hull.emplace_back(hull_b[lower_tangent_b_idx]);

        return hull;
    }

    static std::vector<v2> divide_and_conquer_impl(const std::vector<v2>& sorted_points)
    {
        if (sorted_points.size() <= 1)
        {
            return sorted_points;
        }
        else
        {
            int half{ static_cast<int>(sorted_points.size()) / 2 }; // half >= 1
            std::vector<v2> hull_a{ divide_and_conquer_impl({sorted_points.begin(), sorted_points.begin() + half}) };
            std::vector<v2> hull_b{ divide_and_conquer_impl({sorted_points.begin() + half, sorted_points.end()}) };
            return divide_and_conquer_merge(hull_a, hull_b);
        }
    }

    std::vector<v2> divide_and_conquer(const std::vector<v2>& points)
    {
        assert(points.size() >= 3);

        std::vector<v2> copy{ points };
        std::sort(copy.begin(), copy.end(), [](v2 a, v2 b) { return a.x <= b.x; }); // sort local copy of points
        return divide_and_conquer_impl(copy);
    }

    static std::vector<v2> build_kill_zone(const std::vector<v2> points)
    {
        v2 xmin{};
        v2 xmax{};
        {
            auto it{ std::minmax_element(points.begin(), points.end(), [](const v2& a, const v2& b) { return a.x < b.x; }) };
            assert(it.first != points.end());
            assert(it.second != points.end());
            xmin = *it.first;
            xmax = *it.second;
        }
        v2 ymin{};
        v2 ymax{};
        {
            auto it{ std::minmax_element(points.begin(), points.end(), [](const v2& a, const v2& b) { return a.y < b.y; }) };
            assert(it.first != points.end());
            assert(it.second != points.end());
            ymin = *it.first;
            ymax = *it.second;
        }

        std::vector<v2> kill_zone{};
        {
            v2 quadrilateral[4]{ xmin, ymax, xmax, ymin };
            for (v2 p : quadrilateral)
            {
                if (auto it{ std::find(kill_zone.begin(), kill_zone.end(), p) }; it == kill_zone.end())
                {
                    kill_zone.emplace_back(p);
                }
            }
        }
        return kill_zone;
    }

    /*
        A point falls within the kill zone, if all the half plane tests give back a negative dot product.
        We do one half plane test for each side of the killzone.
    */
    static bool falls_within_kill_zone(v2 p, const std::vector<v2>& kill_zone)
    {
        bool falls_within{ true };
        for (int i{}; i < static_cast<int>(kill_zone.size()) && falls_within; i++)
        {
            v2 from{ kill_zone[i] };
            v2 to{ kill_zone[(i + 1) % static_cast<int>(kill_zone.size())] };
            v2 from_to{ to - from };
            v2 normal{ v2::normal(from_to) };
            v2 from_p{ p - from };
            falls_within = v2::dot(normal, from_p) < 0;
        }
        return falls_within;
    }

    static bool falls_within_region(v2 p, v2 from, v2 to)
    {
        v2 from_to{ to - from };
        v2 normal{ v2::normal(from_to) };
        v2 from_p{ p - from };
        return v2::dot(normal, from_p) > 0;
    }

    static std::vector<v2> akl_toussaint_heuristic(const std::vector<v2>& points, const std::vector<v2> kill_zone)
    {
        // apply heuristic, i.e. filter points that fall within the kill zone
        std::vector<v2> survivors{};
        for (v2 p : points)
        {
            if (!falls_within_kill_zone(p, kill_zone))
            {
                survivors.emplace_back(p);
            }
        }
        return survivors;
    }

    static std::vector<v2> akl_toussaint_impl(const std::vector<v2>& points)
    {
        // apply akl toussaint heuristic
        std::vector<v2> kill_zone{ build_kill_zone(points) };
        std::vector<v2> survivors{ akl_toussaint_heuristic(points, kill_zone) };

        // build hull on survivor point set
        std::vector<v2> hull{};
        {
            for (int i{}; i < static_cast<int>(kill_zone.size()); i++)
            {
                v2 from{ kill_zone[i] };
                v2 to{ kill_zone[(i + 1) % static_cast<int>(kill_zone.size())] };

                // find points belonging to the region (including "from" and "to")
                std::vector<v2> region_points{};
                region_points.emplace_back(from);
                region_points.emplace_back(to);
                for (v2 p : survivors)
                {
                    if (falls_within_region(p, from, to))
                    {
                        region_points.emplace_back(p);
                    }
                }

                // sort points
                {
                    v2 from_to{ to - from };
                    assert(from_to.x != 0); // no two points can have the same x
                    if (from_to.x > 0)
                    {
                        // we either are in region 1 or 2
                        std::sort(region_points.begin(), region_points.end(), [](v2 a, v2 b) { return a.x <= b.x; });
                    }
                    else if (from_to.x < 0)
                    {
                        // we either are in region 3 or 4
                        std::sort(region_points.begin(), region_points.end(), [](v2 a, v2 b) { return a.x >= b.x; });
                    }
                }

                // find convex path that goes from "from" to "to"
                {
                    while (true)
                    {
                        assert(region_points.size() >= 2);

                        bool was_there_any_deletion{ false };
                        int k{};
                        while (0 <= k && k < (static_cast<int>(region_points.size()) - 2))
                        {
                            v2 p{ region_points[k] };
                            v2 pn{ region_points[k + 1] };
                            v2 pnn{ region_points[k + 2] };
                            double s{ determinant(pnn - pn, pn - p) };
                            if (s >= 0)
                            {
                                k++;
                            }
                            else
                            {
                                region_points.erase(region_points.begin() + k + 1);
                                was_there_any_deletion = true;
                                k--;
                            }
                        }

                        if (!was_there_any_deletion)
                        {
                            break;
                        }
                    }
                }

                // append convex path to hull
                for (v2 p : region_points)
                {
                    // we built region_points inserting the extreme points related to the region.
                    // the problem is that extreme points are shared between neighboring regions.
                    // thus, before inserting any point in the hull, we check for duplicates.
                    // for such diplicate points, we simply don't insert them in the hull.
                    if (auto it{ std::find(hull.begin(), hull.end(), p) }; it == hull.end())
                    {
                        hull.emplace_back(p);
                    }
                }
            }
        }
        return hull;
    }

    std::vector<v2> akl_toussaint(const std::vector<v2>& points)
    {
        assert(points.size() >= 3);

        std::vector<v2> copy{ points };
        if (points.size() == 3)
        {
            if (!is_hull_clockwise(points))
            {
                std::reverse(copy.begin(), copy.end());
            }
            return copy;
        }
        else
        {
            return akl_toussaint_impl(copy);
        }
    }
}
