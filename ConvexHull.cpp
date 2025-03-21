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

    static int divide_and_conquer_merge(v2* hull, int half_plus_one, int a_size, int b_size, v2* aux)
    {
        assert(hull); assert(half_plus_one >= 1); assert(a_size > 0); assert(b_size > 0);

        int hull_size{};

        // TODO: build hull into aux
        {

        }

        memcpy(hull, aux, hull_size * sizeof(*hull)); // copy hull built using aux into hull

        return hull_size;
    }

    static int divide_and_conquer_impl(int points_count, v2* sorted_points, v2* hull, v2* aux)
    {
        assert(points_count >= 2); assert(sorted_points); assert(hull);

        if (points_count <= 3) // base case: the hull is just a sequence of the input points
        {
            memcpy(hull, sorted_points, points_count * sizeof(*sorted_points));
            return points_count;
        }
        else // induction: (points_count > 3)
        {
            int half{ points_count / 2 }; // half >= 1
            int a_size = divide_and_conquer_impl(half + 1, sorted_points, hull, aux);
            int b_size = divide_and_conquer_impl(points_count - (half + 1), sorted_points + half + 1, hull + half + 1, aux + half + 1);
            int hull_size{ divide_and_conquer_merge(hull, half + 1, a_size, b_size, aux) };
            #if defined(_DEBUG)
            memset(aux, 0, points_count * sizeof(*aux));
            #endif
            return hull_size;
        }
    }

    int divide_and_conquer(int points_count, const v2* points, v2* hull, v2* aux0, v2* aux1)
    {
        assert(points_count >= 3); assert(points); assert(hull); assert(aux0);

        memcpy(aux0, points, points_count * sizeof(*points)); // copy point data into aux
        std::sort(aux0, aux0 + points_count, [](v2 a, v2 b) { return a.y <= b.y; }); // sort aux
        return divide_and_conquer_impl(points_count, aux0, hull, aux1);
    }
}
