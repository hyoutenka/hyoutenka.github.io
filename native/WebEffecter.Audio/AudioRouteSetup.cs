using System.Windows.Forms;
using NAudio.Wave;

internal sealed record AudioRoute(string Driver, int Input, int Left, int Right, int Rate, int Buffer);

// ASIO exposes channel names and audio samples, but no portable hardware INST
// switch state. A clear driver label can be selected automatically; otherwise
// the player can probe the active input or choose the physical socket once.
internal static class AudioRouteSetup
{
    internal static bool IsInstrumentName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return false;
        var words = System.Text.RegularExpressions.Regex.Split(name.ToLowerInvariant(), "[^a-z0-9]+");
        return words.Any(word => word is "inst" or "instrument" or "hiz" or "guitar" ||
            System.Text.RegularExpressions.Regex.IsMatch(word, "^(inst|instrument|hiz|guitar)[0-9]+$"))
            || name.Contains("Hi-Z", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Hi Z", StringComparison.OrdinalIgnoreCase);
    }

    internal static int FindNamedInstrument(string[] names)
    {
        var matches = Enumerable.Range(0, names.Length).Where(i => IsInstrumentName(names[i])).ToArray();
        return matches.Length == 1 ? matches[0] : -1;
    }

    internal static void SelfTest()
    {
        if (FindNamedInstrument(["Mic 1", "Input 2 (INST)", "Loopback 1"]) != 1 ||
            FindNamedInstrument(["Instrument 1", "Hi-Z 2"]) != -1 ||
            FindNamedInstrument(["Line 1", "Input 2"]) != -1)
            throw new Exception("Instrument channel name selection regression.");
    }

