#pragma once

#include <vector>

namespace ch
{
    struct v2
    {
        static v2 normal(v2 p)
        {
            /*
                Given a column vector [a, b] we want to find one column vector [x, y] perpendicular to it.
                We know that, for such vector, dot([a, b], [x, y]) = 0.
                Thus, ax + by = 0.
                Hence, x = (-b/a) * y
                It is easy to see that one of the infinite solutions to this equation is [-b, a].
                This solution is one of the vectors we were looking for.
            */
            return { -p.y, p.x };
        }

        static double dot(v2 u, v2 v)
        {
            return u.x * v.x + u.y * v.y;
        }

        double x;
        double y;

        v2(double x, double y) : x{ x }, y{ y } {}
        v2() : v2{ 0.0, 0.0 } {}

        inline v2 operator-(const v2& rhs) const
        {
            return { x - rhs.x, y - rhs.y };
        }
    };

    // returns the determinant of the matrix [u | v]
    inline double determinant(v2 u, v2 v)
    {
        return u.x * v.y - u.y * v.x;
    }

    inline bool operator==(const v2& lhs, const v2& rhs)
    {
        return lhs.x == rhs.x && lhs.y == rhs.y;
    }
    inline bool operator!=(const v2& lhs, const v2& rhs)
    {
        return !(lhs == rhs);
    }

    std::vector<v2> naive(const std::vector<v2>& points);
    std::vector<v2> divide_and_conquer(const std::vector<v2>& points);
    std::vector<v2> akl_toussaint(const std::vector<v2>& points);
    std::vector<v2> torch(const std::vector<v2>& points);

    std::vector<v2> naive_akl_toussaint(const std::vector<v2>& points);
    std::vector<v2> divide_and_conquer_akl_toussaint(const std::vector<v2>& points);
    std::vector<v2> torch_akl_toussaint(const std::vector<v2>& points);

    std::vector<v2> sample_points_for_subset(const std::vector<v2>& points, int k);
}
