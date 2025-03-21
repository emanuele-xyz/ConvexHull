#include <ConvexHull.h>

#include <cassert>
#include <iostream> // TODO: remove
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

        return hull;
    }

    static std::vector<v2> divide_and_conquer_merge(const std::vector<v2>& hull_a, const std::vector<v2>& hull_b)
    {
        assert(hull_a.size() > 0); assert(hull_b.size() > 0);

        std::vector<v2> hull{};

        // TODO: to be implemented

        return hull;
    }

    static std::vector<v2> divide_and_conquer_impl(const std::vector<v2>& sorted_points)
    {
        assert(sorted_points.size() >= 2);

        if (sorted_points.size() <= 3) // base case: the hull is just a sequence of the input points
        {
            return sorted_points;
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
