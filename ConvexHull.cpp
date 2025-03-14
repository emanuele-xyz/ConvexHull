#include <ConvexHull.h>

#include <iostream> // TODO: remove

namespace ch
{
    int naive(int points_count, const v2* points, v2* hull, int* adj_matrix)
    {
        assert(points_count > 0); assert(points); assert(hull); assert(adj_matrix);

        memset(adj_matrix, 0, points_count * points_count * sizeof(*adj_matrix));

        // find hull edges
        for (int i{}; i < points_count; i++)
        {
            for (int j{ /*i + 1*/ }; j < points_count; j++)
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
                    adj_matrix[i * points_count + j] = 1;
                    adj_matrix[j * points_count + i] = 1;
                    //std::cout << "(" << i << ", " << j << ")\n";
                    //break;
                }
            }
        }

        #if 0
        for (int i{}; i < points_count; i++)
        {
            for (int j{}; j < points_count; j++)
            {
                int e{ adj_matrix[i * points_count + j] };
                if (e) std::cout << "(" << i << ", " << j << ")\n";
            }
        }
        for (int i{}; i < points_count; i++)
        {
            for (int j{ /*i + 1*/ }; j < points_count; j++)
            {
                int e{ adj_matrix[i * points_count + j] };
                std::cout << e << " ";
            }
            std::cout << "\n";
        }
        #endif

        // build hull
        int hull_i{};
        {
            // find first hull point, with edge
            int first_idx{};
            int next_idx{};
            for (int k{}; k < points_count * points_count; k++)
            {
                if (adj_matrix[k] == 1)
                {
                    first_idx = k / points_count;
                    next_idx = k % points_count;
                    break;
                }
            }

            // append first point to the hull
            hull[hull_i++] = points[first_idx];

            // build the rest of the hull
            int prev_idx{ first_idx };
            do
            {
                // append next point to the hull
                hull[hull_i++] = points[next_idx];

                // look for the next edge to follow
                for (int k{}; k < points_count; k++)
                {
                    if (adj_matrix[next_idx * points_count + k] == 1 && k != prev_idx)
                    {
                        prev_idx = next_idx;
                        next_idx = k;
                        break;
                    }
                }
            } while (next_idx != first_idx);

            /*
            do
            {
                int j{ adj_matrix[e] };
                hull[hull_i++] = points[j];
                e = j;
            } while (e != first_edge);
            */
        }

        return hull_i;
    }
}
