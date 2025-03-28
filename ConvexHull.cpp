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
                /*
                    Given a column vector [a, b] we want to find one column vector [x, y] perpendicular to it.
                    We know that, for such vector, dot([a, b], [x, y]) = 0.
                    Thus, ax + by = 0.
                    Hence, x = (-b/a) * y
                    It is easy to see that one of the infinite solutions to this equation is [-b, a].
                    This solution is one of the vectors we were looking for.
                */
                v2 normal{ -u_to_v.y, u_to_v.x };

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

    #if 0
    static int get_next_idx_cw(size_t size, int i)
    {
        return (i + 1) % static_cast<int>(size);
    }

    static int get_next_idx_ccw(size_t size, int i)
    {
        int isize = static_cast<int>(size);
        return (((i - 1) % isize) + isize) % isize;
    }

    // TODO: if we are gonna keep this function we should refactor it
    static int get_next_idx(size_t size, int i, Direction d)
    {
        if (d == Direction::CLOCKWISE)
        {
            return get_next_idx_cw(size, i);
        }
        else
        {
            return get_next_idx_ccw(size, i);
        }
    }

    static std::pair<int, int> find_lr(const std::vector<v2>& hull)
    {
        auto minmax = std::minmax_element(hull.begin(), hull.end(),
            [](const v2& a, const v2& b) {
                return a.x < b.x;
            });

        size_t l = std::distance(hull.begin(), minmax.first);
        size_t r = std::distance(hull.begin(), minmax.second);
        return { static_cast<int>(l), static_cast<int>(r) };
    }

    static std::pair<int, int> find_tangent(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b, int start_a, int start_b, Direction d)
    {
        int i = start_a, j = start_b;
    loop:
        double gamma = (hull_a[i].y - hull_b[j].y) / (hull_a[i].x - hull_b[j].x);

        int next_i = get_next_idx(hull_a.size(), i, d);
        double alpha = (hull_a[i].y - hull_a[next_i].y) / (hull_a[i].x - hull_a[next_i].x);

        int next_j = get_next_idx(hull_b.size(), j, d);
        double beta = (hull_b[j].y - hull_b[next_j].y) / (hull_b[j].x - hull_b[next_j].x);

        if (d == Direction::CLOCKWISE)
        {
            if (alpha >= gamma)
            {
                i = get_next_idx(hull_a.size(), i, d);
                goto loop;
            }

            if (beta > gamma)
            {
                j = get_next_idx(hull_b.size(), j, d);
                goto loop;
            }
        }
        else
        {
            if (beta <= gamma)
            {
                j = get_next_idx(hull_b.size(), j, d);
                goto loop;
            }

            if (alpha < gamma)
            {
                i = get_next_idx(hull_a.size(), i, d);
                goto loop;
            }
        }

        return { i, j };
    }

    static std::vector<v2> divide_and_conquer_merge(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b)
    {
        assert(hull_a.size() > 0); assert(hull_b.size() > 0);

        auto [la, ra] = find_lr(hull_a);
        auto [lb, rb] = find_lr(hull_b);

        int rt_idx_a{}, rt_idx_b{};
        int lt_idx_a{}, lt_idx_b{};

        if (hull_a[ra].x < hull_b[rb].x && hull_a[la].x < hull_b[lb].x)
        {
            // probably works
            std::tie(rt_idx_a, rt_idx_b) = find_tangent(hull_a, hull_b, ra, rb, Direction::CLOCKWISE);
            std::tie(lt_idx_a, lt_idx_b) = find_tangent(hull_a, hull_b, la, lb, Direction::CLOCKWISE);
        }
        else if (hull_a[ra].x > hull_b[rb].x && hull_a[la].x > hull_b[lb].x)
        {
            // probably works
            std::tie(rt_idx_a, rt_idx_b) = find_tangent(hull_a, hull_b, ra, rb, Direction::COUNTER_CLOCKWISE);
            std::tie(lt_idx_a, lt_idx_b) = find_tangent(hull_a, hull_b, la, lb, Direction::COUNTER_CLOCKWISE);
        }
        else if (hull_a[ra].x < hull_b[rb].x && hull_a[la].x > hull_b[lb].x)
        {
            // probably works
            std::tie(rt_idx_a, rt_idx_b) = find_tangent(hull_a, hull_b, ra, rb, Direction::CLOCKWISE);
            std::tie(lt_idx_a, lt_idx_b) = find_tangent(hull_a, hull_b, la, lb, Direction::COUNTER_CLOCKWISE);
        }
        else if (hull_a[ra].x > hull_b[rb].x && hull_a[la].x < hull_b[lb].x)
        {
            // probably works
            std::tie(rt_idx_a, rt_idx_b) = find_tangent(hull_a, hull_b, ra, rb, Direction::COUNTER_CLOCKWISE);
            std::tie(lt_idx_a, lt_idx_b) = find_tangent(hull_a, hull_b, la, lb, Direction::CLOCKWISE);
        }
        else
        {
            assert(false); // Ureachable
        }

        std::vector<v2> hull{};
        for (int i = rt_idx_a; i != lt_idx_a; i = get_next_idx_cw(hull_a.size(), i))
        {
            hull.emplace_back(hull_a[i]);
        }
        hull.emplace_back(hull_a[lt_idx_a]);

        for (int j = lt_idx_b; j != rt_idx_b; j = get_next_idx_cw(hull_b.size(), j))
        {
            hull.emplace_back(hull_b[j]);
        }
        hull.emplace_back(hull_b[rt_idx_b]);

        return hull;
    }

    static std::vector<v2> divide_and_conquer_impl(const std::vector<v2>& sorted_points)
    {
        assert(sorted_points.size() >= 2);

        if (sorted_points.size() <= 5) // base case: use naive approach
        {
            return naive(sorted_points);
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
        std::sort(copy.begin(), copy.end(), [](v2 a, v2 b) { return a.y <= b.y; }); // sort local copy of points
        return divide_and_conquer_impl(copy);
    }
    #endif

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
}