    internal static AudioRoute? Choose(string[] drivers, AudioRoute initial)
    {
        using var form = new Form {
            Text = "Web Effecter · 기타 입력 설정", Width = 560, Height = 365,
            FormBorderStyle = FormBorderStyle.FixedDialog, MaximizeBox = false,
            MinimizeBox = false, StartPosition = FormStartPosition.CenterScreen
        };
        var driverLabel = new Label { Left = 18, Top = 19, Width = 510, Text = "ASIO 오디오 인터페이스" };
        var driver = new ComboBox { Left = 18, Top = 42, Width = 510, DropDownStyle = ComboBoxStyle.DropDownList };
        driver.Items.AddRange(drivers);
        var inputLabel = new Label { Left = 18, Top = 82, Width = 510, Text = "기타가 꽂힌 INST 입력 (표시 번호는 장치의 입력 번호)" };
        var input = new ComboBox { Left = 18, Top = 105, Width = 510, DropDownStyle = ComboBoxStyle.DropDownList };
        var outputLabel = new Label { Left = 18, Top = 145, Width = 510, Text = "듣는 출력: 좌 / 우 (헤드폰 또는 모니터 라우팅에 맞추세요)" };
        var left = new ComboBox { Left = 18, Top = 168, Width = 245, DropDownStyle = ComboBoxStyle.DropDownList };
        var right = new ComboBox { Left = 283, Top = 168, Width = 245, DropDownStyle = ComboBoxStyle.DropDownList };
        var info = new Label { Left = 18, Top = 207, Width = 510, Height = 40,
            Text = "INST 표기가 없으면 기타를 연주하면서 '입력 감지'를 누르거나 직접 입력을 선택하세요." };
        var probe = new Button { Left = 18, Top = 258, Width = 140, Height = 33, Text = "입력 감지 (5초)" };
        var apply = new Button { Left = 327, Top = 258, Width = 100, Height = 33, Text = "적용", DialogResult = DialogResult.None };
        var cancel = new Button { Left = 436, Top = 258, Width = 92, Height = 33, Text = "취소", DialogResult = DialogResult.Cancel };
        form.Controls.AddRange([driverLabel, driver, inputLabel, input, outputLabel, left, right, info, probe, apply, cancel]);
        form.CancelButton = cancel;

        void Populate()
        {
            input.Items.Clear(); left.Items.Clear(); right.Items.Clear();
            try
            {
                using var device = AsioDevice.Open((string)driver.SelectedItem!);
                var caps = device.Capabilities;
                for (var i = 0; i < caps.NbInputChannels; i++)
                    input.Items.Add($"{i + 1}: {caps.InputChannelInfos[i].name}");
                for (var i = 0; i < caps.NbOutputChannels; i++)
                {
                    left.Items.Add($"{i + 1}: {caps.OutputChannelInfos[i].name}");
                    right.Items.Add($"{i + 1}: {caps.OutputChannelInfos[i].name}");
                }
                var names = Enumerable.Range(0, caps.NbInputChannels).Select(i => caps.InputChannelInfos[i].name).ToArray();
                var named = FindNamedInstrument(names);
                input.SelectedIndex = named >= 0 ? named : Math.Clamp(initial.Input, 0, Math.Max(0, input.Items.Count - 1));
                var same = string.Equals((string)driver.SelectedItem, initial.Driver, StringComparison.OrdinalIgnoreCase);
                left.SelectedIndex = same && initial.Left < left.Items.Count ? initial.Left : 0;
                right.SelectedIndex = same && initial.Right < right.Items.Count ? initial.Right : Math.Min(1, right.Items.Count - 1);
                if (named >= 0) info.Text = $"INST 이름을 찾았습니다: 입력 {named + 1}. 실제 잭 연결을 확인하세요.";
                else info.Text = "INST 표기가 없으면 기타를 연주하면서 '입력 감지'를 누르거나 직접 입력을 선택하세요.";
                probe.Enabled = caps.NbInputChannels > 1;
                apply.Enabled = input.Items.Count > 0 && right.Items.Count > 1;
            }
            catch (Exception error)
            {
                info.Text = $"드라이버를 열 수 없습니다: {error.Message}";
                probe.Enabled = apply.Enabled = false;
            }
        }
        driver.SelectedIndexChanged += (_, _) => Populate();
        driver.SelectedItem = drivers.FirstOrDefault(name => name.Equals(initial.Driver, StringComparison.OrdinalIgnoreCase)) ?? drivers[0];
        probe.Click += (_, _) =>
        {
            info.Text = "기타 줄을 여러 번 튕겨 주세요. 입력을 5초 동안 검사합니다…";
            probe.Enabled = apply.Enabled = driver.Enabled = cancel.Enabled = false;
            form.ControlBox = false;
            info.Refresh();
            try
            {
                var detected = DetectActiveInput((string)driver.SelectedItem!, TimeSpan.FromSeconds(5), form);
                if (detected >= 0)
                {
                    input.SelectedIndex = detected;
                    info.Text = $"입력 {detected + 1}의 신호를 감지했습니다. 연결이 맞으면 적용하세요.";
                }
                else info.Text = "뚜렷한 기타 신호를 찾지 못했습니다. 장치의 INST 설정과 게인을 확인한 후 다시 연주하거나 직접 고르세요.";
            }
            catch (Exception error) { info.Text = $"입력 감지 실패: {error.Message}. 입력을 직접 고르세요."; }
            driver.Enabled = cancel.Enabled = form.ControlBox = probe.Enabled = true;
            apply.Enabled = input.Items.Count > 0 && right.Items.Count > 1;
        };
        apply.Click += (_, _) =>
        {
            if (input.SelectedIndex < 0 || left.SelectedIndex < 0 || right.SelectedIndex < 0 ||
                left.SelectedIndex == right.SelectedIndex)
            {
                info.Text = "기타 입력과 서로 다른 좌·우 출력을 선택하세요.";
                return;
            }
            form.DialogResult = DialogResult.OK;
            form.Close();
        };
        return form.ShowDialog() == DialogResult.OK
            ? new AudioRoute((string)driver.SelectedItem!, input.SelectedIndex, left.SelectedIndex, right.SelectedIndex,
                initial.Rate, initial.Buffer)
            : null;
    }

    // Recording mode never sends a test tone to speakers. No audio is monitored
    // during discovery; callback work is limited to peak accumulation.
    private static int DetectActiveInput(string driver, TimeSpan duration, Form form)
    {
        using var device = AsioDevice.Open(driver);
        var count = device.Capabilities.NbInputChannels;
        var peaks = new float[count];
        device.InitRecording(new AsioRecordingOptions {
            InputChannels = Enumerable.Range(0, count).ToArray(),
            SampleRate = device.CurrentSampleRate
        });
        device.AudioCaptured += (_, buffers) =>
        {
            for (var ch = 0; ch < count; ch++)
            {
                var samples = buffers.GetChannel(ch);
                var peak = peaks[ch];
                for (var i = 0; i < samples.Length; i++)
                    peak = MathF.Max(peak, MathF.Abs(samples[i]));
                peaks[ch] = peak;
            }
        };
        device.Start();
        try
        {
            var until = DateTime.UtcNow + duration;
            while (DateTime.UtcNow < until)
            {
                Thread.Sleep(40);
                Application.DoEvents();
            }
        }
        finally { device.Stop(); }
        var order = Enumerable.Range(0, count).OrderByDescending(i => peaks[i]).ToArray();
        // Require a clearly dominant, audible channel; a silent probe must not
        // quietly route to a microphone or virtual loopback.
        return order.Length > 0 && peaks[order[0]] >= 0.005f &&
            (order.Length == 1 || peaks[order[0]] >= 2 * peaks[order[1]])
            ? order[0] : -1;
    }
}
