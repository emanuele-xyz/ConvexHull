#pragma once

#include <vector>

namespace ch
{
    struct v2
    {
        static double dot(v2 u, v2 v)
        {
            return u.x * v.x + u.y * v.y;
        }

        double x;
        double y;

        v2(double x, double y) : x{ x }, y{ y } {}
        v2() : v2{ 0.0, 0.0 } {}

        v2 operator-(const v2& rhs) const
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
}
