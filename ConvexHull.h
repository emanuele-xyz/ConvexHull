#pragma once

#include <vector>
#include <cassert>

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

    int naive(int points_count, const v2* points, v2* hull, int* adj_matrix);
    int divide_and_conquer(int points_count, const v2* points, v2* hull, v2* aux0, v2* aux1);

}
