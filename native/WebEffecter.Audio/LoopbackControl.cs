using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;

// Only control data crosses HTTP. Audio stays inside the ASIO callback.
internal sealed class LoopbackControl : IDisposable
{
    private const string AllowedOrigin = "https://hyoutenka.github.io";
    private readonly TcpListener listener;
    private readonly CancellationTokenSource stop = new();
    private readonly MonitorProcessor processor;
    private readonly int sampleRate;
    private readonly int port;
    private static readonly string Capabilities = JsonSerializer.Serialize(new
    {
        ok = true,
        supported = NativeEffectFactory.SupportedIds
    });
    internal int Port => port;

    internal LoopbackControl(int port, int sampleRate, MonitorProcessor processor)
    {
        this.sampleRate = sampleRate;
        this.processor = processor;
        listener = new TcpListener(IPAddress.Loopback, port);
        listener.Start();
        this.port = ((IPEndPoint)listener.LocalEndpoint).Port;
        _ = Task.Run(AcceptLoop);
    }

    private async Task AcceptLoop()
    {
        while (!stop.IsCancellationRequested)
        {
            try
            {
                var client = await listener.AcceptTcpClientAsync(stop.Token);
                _ = Task.Run(() => Handle(client));
            }
            catch (OperationCanceledException) { break; }
            catch (ObjectDisposedException) { break; }
            catch (Exception error) { Console.Error.WriteLine($"Control listener: {error.Message}"); }
        }
    }

