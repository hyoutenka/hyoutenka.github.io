using System.Diagnostics;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;
using NAudio.Wave;

// The downloaded single-file executable installs itself per user. Subsequent
// logins start the quiet controller; no terminal or administrator is needed.
internal static class QuickStart
{
    private const string StartupName = "Web Effecter Audio";
    private const string StartupKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private static readonly string DirectoryPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "WebEffecter", "Audio");
    private static readonly string LauncherPath = Path.Combine(DirectoryPath, "start.vbs");

    internal static int Install(string[] args)
    {
        if (!OperatingSystem.IsWindows()) throw new PlatformNotSupportedException("ASIO setup requires Windows.");
        var drivers = AsioDevice.GetDriverNames();
        if (drivers.Length == 0) throw new InvalidOperationException("ASIO driver not found. Install your audio interface's manufacturer driver first.");

        string? Get(string key)
        {
            var index = Array.IndexOf(args, key);
            return index >= 0 && index + 1 < args.Length ? args[index + 1] : null;
        }
        var driver = Get("--driver") ?? drivers.FirstOrDefault(name =>
            name.Contains("Focusrite", StringComparison.OrdinalIgnoreCase)) ?? drivers[0];
        if (!drivers.Contains(driver, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException("The selected ASIO driver is not installed.");

        int Choice(string name, int fallback) => int.TryParse(Get(name), CultureInfo.InvariantCulture, out var value) ? value : fallback;
        int input, left, right;
        using (var device = AsioDevice.Open(driver))
        {
            var caps = device.Capabilities;
            if (caps.NbInputChannels < 1 || caps.NbOutputChannels < 2)
                throw new InvalidOperationException("The ASIO driver needs at least one input and two outputs.");
            var scarlett4i4 = driver.Contains("Focusrite", StringComparison.OrdinalIgnoreCase)
                && caps.NbInputChannels >= 2 && caps.NbOutputChannels >= 4;
            input = Choice("--input", scarlett4i4 ? 1 : 0);
            left = Choice("--left", scarlett4i4 ? 2 : 0);
            right = Choice("--right", scarlett4i4 ? 3 : 1);
            if (input < 0 || input >= caps.NbInputChannels || left < 0 || right < 0 ||
                left >= caps.NbOutputChannels || right >= caps.NbOutputChannels || left == right)
                throw new ArgumentException("Input/output channel selection is outside the driver's range.");
        }
        var rate = Choice("--rate", 48000);
        var buffer = Choice("--buffer", 64);
        Console.WriteLine($"ASIO: {driver} · IN {input + 1} · OUT {left + 1}/{right + 1} · {rate} Hz · {buffer} samples");

        Directory.CreateDirectory(DirectoryPath);
        var source = Environment.ProcessPath ?? throw new InvalidOperationException("Executable path is unavailable.");
        var hash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(source)))[..12];
        var installed = Path.Combine(DirectoryPath, $"WebEffecter.Audio.{hash}.exe");
        if (!File.Exists(installed)) File.Copy(source, installed);

        // WScript starts the console executable without a console window at login.
        // The launch path is local per-user; the VBS file is never downloaded.
        static string Quote(string value) => "\"" + value.Replace("\"", "\"\"") + "\"";
        var command = string.Join(" ", new[] {
            Quote(installed), "--daemon", "--driver", Quote(driver),
            "--input", input.ToString(CultureInfo.InvariantCulture),
            "--left", left.ToString(CultureInfo.InvariantCulture),
            "--right", right.ToString(CultureInfo.InvariantCulture),
            "--rate", rate.ToString(CultureInfo.InvariantCulture),
            "--buffer", buffer.ToString(CultureInfo.InvariantCulture),
            "--gain", "0.5", "--control-port", "8765"
        });
        var vbs = "CreateObject(\"WScript.Shell\").Run \"" +
            command.Replace("\"", "\"\"") + "\", 0, False\r\n";
        File.WriteAllText(LauncherPath, vbs, new UTF8Encoding(false));
        using var run = Registry.CurrentUser.CreateSubKey(StartupKey);
        run.SetValue(StartupName, $"wscript.exe //B //Nologo {Quote(LauncherPath)}");
        Process.Start(new ProcessStartInfo("wscript.exe", $"//B //Nologo {Quote(LauncherPath)}")
        {
            UseShellExecute = false,
            CreateNoWindow = true
        });
        Console.WriteLine("설정 완료. 이제 https://hyoutenka.github.io/ 에 접속하면 ASIO가 자동 연결됩니다.");
        Console.WriteLine("연결되지 않으면 사이트의 '로컬 엔진 다시 연결'을 눌러 주세요.");
        Console.WriteLine("이 창은 닫아도 됩니다.");
        return 0;
    }

    internal static int Uninstall()
    {
        using var run = Registry.CurrentUser.OpenSubKey(StartupKey, writable: true);
        run?.DeleteValue(StartupName, throwOnMissingValue: false);
        Console.WriteLine("자동 시작 등록을 해제했습니다. 실행 중인 엔진은 Windows 로그아웃 후 종료됩니다.");
        return 0;
    }
}
