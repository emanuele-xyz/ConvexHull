#define WIN32_LEAN_AND_MEAN
#include <Windows.h>

#include <iostream>
#include <filesystem>
#include <format>
#include <fstream>
#include <vector>

#include <scope_guard.hpp>

#if defined(_DEBUG)
#define Check(p) do { if (!(p)) { __debugbreak(); } } while (false)
#else
#define Check(p) do { if (!(p)) { throw std::runtime_error{std::format("{}({}): check '{}' failed", __FILE__, __LINE__, #p)}; } } while (false)
#endif

#define WINDOW_CLASS_NAME "point_plot_window_class"
#define WINDOW_NAME "PointsPlot"
#define WINDOW_WIDTH 1280
#define WINDOW_HEIGHT 720

static std::vector<float> LoadPointsFromFile(std::filesystem::path path)
{
    path.make_preferred();
    auto path_str{ path.string() };

    std::ifstream f(path, std::ios::binary);
    if (!f) throw std::runtime_error{ std::format("failed to open file {}", path_str) };

    f.seekg(0, std::ios::end);
    auto size_in_bytes{ f.tellg() };
    f.seekg(0, std::ios::beg);

    std::vector<float> points(size_in_bytes / sizeof(float));

    f.read(reinterpret_cast<char*>(points.data()), size_in_bytes);
    if (!f) throw std::runtime_error{ std::format("failed to read from file {}", path_str) };

    return points;
}

static void WritePointsToConsole(const std::vector<float>& points)
{
    int c{};
    for (float p : points)
    {
        std::cout << p;
        if (c % 2 == 0) std::cout << ",";
        if (c % 2 != 0) std::cout << std::endl;
        c++;
    }
}

static LRESULT CALLBACK WindowProcedure(HWND hwnd, UINT msg, WPARAM wparam, LPARAM lparam)
{
    LRESULT result{};

    switch (msg)
    {
    case WM_DESTROY:
    {
        PostQuitMessage(0);
    } break;

    case WM_PAINT:
    {
        PAINTSTRUCT ps;
        HDC hdc = BeginPaint(hwnd, &ps);
        {
            FillRect(hdc, &ps.rcPaint, (HBRUSH)(COLOR_WINDOW + 1));
        }
        EndPaint(hwnd, &ps);
    } break;

    default:
    {
        result = DefWindowProc(hwnd, msg, wparam, lparam);
    } break;
    }

    return result;
}

static void RegisterWin32WindowClass()
{
    WNDCLASSEX wc{};
    wc.cbSize = sizeof(wc);
    //wc.style = ;
    wc.lpfnWndProc = WindowProcedure;
    //wc.cbClsExtra = ;
    //wc.cbWndExtra = ;
    wc.hInstance = GetModuleHandle(NULL);
    wc.hIcon = LoadIcon(0, IDI_APPLICATION);
    wc.hCursor = LoadCursor(0, IDC_ARROW);
    //wc.hbrBackground = ;
    //wc.lpszMenuName = ;
    wc.lpszClassName = WINDOW_CLASS_NAME;
    wc.hIconSm = LoadIcon(0, IDI_APPLICATION);
    Check(RegisterClassEx(&wc));
}

static HWND CreateWin32Window()
{
    RECT rect{ 0, 0, WINDOW_WIDTH, WINDOW_HEIGHT };
    DWORD style{ WS_OVERLAPPEDWINDOW | WS_VISIBLE };
    DWORD ex_style{ WS_EX_OVERLAPPEDWINDOW };
    Check(AdjustWindowRectEx(&rect, style, 0, ex_style));
    LONG w{ rect.right - rect.left };
    LONG h{ rect.bottom - rect.top };
    HWND hwnd{ CreateWindowEx(ex_style, WINDOW_CLASS_NAME, WINDOW_NAME, style, CW_USEDEFAULT, CW_USEDEFAULT, w, h, 0, 0, GetModuleHandle(NULL), nullptr) };
    Check(hwnd);
    return hwnd;
}

int main()
{
    try
    {
        auto points{ LoadPointsFromFile("../Data/points.bin") };
        WritePointsToConsole(points);

        Check(SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_SYSTEM_AWARE));
        RegisterWin32WindowClass();
        auto window_class_cleanup{ sg::make_scope_guard([]() { UnregisterClass(WINDOW_CLASS_NAME, GetModuleHandle(NULL)); }) };
        HWND hwnd{ CreateWin32Window() };
        auto hwnd_cleanup{ sg::make_scope_guard([=]() { DestroyWindow(hwnd); }) };

        MSG msg{};
        while (GetMessage(&msg, NULL, 0, 0) > 0)
        {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
    }
    catch (const std::runtime_error& e)
    {
        std::cout << e.what() << std::endl;
    }

    return 0;
}
