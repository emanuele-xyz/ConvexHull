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

    static int get_next_idx_cw(size_t size, int i)
    {
        return (i + 1) % static_cast<int>(size);
    }

    static int get_next_idx_ccw(size_t size, int i)
    {
        int isize = static_cast<int>(size);
        return (((i - 1) % isize) + isize) % isize;
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

    static std::pair<int, int> find_rt_case_a(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b, int start_a, int start_b)
    {
        int i = start_a, j = start_b;
    loop:
        double gamma = (hull_a[i].y - hull_b[j].y) / (hull_a[i].x - hull_b[j].x);

        int next_i = get_next_idx_cw(hull_a.size(), i);
        double alpha = (hull_a[i].y - hull_a[next_i].y) / (hull_a[i].x - hull_a[next_i].x);

        int next_j = get_next_idx_cw(hull_b.size(), j);
        double beta = (hull_b[j].y - hull_b[next_j].y) / (hull_b[j].x - hull_b[next_j].x);

        if (alpha >= gamma)
        {
            i = get_next_idx_cw(hull_a.size(), i);
            goto loop;
        }

        if (beta > gamma)
        {
            j = get_next_idx_cw(hull_b.size(), j);
            goto loop;
        }

        return { i, j };
    }

    static std::pair<int, int> find_rt_case_b(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b, int start_a, int start_b)
    {
        int i = start_a, j = start_b;
    loop:
        double gamma = (hull_a[i].y - hull_b[j].y) / (hull_a[i].x - hull_b[j].x);

        int next_i = get_next_idx_ccw(hull_a.size(), i);
        double alpha = (hull_a[i].y - hull_a[next_i].y) / (hull_a[i].x - hull_a[next_i].x);

        int next_j = get_next_idx_ccw(hull_b.size(), j);
        double beta = (hull_b[j].y - hull_b[next_j].y) / (hull_b[j].x - hull_b[next_j].x);

        if (beta <= gamma)
        {
            j = get_next_idx_ccw(hull_b.size(), j);
            goto loop;
        }

        if (alpha < gamma)
        {
            i = get_next_idx_ccw(hull_a.size(), i);
            goto loop;
        }

        return { i, j };
    }

    static std::pair<int, int> find_lt_case_a(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b, int start_a, int start_b)
    {
        int i = start_a, j = start_b;
    loop:
        double gamma = (hull_a[i].y - hull_b[j].y) / (hull_a[i].x - hull_b[j].x);

        int next_i = get_next_idx_cw(hull_a.size(), i);
        double alpha = (hull_a[i].y - hull_a[next_i].y) / (hull_a[i].x - hull_a[next_i].x);

        int next_j = get_next_idx_cw(hull_b.size(), j);
        double beta = (hull_b[j].y - hull_b[next_j].y) / (hull_b[j].x - hull_b[next_j].x);

        if (alpha >= gamma)
        {
            i = get_next_idx_cw(hull_a.size(), i);
            goto loop;
        }

        if (beta > gamma)
        {
            j = get_next_idx_cw(hull_b.size(), j);
            goto loop;
        }

        return { i, j };
    }

    static std::pair<int, int> find_lt_case_b(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b, int start_a, int start_b)
    {
        int i = start_a, j = start_b;
    loop:
        double gamma = (hull_a[i].y - hull_b[j].y) / (hull_a[i].x - hull_b[j].x);

        int next_i = get_next_idx_ccw(hull_a.size(), i);
        double alpha = (hull_a[i].y - hull_a[next_i].y) / (hull_a[i].x - hull_a[next_i].x);

        int next_j = get_next_idx_ccw(hull_b.size(), j);
        double beta = (hull_b[j].y - hull_b[next_j].y) / (hull_b[j].x - hull_b[next_j].x);

        if (alpha < gamma)
        {
            i = get_next_idx_ccw(hull_a.size(), i);
            goto loop;
        }

        if (beta <= gamma)
        {
            j = get_next_idx_ccw(hull_b.size(), j);
            goto loop;
        }

        return { i, j };
    }

    #if 0
    static std::pair<int, int> find_tan_case_a(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b, int start_a, int start_b)
    {
        int i = start_a, j = start_b;
    loop:
        double gamma = (hull_a[i].y - hull_b[j].y) / (hull_a[i].x - hull_b[j].x);

        int next_i = get_next_idx_cw(hull_a.size(), i);
        double alpha = (hull_a[i].y - hull_a[next_i].y) / (hull_a[i].x - hull_a[next_i].x);

        int next_j = get_next_idx_cw(hull_b.size(), j);
        double beta = (hull_b[j].y - hull_b[next_j].y) / (hull_b[j].x - hull_b[next_j].x);

        if (alpha >= gamma)
        {
            i = get_next_idx_cw(hull_a.size(), i);
            goto loop;
        }

        if (beta > gamma)
        {
            j = get_next_idx_cw(hull_b.size(), j);
            goto loop;
        }

        return { i, j };
    }

    static std::pair<int, int> find_tan_case_b(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b, int start_a, int start_b)
    {
        int i = start_a, j = start_b;
    loop:
        double gamma = (hull_a[i].y - hull_b[j].y) / (hull_a[i].x - hull_b[j].x);

        int next_i = get_next_idx_ccw(hull_a.size(), i);
        double alpha = (hull_a[i].y - hull_a[next_i].y) / (hull_a[i].x - hull_a[next_i].x);

        int next_j = get_next_idx_ccw(hull_b.size(), j);
        double beta = (hull_b[j].y - hull_b[next_j].y) / (hull_b[j].x - hull_b[next_j].x);

        if (beta <= gamma)
        {
            j = get_next_idx_ccw(hull_b.size(), j);
            goto loop;
        }

        if (alpha < gamma)
        {
            i = get_next_idx_ccw(hull_a.size(), i);
            goto loop;
        }

        return { i, j };
    }
    #endif

    static std::vector<v2> divide_and_conquer_merge(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b)
    {
        assert(hull_a.size() > 0); assert(hull_b.size() > 0);

        auto [la, ra] = find_lr(hull_a);
        auto [lb, rb] = find_lr(hull_b);

        int rt_idx_a{}, lt_idx_a{};
        int rt_idx_b{}, lt_idx_b{};

        // find right tangent
        if (hull_a[ra].x < hull_b[rb].x) // rt - case a
        {
            std::tie(rt_idx_a, rt_idx_b) = find_rt_case_a(hull_a, hull_b, ra, rb);
        }
        else // rt - case b
        {
            std::tie(rt_idx_a, rt_idx_b) = find_rt_case_b(hull_a, hull_b, ra, rb);
        }

        // find left tangent
        if (hull_a[la].x < hull_b[lb].x) // lt - case a
        {
            std::tie(lt_idx_a, lt_idx_b) = find_lt_case_a(hull_a, hull_b, la, lb);
        }
        else // lt - case b
        {
            std::tie(lt_idx_a, lt_idx_b) = find_lt_case_b(hull_a, hull_b, la, lb);
        }

        assert(rt_idx_a != lt_idx_a); // sanity check
        assert(rt_idx_b != lt_idx_b); // sanity check

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
        else // induction: (sorted_points.size() > 3)
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
}