    private async Task Handle(TcpClient client)
    {
        using (client)
        using (var timeout = CancellationTokenSource.CreateLinkedTokenSource(stop.Token))
        {
            timeout.CancelAfter(TimeSpan.FromSeconds(4));
            try
            {
                var stream = client.GetStream();
                using var reader = new StreamReader(stream, Encoding.UTF8, false, 1024, leaveOpen: true);
                var request = await reader.ReadLineAsync(timeout.Token);
                if (request is null || request.Length > 1024) return;
                var parts = request.Split(' ');
                if (parts.Length != 3 || parts[2] != "HTTP/1.1") return;
                var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                for (var n = 0; n < 32; n++)
                {
                    var line = await reader.ReadLineAsync(timeout.Token);
                    if (line is null || line.Length > 4096) return;
                    if (line.Length == 0) break;
                    var colon = line.IndexOf(':');
                    if (colon < 1) return;
                    headers[line[..colon]] = line[(colon + 1)..].Trim();
                    if (n == 31) return;
                }
                if (!headers.TryGetValue("Host", out var host) || host != $"127.0.0.1:{port}")
                {
                    await Reply(stream, 403, "{\"error\":\"Invalid host\"}", false, timeout.Token);
                    return;
                }
                var trusted = headers.TryGetValue("Origin", out var origin) && origin == AllowedOrigin;
                if (!trusted)
                {
                    await Reply(stream, 403, "{\"error\":\"Origin not allowed\"}", false, timeout.Token);
                    return;
                }
                // Chrome can preflight even a GET when the public page calls loopback.
                if (parts[0] == "OPTIONS" && (parts[1] is "/chain" or "/status" or "/heartbeat"))
                {
                    await Reply(stream, 204, "", true, timeout.Token);
                    return;
                }
                if (parts[0] == "GET" && parts[1] == "/status")
                {
                    await Reply(stream, 200, Capabilities[..^1] + $",\"rate\":{sampleRate},\"count\":{processor.ActiveEffectCount}}}", true, timeout.Token);
                    return;
                }
                if (parts[0] == "POST" && parts[1] == "/heartbeat")
                {
                    processor.RefreshControl();
                    await Reply(stream, 200, "{\"ok\":true}", true, timeout.Token);
                    return;
                }
                if (parts[0] != "POST" || parts[1] != "/chain")
                {
                    await Reply(stream, 404, "{\"error\":\"Unknown endpoint\"}", true, timeout.Token);
                    return;
                }
                if (!headers.TryGetValue("Content-Type", out var contentType) || !contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) ||
                    !headers.TryGetValue("Content-Length", out var lengthText) || !int.TryParse(lengthText, out var length) || length is < 2 or > 32768)
                {
                    await Reply(stream, 400, "{\"error\":\"Expected JSON of at most 32768 bytes\"}", true, timeout.Token);
                    return;
                }
                // The page sends ASCII-only names and numeric values. UTF-8 byte
                // length therefore matches the number of characters to read.
                var body = new char[length];
                var read = 0;
                while (read < length)
                {
                    var count = await reader.ReadAsync(body.AsMemory(read, length - read), timeout.Token);
                    if (count == 0) return;
                    read += count;
                }
                try
                {
                    using var document = JsonDocument.Parse(new string(body));
                    var impulse = ParseImpulse(document.RootElement);
                    var effects = ParseChain(document.RootElement, impulse);
                    var output = Value(document.RootElement, "level", 1, 2);
                    var mute = document.RootElement.TryGetProperty("mute", out var muteField) && muteField.ValueKind == JsonValueKind.True;
                    processor.SetEffects(effects);
                    processor.SetOutput((float)output, mute);
                    Console.WriteLine($"Web chain applied: {effects.Length} effects · level {output:P0} · mute {mute}");
                    await Reply(stream, 200, $"{{\"ok\":true,\"count\":{effects.Length}}}", true, timeout.Token);
                }
                catch (Exception error) when (error is JsonException or ArgumentException or InvalidOperationException or KeyNotFoundException)
                {
                    await Reply(stream, 422, JsonSerializer.Serialize(new { error = error.Message }), true, timeout.Token);
                }
            }
            catch (OperationCanceledException) { }
            catch (IOException) { }
            catch (SocketException) { }
        }
    }

    private IAudioEffect[] ParseChain(JsonElement root, float[]? impulse)
    {
        if (!root.TryGetProperty("slots", out var slots) || slots.ValueKind != JsonValueKind.Array || slots.GetArrayLength() > 8)
            throw new ArgumentException("Expected up to eight slots.");
        var result = new List<IAudioEffect>(8);
        foreach (var slot in slots.EnumerateArray())
        {
            if (slot.ValueKind != JsonValueKind.Object) throw new ArgumentException("Invalid slot.");
            if (slot.TryGetProperty("bypass", out var bypass) && bypass.ValueKind == JsonValueKind.True) continue;
            if (!slot.TryGetProperty("type", out var type) || type.ValueKind == JsonValueKind.Null) continue;
            if (type.ValueKind != JsonValueKind.String) throw new ArgumentException("Invalid effect type.");
            var name = type.GetString();
            slot.TryGetProperty("values", out var values);
            if (values.ValueKind is not (JsonValueKind.Undefined or JsonValueKind.Object)) throw new ArgumentException("Invalid effect values.");
            result.Add(NativeEffectFactory.Create(name!, values, sampleRate, impulse));
        }
        return result.ToArray();
    }

    private static float[]? ParseImpulse(JsonElement root)
    {
        if (!root.TryGetProperty("impulse", out var field) || field.ValueKind == JsonValueKind.Null) return null;
        if (field.ValueKind != JsonValueKind.String) throw new ArgumentException("Invalid IR data.");
        byte[] bytes;
        try { bytes = Convert.FromBase64String(field.GetString()!); }
        catch (FormatException) { throw new ArgumentException("Invalid IR encoding."); }
        if (bytes.Length is < 4 or > 8192 || bytes.Length % 4 != 0)
            throw new ArgumentException("IR must contain 1–2048 float samples.");
        var samples = new float[bytes.Length / 4];
        Buffer.BlockCopy(bytes, 0, samples, 0, bytes.Length);
        double energy = 0;
        foreach (var sample in samples)
        {
            if (!float.IsFinite(sample) || Math.Abs(sample) > 100)
                throw new ArgumentException("Invalid IR sample.");
            energy += sample * sample;
        }
        var scale = energy > 1 ? 1 / Math.Sqrt(energy) : 1;
        for (var i = 0; i < samples.Length; i++) samples[i] *= (float)scale;
        return samples;
    }

    private static double Value(JsonElement values, string name, double fallback, double max = 100)
    {
        if (values.ValueKind == JsonValueKind.Undefined || !values.TryGetProperty(name, out var field)) return fallback;
        if (field.ValueKind != JsonValueKind.Number || !field.TryGetDouble(out var value) || !double.IsFinite(value) || value < 0 || value > max)
            throw new ArgumentException($"Invalid {name} value.");
        return value;
    }

    private static async Task Reply(NetworkStream stream, int status, string body, bool cors, CancellationToken token)
    {
        var bytes = Encoding.UTF8.GetBytes(body);
        var reason = status switch { 200 => "OK", 204 => "No Content", 400 => "Bad Request", 403 => "Forbidden", 404 => "Not Found", _ => "Unprocessable Content" };
        var headers = $"HTTP/1.1 {status} {reason}\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: {bytes.Length}\r\nConnection: close\r\nCache-Control: no-store\r\n";
        if (cors) headers += $"Access-Control-Allow-Origin: {AllowedOrigin}\r\nVary: Origin\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\nAccess-Control-Allow-Private-Network: true\r\n";
        await stream.WriteAsync(Encoding.ASCII.GetBytes(headers + "\r\n"), token);
        if (bytes.Length > 0) await stream.WriteAsync(bytes, token);
    }

    public void Dispose()
    {
        stop.Cancel();
        listener.Stop();
        stop.Dispose();
    }

    internal static async Task<int> SelfTestAsync()
    {
        var processor = new MonitorProcessor(false, false, .5f, 48000, []);
        using var server = new LoopbackControl(0, 48000, processor);
        using var http = new HttpClient(new HttpClientHandler { UseProxy = false });
        http.DefaultRequestHeaders.Add("Origin", AllowedOrigin);
        var url = $"http://127.0.0.1:{server.Port}";
        using var preflight = new HttpRequestMessage(HttpMethod.Options, url + "/chain");
        preflight.Headers.Add("Access-Control-Request-Method", "POST");
        preflight.Headers.Add("Access-Control-Request-Private-Network", "true");
        using var options = await http.SendAsync(preflight);
        if (options.StatusCode != HttpStatusCode.NoContent || options.Headers.GetValues("Access-Control-Allow-Origin").Single() != AllowedOrigin)
            throw new Exception("Control preflight failed.");
        using var getPreflight = new HttpRequestMessage(HttpMethod.Options, url + "/status");
        getPreflight.Headers.Add("Access-Control-Request-Method", "GET");
        getPreflight.Headers.Add("Access-Control-Request-Private-Network", "true");
        using var getOptions = await http.SendAsync(getPreflight);
        if (getOptions.StatusCode != HttpStatusCode.NoContent || getOptions.Headers.GetValues("Access-Control-Allow-Private-Network").Single() != "true")
            throw new Exception("GET status private-network preflight failed.");
        using var status = await http.GetAsync(url + "/status");
        if (!status.IsSuccessStatusCode) throw new Exception("GET status failed.");
        using var capabilities = JsonDocument.Parse(await status.Content.ReadAsStringAsync());
        if (!capabilities.RootElement.GetProperty("supported").EnumerateArray().Any(id => id.GetString() == "delay"))
            throw new Exception("Native effect capabilities are missing.");
        var body = "{\"slots\":[{\"type\":\"janray\",\"values\":{\"gain\":35}},{\"type\":\"ocd\",\"bypass\":true}],\"level\":0.8,\"mute\":false}";
        using var accepted = await http.PostAsync(url + "/chain", new StringContent(body, Encoding.UTF8, "application/json"));
        if (!accepted.IsSuccessStatusCode || processor.ActiveEffectCount != 1) throw new Exception("Control chain update failed.");
        var mixed = "{\"slots\":[{\"type\":\"cp10\"},{\"type\":\"rat2\"},{\"type\":\"delay\"},{\"type\":\"reverb\"},{\"type\":\"saw\"},{\"type\":\"ir\"}],\"impulse\":\"AACAPw==\"}";
        using var expanded = await http.PostAsync(url + "/chain", new StringContent(mixed, Encoding.UTF8, "application/json"));
        if (!expanded.IsSuccessStatusCode || processor.ActiveEffectCount != 6)
            throw new Exception("Expanded pedal chain update failed: " + await expanded.Content.ReadAsStringAsync());
        using var pulse = await http.PostAsync(url + "/heartbeat", new StringContent(""));
        if (!pulse.IsSuccessStatusCode) throw new Exception("Control heartbeat failed.");
        using var rejected = await http.PostAsync(url + "/chain", new StringContent("{\"slots\":[{\"type\":\"nam_unknown\"}]}", Encoding.UTF8, "application/json"));
        if ((int)rejected.StatusCode != 422 || processor.ActiveEffectCount != 6) throw new Exception("Unsupported effect changed the active chain.");
        using var untrusted = new HttpClient(new HttpClientHandler { UseProxy = false });
        untrusted.DefaultRequestHeaders.Add("Origin", "https://untrusted.example");
        using var blocked = await untrusted.PostAsync(url + "/chain", new StringContent(body, Encoding.UTF8, "application/json"));
        if (blocked.StatusCode != HttpStatusCode.Forbidden) throw new Exception("Untrusted origin was accepted.");
        Console.WriteLine("Loopback control self-test passed (preflight, chain update, rejection, origin restriction).");
        return 0;
    }
}
