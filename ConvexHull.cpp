#include <ConvexHull.h>

namespace ch
{
    int naive(int points_count, const v2* points, v2* hull, int* edge_table)
    {
        assert(points_count > 0); assert(points); assert(hull); assert(edge_table);

        // find hull edges
        int first_edge{ -1 };
        for (int i{}; i < points_count; i++)
        {
            for (int j{}; j < points_count; j++)
            {
                if (i == j) continue;

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
                for (int k{}; k < points_count; k++)
                {
                    if (k == i || k == j) continue;

                    v2 p{ points[k] };
                    v2 u_to_p{ p - u };
                    double dot{ v2::dot(normal, u_to_p) };
                    /*
                        It is not possible for dot to be zero.
                        This is because, by precondition, we assume that our set does not contain colinear points.
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
                    if (first_edge == -1) first_edge = i;
                    edge_table[i] = j;
                }
                else
                {
                    edge_table[i] = -1;
                }
            }
        }

        // build hull
        int hull_i{};
        {
            assert(first_edge != -1);
            
            int e{ first_edge };
            do
            {
                int j{ edge_table[e] };
                hull[hull_i++] = points[j];
                e = j;
            } while (e != first_edge);
        }

        return hull_i;
    }
}
