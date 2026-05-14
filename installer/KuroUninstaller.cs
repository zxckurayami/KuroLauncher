using Microsoft.Win32;
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Threading;
using System.Windows.Forms;

namespace KuroSetup
{
    static class UninstallerProgram
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new UninstallerForm());
        }
    }

    public class UninstallerForm : KuroForm
    {
        private string installPath;
        private bool removeData;
        private bool uninstalling;
        private Label statusLabel;
        private KuroProgress progress;

        public UninstallerForm()
        {
            Text = "Удаление KuroLauncher";
            windowCaption = "Удаление KuroLauncher";
            installPath = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            ShowConfirm();
        }

        private void ShowConfirm()
        {
            ClearPage();

            AddStageBadge("settings", "Удаление", "Проверка");

            AddLabel(content, "Удалить KuroLauncher?", 250, 112, 500, 44, KuroTheme.H1Font, KuroTheme.Text);
            AddLabel(content, "Будут удалены файлы лаунчера, ярлыки и запись в списке приложений Windows. Папка Minecraft с версиями, модами и ресурсами останется на месте.", 250, 170, 540, 78, KuroTheme.BodyFont, KuroTheme.Muted);

            KuroPanel card = new KuroPanel();
            card.SetBounds(250, 292, 450, 96);
            content.Controls.Add(card);
            KuroCheck data = AddCheck(card, "Удалить локальные настройки KuroLauncher", "", 24, 22, removeData);
            data.CheckedChanged += delegate { removeData = data.Checked; };
            AddLabel(card, "Обычно их лучше оставить, чтобы настройки сохранились при повторной установке.", 50, 54, 330, 28, KuroTheme.SmallFont, KuroTheme.Muted);

            FooterButton("Отмена", 344, false).Click += delegate { Close(); };
            FooterButton("Удалить", 190, true).Click += delegate { ShowRemoving(); };
            AnimatePageIn();
        }

        private void ShowRemoving()
        {
            uninstalling = true;
            ClearPage();

            AddStageBadge("install", "Удаление", "Очистка");

            AddLabel(content, "Удаление...", 250, 150, 420, 44, KuroTheme.H1Font, KuroTheme.Text);
            AddLabel(content, "KuroLauncher удаляется с вашего компьютера. Это займет несколько секунд.", 250, 204, 500, 52, KuroTheme.BodyFont, KuroTheme.Muted);

            statusLabel = AddLabel(content, "Остановка лаунчера...", 250, 294, 380, 26, KuroTheme.BodyFont, KuroTheme.Text);
            progress = new KuroProgress();
            progress.SetBounds(250, 328, 560, 12);
            content.Controls.Add(progress);

            AnimatePageIn();
            ThreadPool.QueueUserWorkItem(delegate { RemoveWork(); });
        }

        private void ShowFinish()
        {
            uninstalling = false;
            ClearPage();

            AddStageBadge("check", "Готово", "Удалено");

            AddLabel(content, "KuroLauncher удалён", 250, 140, 430, 42, KuroTheme.H1Font, KuroTheme.Text);
            AddLabel(content, "Файлы лаунчера, ярлыки и запись удаления были очищены. Если какие-то файлы были заняты, Windows удалит их после закрытия этого окна.", 250, 196, 520, 72, KuroTheme.BodyFont, KuroTheme.Muted);

            FooterButton("Готово", 190, true).Click += delegate { Close(); };
            AnimatePageIn();
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (uninstalling)
            {
                e.Cancel = true;
                return;
            }
            base.OnFormClosing(e);
        }

        private void RemoveWork()
        {
            try
            {
                SetProgress(8, "Остановка лаунчера...");
                StopLauncher();
                SetProgress(26, "Удаление ярлыков...");
                RemoveShortcuts();
                SetProgress(42, "Удаление записи Windows...");
                RemoveRegistry();
                if (removeData)
                {
                    SetProgress(54, "Удаление локальных настроек...");
                    RemoveLocalSettings();
                }
                SetProgress(68, "Удаление файлов...");
                RemoveInstalledFiles();
                SetProgress(100, "Готово");
                Thread.Sleep(260);
                BeginInvoke((Action)(delegate { ShowFinish(); }));
            }
            catch (Exception ex)
            {
                BeginInvoke((Action)(delegate
                {
                    uninstalling = false;
                    MessageBox.Show(this, "Не удалось удалить KuroLauncher:\n" + ex.Message, "KuroLauncher", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    ShowConfirm();
                }));
            }
        }

        private void StopLauncher()
        {
            try
            {
                Process[] processes = Process.GetProcessesByName("KuroLauncher");
                foreach (Process process in processes)
                {
                    try
                    {
                        if (process.Id == Process.GetCurrentProcess().Id) continue;
                        if (process.MainWindowHandle != IntPtr.Zero) process.CloseMainWindow();
                        if (!process.WaitForExit(1800)) process.Kill();
                    }
                    catch { }
                }
            }
            catch { }
        }

        private void RemoveShortcuts()
        {
            string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            KuroShell.TryDelete(Path.Combine(desktop, "KuroLauncher.lnk"));
            string group = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs", "KuroLauncher");
            try
            {
                if (Directory.Exists(group)) Directory.Delete(group, true);
            }
            catch { }
            try
            {
                RegistryKey key = Registry.CurrentUser.OpenSubKey("Software\\Microsoft\\Windows\\CurrentVersion\\Run", true);
                if (key != null)
                {
                    key.DeleteValue("KuroLauncher", false);
                    key.Close();
                }
            }
            catch { }
        }

        private void RemoveRegistry()
        {
            try
            {
                Registry.CurrentUser.DeleteSubKeyTree("Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KuroLauncher", false);
            }
            catch { }
        }

        private void RemoveLocalSettings()
        {
            try
            {
                string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "KuroLauncher");
                if (Directory.Exists(dir)) Directory.Delete(dir, true);
            }
            catch { }
        }

        private void RemoveInstalledFiles()
        {
            string self = Process.GetCurrentProcess().MainModule.FileName;
            if (!Directory.Exists(installPath)) return;

            string[] files = Directory.GetFiles(installPath, "*", SearchOption.AllDirectories);
            foreach (string file in files)
            {
                try
                {
                    if (string.Equals(Path.GetFullPath(file), Path.GetFullPath(self), StringComparison.OrdinalIgnoreCase)) continue;
                    File.SetAttributes(file, FileAttributes.Normal);
                    File.Delete(file);
                }
                catch { }
            }

            string[] dirs = Directory.GetDirectories(installPath, "*", SearchOption.AllDirectories);
            Array.Sort(dirs);
            Array.Reverse(dirs);
            foreach (string dir in dirs)
            {
                try { Directory.Delete(dir, false); }
                catch { }
            }

            ScheduleSelfDelete();
        }

        private void ScheduleSelfDelete()
        {
            try
            {
                string command = "/C ping 127.0.0.1 -n 3 > nul & rmdir /s /q \"" + installPath + "\"";
                ProcessStartInfo info = new ProcessStartInfo("cmd.exe", command);
                info.CreateNoWindow = true;
                info.WindowStyle = ProcessWindowStyle.Hidden;
                Process.Start(info);
            }
            catch { }
        }

        private void SetProgress(int value, string text)
        {
            if (progress == null || IsDisposed) return;
            try
            {
                BeginInvoke((Action)(delegate
                {
                    if (progress == null) return;
                    progress.Value = Math.Max(0, Math.Min(100, value));
                    progress.Invalidate();
                    if (statusLabel != null) statusLabel.Text = text;
                }));
            }
            catch { }
        }

        private Label AddLabel(Control parent, string text, int x, int y, int w, int h, Font font, Color color)
        {
            Label label = new Label();
            label.Text = text;
            label.SetBounds(x, y, w, h);
            label.Font = font;
            label.ForeColor = color;
            label.BackColor = Color.Transparent;
            label.AutoEllipsis = false;
            parent.Controls.Add(label);
            return label;
        }

        private void AddStageBadge(string kind, string stepText, string caption)
        {
            StepBadge badge = new StepBadge();
            badge.Kind = kind;
            badge.StepText = stepText;
            badge.Caption = caption;
            badge.SetBounds(48, 92, 150, 244);
            content.Controls.Add(badge);
        }

        private KuroCheck AddCheck(Control parent, string text, string right, int x, int y, bool checkedValue)
        {
            KuroCheck check = new KuroCheck();
            check.Text = text;
            check.RightText = right;
            check.Checked = checkedValue;
            check.SetBounds(x, y, parent.Width - x - 20, 30);
            parent.Controls.Add(check);
            return check;
        }
    }
}
