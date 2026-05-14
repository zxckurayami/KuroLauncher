using Microsoft.Win32;
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

namespace KuroSetup
{
    static class InstallerProgram
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }

    public class InstallerForm : Form
    {
        private const int TitleHeight = 52;
        private const int FooterTop = 508;

        private Image logo;
        private int page;
        private string hover = "";
        private string openDropdown = "";
        private bool pathFocused;
        private int pathCaretIndex;
        private bool dragging;
        private Point dragStart;

        private string installPath;
        private string language = "ru";
        private string theme = "dark";
        private string ram = "4096 MB";
        private int javaMode;

        private bool desktopShortcut = true;
        private bool startMenuShortcut = true;
        private bool kuroBoost = true;
        private bool firewall = true;
        private bool autostart;
        private bool checkUpdates = true;
        private bool runLauncher = true;
        private bool openFolder;
        private bool installing;
        private int installProgress;
        private string installStatus = "";

        public InstallerForm()
        {
            Text = T("windowTitle");
            AutoScaleMode = AutoScaleMode.None;
            ClientSize = new Size(980, 580);
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.None;
            BackColor = KuroTheme.Bg;
            DoubleBuffered = true;
            Font = KuroTheme.BodyFont;
            KeyPreview = true;
            TabStop = true;
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint, true);

            logo = KuroTheme.LoadLogo();
            installPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "KuroLauncher");
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            DrawShell(g);

            if (page == 0) DrawWelcome(g);
            else if (page == 1) DrawFolder(g);
            else if (page == 2) DrawComponents(g);
            else if (page == 3) DrawSettings(g);
            else if (page == 4) DrawInstalling(g);
            else DrawFinish(g);

            DrawFooter(g);
            DrawTracker(g, page);
            DrawDropdown(g);
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            if (dragging)
            {
                Location = new Point(Location.X + e.X - dragStart.X, Location.Y + e.Y - dragStart.Y);
                return;
            }

            string next = HitTest(e.Location);
            if (next != hover)
            {
                hover = next;
                Invalidate();
            }
        }

        protected override void OnMouseDown(MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left && e.Y <= TitleHeight && e.X < Width - 110)
            {
                dragging = true;
                dragStart = e.Location;
            }
            base.OnMouseDown(e);
        }

        protected override void OnMouseUp(MouseEventArgs e)
        {
            dragging = false;
            base.OnMouseUp(e);
        }

        protected override void OnMouseLeave(EventArgs e)
        {
            hover = "";
            Invalidate();
            base.OnMouseLeave(e);
        }

        protected override void OnMouseClick(MouseEventArgs e)
        {
            Focus();

            if (openDropdown.Length > 0)
            {
                int optionIndex = DropdownOptionHit(e.Location);
                if (optionIndex >= 0)
                {
                    ApplyDropdownChoice(openDropdown, optionIndex);
                    openDropdown = "";
                    pathFocused = false;
                    Invalidate();
                    return;
                }
                if (!GetSelectRect(openDropdown).Contains(e.Location))
                    openDropdown = "";
            }

            string hit = HitTest(e.Location);

            if (hit == "close")
            {
                Close();
                return;
            }
            if (hit == "min")
            {
                WindowState = FormWindowState.Minimized;
                return;
            }

            if (installing) return;

            if (hit == "next") GoNext();
            else if (hit == "back") GoBack();
            else if (hit == "path") FocusPathField();
            else if (hit == "lang") OpenDropdown("lang");
            else if (hit == "browse") BrowseFolder();
            else if (hit.StartsWith("component")) ToggleComponent(hit);
            else if (hit.StartsWith("select")) OpenDropdown(hit);
            else if (hit == "updates") checkUpdates = !checkUpdates;
            else if (hit == "run") runLauncher = !runLauncher;
            else if (hit == "open") openFolder = !openFolder;
            else pathFocused = false;

            Invalidate();
        }

        protected override void OnKeyDown(KeyEventArgs e)
        {
            if (!pathFocused) return;

            if (e.Control && e.KeyCode == Keys.V)
            {
                InsertPathText(Clipboard.GetText());
                e.SuppressKeyPress = true;
            }
            else if (e.Control && e.KeyCode == Keys.A)
            {
                pathCaretIndex = installPath.Length;
                e.SuppressKeyPress = true;
            }
            else if (e.KeyCode == Keys.Back)
            {
                if (pathCaretIndex > 0 && installPath.Length > 0)
                {
                    installPath = installPath.Remove(pathCaretIndex - 1, 1);
                    pathCaretIndex--;
                }
                e.SuppressKeyPress = true;
            }
            else if (e.KeyCode == Keys.Delete)
            {
                if (pathCaretIndex >= 0 && pathCaretIndex < installPath.Length)
                    installPath = installPath.Remove(pathCaretIndex, 1);
                e.SuppressKeyPress = true;
            }
            else if (e.KeyCode == Keys.Left)
            {
                pathCaretIndex = Math.Max(0, pathCaretIndex - 1);
                e.SuppressKeyPress = true;
            }
            else if (e.KeyCode == Keys.Right)
            {
                pathCaretIndex = Math.Min(installPath.Length, pathCaretIndex + 1);
                e.SuppressKeyPress = true;
            }
            else if (e.KeyCode == Keys.Home)
            {
                pathCaretIndex = 0;
                e.SuppressKeyPress = true;
            }
            else if (e.KeyCode == Keys.End)
            {
                pathCaretIndex = installPath.Length;
                e.SuppressKeyPress = true;
            }
            else if (e.KeyCode == Keys.Enter || e.KeyCode == Keys.Escape)
            {
                pathFocused = false;
                e.SuppressKeyPress = true;
            }

            Invalidate(RectPathInflated());
        }

        protected override void OnKeyPress(KeyPressEventArgs e)
        {
            if (!pathFocused) return;
            if (!char.IsControl(e.KeyChar))
            {
                InsertPathText(e.KeyChar.ToString());
                e.Handled = true;
            }
        }

        protected override bool IsInputKey(Keys keyData)
        {
            Keys key = keyData & Keys.KeyCode;
            if (pathFocused && (key == Keys.Left || key == Keys.Right || key == Keys.Home || key == Keys.End))
                return true;
            return base.IsInputKey(keyData);
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (installing)
            {
                e.Cancel = true;
                return;
            }
            base.OnFormClosing(e);
        }

        private void GoNext()
        {
            openDropdown = "";
            pathFocused = false;
            if (page == 0) page = 1;
            else if (page == 1)
            {
                if (installPath.Trim().Length == 0)
                {
                    MessageBox.Show(this, T("chooseFolderWarning"), "KuroLauncher", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }
                page = 2;
            }
            else if (page == 2) page = 3;
            else if (page == 3) StartInstall();
            else if (page == 5)
            {
                FinishActions();
                Close();
            }
        }

        private void GoBack()
        {
            openDropdown = "";
            pathFocused = false;
            if (page > 0 && page < 4) page--;
        }

        private void ToggleLanguage()
        {
            language = language == "ru" ? "en" : "ru";
            Text = T("windowTitle");
        }

        private bool IsRu()
        {
            return language == "ru";
        }

        private string T(string key)
        {
            bool ru = IsRu();
            switch (key)
            {
                case "windowTitle": return ru ? "Установка KuroLauncher" : "KuroLauncher Setup";
                case "welcomeTitle": return ru ? "Установка KuroLauncher" : "KuroLauncher Setup";
                case "welcomeText": return ru ? "Версия 0.4.0 с авторскими проектами, RU/EN интерфейсом, настройками запуска и аккуратным тёмным оформлением." : "Version 0.4.0 with author projects, RU/EN interface, launch settings, and a clean dark style.";
                case "featureFast": return ru ? "Быстрый запуск игры" : "Fast game launch";
                case "featureMods": return ru ? "Моды, сборки и профили" : "Mods, builds, and profiles";
                case "featureBoost": return ru ? "KuroBoost и настройки лаунчера" : "KuroBoost and launcher settings";
                case "readyInstall": return ru ? "Готов к установке" : "Ready to install";

                case "folderStep": return ru ? "Папка установки" : "Install folder";
                case "folderTitle": return ru ? "Выбор папки установки" : "Choose install folder";
                case "folderText": return ru ? "Выберите папку, куда будут распакованы файлы лаунчера и деинсталлятор." : "Choose where launcher files and the uninstaller will be placed.";
                case "browse": return ru ? "Обзор..." : "Browse...";
                case "requiredSpace": return ru ? "Требуется места: 512 MB" : "Required space: 512 MB";
                case "freeSpace": return ru ? "Свободно места: " : "Free space: ";
                case "folderDialog": return ru ? "Выберите папку установки KuroLauncher" : "Choose KuroLauncher install folder";
                case "chooseFolderWarning": return ru ? "Укажите папку установки." : "Choose an install folder.";

                case "componentsStep": return ru ? "Компоненты" : "Components";
                case "componentsTitle": return ru ? "Выбор компонентов" : "Choose components";
                case "componentsText": return ru ? "Отметьте ярлыки и служебные параметры, которые нужно добавить при установке." : "Select shortcuts and service options to add during installation.";
                case "desktopShortcut": return ru ? "Ярлык на рабочий стол" : "Desktop shortcut";
                case "startShortcut": return ru ? "Ярлык в меню Пуск" : "Start menu shortcut";
                case "boostProfile": return ru ? "KuroBoost профиль" : "KuroBoost profile";
                case "firewall": return ru ? "Добавить в исключения брандмауэра" : "Add firewall exception";
                case "autostart": return ru ? "Автозапуск при включении ПК" : "Start with Windows";
                case "required": return ru ? "обязательно" : "required";
                case "recommended": return ru ? "рекомендуется" : "recommended";
                case "later": return ru ? "можно позже" : "can be changed later";
                case "optional": return ru ? "опционально" : "optional";

                case "settingsStep": return ru ? "Настройки" : "Settings";
                case "settingsTitle": return ru ? "Настройка KuroLauncher" : "Configure KuroLauncher";
                case "settingsText": return ru ? "Основные параметры будут применены после первого запуска." : "These launcher settings will be applied on first launch.";
                case "themeLabel": return ru ? "Тема приложения" : "App theme";
                case "languageLabel": return ru ? "Язык лаунчера" : "Launcher language";
                case "memoryLabel": return ru ? "Память для Minecraft" : "Minecraft memory";
                case "javaLabel": return ru ? "Путь к Java" : "Java path";
                case "updatesLabel": return ru ? "Проверить обновления после установки" : "Check for updates after installation";
                case "themeDark": return ru ? "Тёмная (рекомендуется)" : "Dark (recommended)";
                case "themeLight": return ru ? "Светлая" : "Light";
                case "javaAuto": return ru ? "Автоматический выбор" : "Automatic selection";

                case "installStep": return ru ? "Установка" : "Installing";
                case "installTitle": return ru ? "Установка..." : "Installing...";
                case "installText": return ru ? "Пожалуйста, подождите, пока KuroLauncher устанавливается на ваш компьютер." : "Please wait while KuroLauncher is being installed on your computer.";
                case "prepFolder": return ru ? "Подготовка папки установки..." : "Preparing install folder...";
                case "prepFiles": return ru ? "Подготовка файлов..." : "Preparing files...";
                case "writeUninstaller": return ru ? "Запись деинсталлятора..." : "Writing uninstaller...";
                case "createShortcuts": return ru ? "Создание ярлыков..." : "Creating shortcuts...";
                case "saveSettings": return ru ? "Сохранение настроек..." : "Saving settings...";
                case "doneStatus": return ru ? "Готово" : "Done";
                case "extracting": return ru ? "Извлечение файлов... " : "Extracting files... ";
                case "installFailed": return ru ? "Не удалось установить KuroLauncher:\n" : "Failed to install KuroLauncher:\n";
                case "payloadMissing": return ru ? "В установщик не встроен payload.zip." : "payload.zip is not embedded in the installer.";
                case "uninstallerMissing": return ru ? "В установщик не встроен деинсталлятор." : "The uninstaller is not embedded in the installer.";

                case "finishStep": return ru ? "Готово" : "Done";
                case "finishTitle": return ru ? "Установка завершена!" : "Installation complete!";
                case "finishText": return ru ? "KuroLauncher установлен. В папке лаунчера находится деинсталлятор в таком же стиле." : "KuroLauncher has been installed. The launcher folder includes a matching custom uninstaller.";
                case "runLauncher": return ru ? "Запустить KuroLauncher" : "Launch KuroLauncher";
                case "openFolder": return ru ? "Открыть папку лаунчера" : "Open launcher folder";

                case "startStep": return ru ? "Старт" : "Start";
                case "step": return ru ? "Шаг" : "Step";
                case "back": return ru ? "< Назад" : "< Back";
                case "next": return ru ? "Далее >" : "Next >";
                case "installButton": return ru ? "Установить" : "Install";
                case "doneButton": return ru ? "Готово" : "Done";
                case "uninstallShortcut": return ru ? "Удалить KuroLauncher.lnk" : "Uninstall KuroLauncher.lnk";
                case "unknownSpace": return ru ? "не удалось определить" : "could not detect";
            }
            return key;
        }

        private string StepText(int number)
        {
            return T("step") + " " + number.ToString("00");
        }

        private void FocusPathField()
        {
            openDropdown = "";
            pathFocused = true;
            pathCaretIndex = Math.Max(0, Math.Min(installPath.Length, pathCaretIndex));
            if (pathCaretIndex == 0) pathCaretIndex = installPath.Length;
        }

        private void InsertPathText(string text)
        {
            if (string.IsNullOrEmpty(text)) return;
            text = text.Replace("\r", "").Replace("\n", "");
            pathCaretIndex = Math.Max(0, Math.Min(installPath.Length, pathCaretIndex));
            installPath = installPath.Insert(pathCaretIndex, text);
            pathCaretIndex += text.Length;
            Invalidate(RectPathInflated());
        }

        private void OpenDropdown(string key)
        {
            pathFocused = false;
            openDropdown = openDropdown == key ? "" : key;
        }

        private void ApplyDropdownChoice(string key, int optionIndex)
        {
            if (key == "lang" || key == "selectLanguage")
            {
                language = optionIndex == 0 ? "ru" : "en";
                Text = T("windowTitle");
            }
            else if (key == "selectTheme")
            {
                theme = optionIndex == 0 ? "dark" : "light";
            }
            else if (key == "selectRam")
            {
                string[] options = DropdownOptions(key);
                if (optionIndex >= 0 && optionIndex < options.Length) ram = options[optionIndex];
            }
            else if (key == "selectJava")
            {
                javaMode = optionIndex == 0 ? 0 : 1;
            }
        }

        private void BrowseFolder()
        {
            pathFocused = false;
            openDropdown = "";
            using (FolderBrowserDialog dialog = new FolderBrowserDialog())
            {
                dialog.Description = T("folderDialog");
                string basePath = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                try
                {
                    string parent = Directory.GetParent(installPath).FullName;
                    if (Directory.Exists(parent)) basePath = parent;
                }
                catch { }
                dialog.SelectedPath = basePath;
                if (dialog.ShowDialog(this) == DialogResult.OK)
                    installPath = Path.Combine(dialog.SelectedPath, "KuroLauncher");
            }
        }

        private void ToggleComponent(string hit)
        {
            if (hit == "component1") desktopShortcut = !desktopShortcut;
            else if (hit == "component2") startMenuShortcut = !startMenuShortcut;
            else if (hit == "component3") kuroBoost = !kuroBoost;
            else if (hit == "component4") firewall = !firewall;
            else if (hit == "component5") autostart = !autostart;
        }

        private void StartInstall()
        {
            page = 4;
            installing = true;
            installProgress = 0;
            installStatus = T("prepFiles");
            Invalidate();
            ThreadPool.QueueUserWorkItem(delegate { InstallWork(); });
        }

        private void InstallWork()
        {
            try
            {
                StopExistingLauncher();
                Directory.CreateDirectory(installPath);
                SetProgress(4, T("prepFolder"));
                ExtractPayload();
                SetProgress(82, T("writeUninstaller"));
                WriteUninstaller();
                SetProgress(88, T("createShortcuts"));
                CreateShortcuts();
                SetProgress(93, T("saveSettings"));
                WriteSettings();
                WriteRegistry();
                SetProgress(100, T("doneStatus"));
                Thread.Sleep(220);
                BeginInvoke((Action)(delegate
                {
                    installing = false;
                    page = 5;
                    Invalidate();
                }));
            }
            catch (Exception ex)
            {
                BeginInvoke((Action)(delegate
                {
                    installing = false;
                    page = 1;
                    Invalidate();
                    MessageBox.Show(this, T("installFailed") + ex.Message, "KuroLauncher", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }));
            }
        }

        private void SetProgress(int value, string text)
        {
            try
            {
                BeginInvoke((Action)(delegate
                {
                    installProgress = Math.Max(0, Math.Min(100, value));
                    installStatus = text;
                    Invalidate(new Rectangle(240, 300, 620, 84));
                }));
            }
            catch { }
        }

        private void DrawShell(Graphics g)
        {
            using (LinearGradientBrush bg = new LinearGradientBrush(ClientRectangle, KuroTheme.Bg, KuroTheme.Bg2, 35f))
                g.FillRectangle(bg, ClientRectangle);

            DrawGlow(g, -35, 60, 260, 58);
            DrawGlow(g, 870, 70, 260, 38);
            DrawGlow(g, 330, 500, 220, 24);

            using (Pen grid = new Pen(Color.FromArgb(6, 255, 255, 255)))
            {
                for (int x = 0; x < Width; x += 48) g.DrawLine(grid, x, TitleHeight, x, FooterTop);
                for (int y = TitleHeight; y < FooterTop; y += 48) g.DrawLine(grid, 0, y, Width, y);
            }

            using (SolidBrush title = new SolidBrush(Color.FromArgb(220, 12, 13, 17)))
                g.FillRectangle(title, 0, 0, Width, TitleHeight);
            using (Pen line = new Pen(Color.FromArgb(44, 255, 255, 255)))
            {
                g.DrawLine(line, 0, TitleHeight, Width, TitleHeight);
                g.DrawLine(line, 0, FooterTop, Width, FooterTop);
            }

            DrawLogoMark(g, 24, 15, 24);
            TextRenderer.DrawText(g, T("windowTitle"), KuroTheme.StrongFont, new Rectangle(58, 15, 170, 24), KuroTheme.Text, TextFormatFlags.VerticalCenter | TextFormatFlags.Left);
            TextRenderer.DrawText(g, "v0.4.0", KuroTheme.SmallFont, new Rectangle(230, 15, 80, 24), KuroTheme.Muted, TextFormatFlags.VerticalCenter | TextFormatFlags.Left);

            DrawWindowButton(g, RectMin(), "−", hover == "min");
            DrawWindowButton(g, RectClose(), "×", hover == "close");

            using (Pen border = new Pen(Color.FromArgb(70, 255, 46, 46)))
                g.DrawRectangle(border, 0, 0, Width - 1, Height - 1);
        }

        private void DrawWelcome(Graphics g)
        {
            DrawHero(g, new Rectangle(38, 86, 352, 332));

            DrawText(g, T("welcomeTitle"), 448, 136, 450, 48, KuroTheme.H1Font, KuroTheme.Text);
            DrawText(g, T("welcomeText"), 448, 190, 420, 64, KuroTheme.BodyFont, KuroTheme.Muted);
            DrawFeature(g, 448, 288, "01", T("featureFast"));
            DrawFeature(g, 448, 336, "02", T("featureMods"));
            DrawFeature(g, 448, 384, "03", T("featureBoost"));
            DrawSelect(g, RectLang(), language == "ru" ? "Русский" : "English", hover == "lang" || openDropdown == "lang");
        }

        private void DrawFolder(Graphics g)
        {
            DrawStageBadge(g, "folder", StepText(2), T("folderStep"));
            DrawText(g, T("folderTitle"), 240, 126, 560, 48, KuroTheme.H1Font, KuroTheme.Text);
            DrawText(g, T("folderText"), 240, 178, 560, 44, KuroTheme.BodyFont, KuroTheme.Muted);
            DrawField(g, RectPath(), installPath, pathFocused);
            DrawButton(g, RectBrowse(), T("browse"), false, hover == "browse");
            DrawText(g, T("requiredSpace"), 240, 338, 280, 28, KuroTheme.BodyFont, KuroTheme.Text);
            DrawText(g, T("freeSpace") + GetFreeSpaceText(installPath), 240, 376, 340, 28, KuroTheme.BodyFont, KuroTheme.Text);
        }

        private void DrawComponents(Graphics g)
        {
            DrawStageBadge(g, "settings", StepText(3), T("componentsStep"));
            DrawText(g, T("componentsTitle"), 240, 112, 560, 48, KuroTheme.H1Font, KuroTheme.Text);
            DrawText(g, T("componentsText"), 240, 160, 580, 36, KuroTheme.BodyFont, KuroTheme.Muted);
            Rectangle card = new Rectangle(240, 200, 570, 242);
            DrawPanel(g, card, 12);

            DrawCheckRow(g, card, 0, "KuroLauncher", T("required"), true, false);
            DrawCheckRow(g, card, 1, T("desktopShortcut"), T("recommended"), desktopShortcut, true);
            DrawCheckRow(g, card, 2, T("startShortcut"), T("recommended"), startMenuShortcut, true);
            DrawCheckRow(g, card, 3, T("boostProfile"), T("recommended"), kuroBoost, true);
            DrawCheckRow(g, card, 4, T("firewall"), T("later"), firewall, true);
            DrawCheckRow(g, card, 5, T("autostart"), T("optional"), autostart, true);
            DrawText(g, T("requiredSpace"), 240, 446, 260, 22, KuroTheme.SmallFont, KuroTheme.Muted);
        }

        private void DrawSettings(Graphics g)
        {
            DrawStageBadge(g, "settings", StepText(4), T("settingsStep"));
            DrawText(g, T("settingsTitle"), 230, 108, 560, 48, KuroTheme.H1Font, KuroTheme.Text);
            DrawText(g, T("settingsText"), 230, 154, 560, 32, KuroTheme.BodyFont, KuroTheme.Muted);

            DrawText(g, T("themeLabel"), 230, 206, 250, 30, KuroTheme.BodyFont, KuroTheme.Text);
            DrawSelect(g, RectTheme(), theme == "dark" ? T("themeDark") : T("themeLight"), hover == "selectTheme" || openDropdown == "selectTheme");
            DrawText(g, T("languageLabel"), 230, 264, 250, 30, KuroTheme.BodyFont, KuroTheme.Text);
            DrawSelect(g, RectLanguage(), language == "ru" ? "Русский" : "English", hover == "selectLanguage" || openDropdown == "selectLanguage");
            DrawText(g, T("memoryLabel"), 230, 322, 250, 30, KuroTheme.BodyFont, KuroTheme.Text);
            DrawSelect(g, RectRam(), ram, hover == "selectRam" || openDropdown == "selectRam");
            DrawText(g, T("javaLabel"), 230, 380, 250, 30, KuroTheme.BodyFont, KuroTheme.Text);
            DrawSelect(g, RectJava(), javaMode == 0 ? T("javaAuto") : "java", hover == "selectJava" || openDropdown == "selectJava");
            DrawCheckbox(g, 230, 446, checkUpdates, true);
            DrawText(g, T("updatesLabel"), 260, 440, 360, 30, KuroTheme.BodyFont, KuroTheme.Text);
        }

        private void DrawInstalling(Graphics g)
        {
            DrawStageBadge(g, "install", StepText(5), T("installStep"));
            DrawText(g, T("installTitle"), 250, 190, 420, 48, KuroTheme.H1Font, KuroTheme.Text);
            DrawText(g, T("installText"), 250, 240, 520, 54, KuroTheme.BodyFont, KuroTheme.Muted);
            DrawText(g, installStatus, 250, 318, 440, 28, KuroTheme.BodyFont, KuroTheme.Text);
            DrawProgress(g, new Rectangle(250, 356, 560, 12), installProgress);
        }

        private void DrawFinish(Graphics g)
        {
            DrawStageBadge(g, "check", StepText(6), T("finishStep"));
            DrawText(g, T("finishTitle"), 250, 160, 520, 48, KuroTheme.H1Font, KuroTheme.Text);
            DrawText(g, T("finishText"), 250, 214, 540, 54, KuroTheme.BodyFont, KuroTheme.Muted);
            Rectangle card = new Rectangle(250, 308, 380, 92);
            DrawPanel(g, card, 10);
            DrawCheckbox(g, card.X + 22, card.Y + 26, runLauncher, true);
            DrawText(g, T("runLauncher"), card.X + 52, card.Y + 20, 280, 28, KuroTheme.BodyFont, KuroTheme.Text);
            DrawCheckbox(g, card.X + 22, card.Y + 58, openFolder, true);
            DrawText(g, T("openFolder"), card.X + 52, card.Y + 52, 280, 28, KuroTheme.BodyFont, KuroTheme.Text);
        }

        private void DrawFooter(Graphics g)
        {
            if (page > 0 && page < 4) DrawButton(g, RectBack(), T("back"), false, hover == "back");
            if (page < 3) DrawButton(g, RectNext(), T("next"), true, hover == "next");
            else if (page == 3) DrawButton(g, RectNext(), T("installButton"), true, hover == "next");
            else if (page == 5) DrawButton(g, RectNext(), T("doneButton"), true, hover == "next");
        }

        private void DrawTracker(Graphics g, int step)
        {
            string[] names = new string[] { T("startStep"), T("folderStep"), T("componentsStep"), T("settingsStep"), T("installStep"), T("finishStep") };
            string caption = T("step") + " " + (step + 1).ToString("00") + "/06  •  " + names[Math.Max(0, Math.Min(5, step))];
            TextRenderer.DrawText(g, caption, KuroTheme.SmallFont, new Rectangle(378, 470, 260, 18), KuroTheme.Muted, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
            int x = 378;
            int y = 496;
            for (int i = 0; i < 6; i++)
            {
                Rectangle segment = new Rectangle(x + i * 44, y, 38, 5);
                using (SolidBrush brush = new SolidBrush(i <= step ? KuroTheme.Accent : Color.FromArgb(64, 255, 255, 255)))
                using (GraphicsPath path = KuroTheme.Rounded(segment, 3))
                    g.FillPath(brush, path);
            }
        }

        private void DrawHero(Graphics g, Rectangle rect)
        {
            DrawPanel(g, rect, 12);
            DrawGlow(g, rect.X + rect.Width / 2, rect.Y + 128, 210, 65);
            DrawGlow(g, rect.X + rect.Width / 2, rect.Bottom - 52, 180, 42);
            using (Pen grid = new Pen(Color.FromArgb(10, 255, 255, 255)))
            {
                for (int x = rect.X + 28; x < rect.Right - 28; x += 44) g.DrawLine(grid, x, rect.Y + 26, x, rect.Bottom - 26);
                for (int y = rect.Y + 26; y < rect.Bottom - 26; y += 44) g.DrawLine(grid, rect.X + 28, y, rect.Right - 28, y);
            }

            Rectangle top = new Rectangle(rect.X + 44, rect.Y + 42, rect.Width - 88, 62);
            using (GraphicsPath path = KuroTheme.Rounded(top, 10))
            using (SolidBrush fill = new SolidBrush(Color.FromArgb(64, 255, 255, 255)))
            using (Pen pen = new Pen(Color.FromArgb(40, 255, 255, 255)))
            {
                g.FillPath(fill, path);
                g.DrawPath(pen, path);
            }
            TextRenderer.DrawText(g, "KUROLAUNCHER", KuroTheme.StrongFont, top, KuroTheme.Text, TextFormatFlags.HorizontalCenter | TextFormatFlags.Top | TextFormatFlags.EndEllipsis);
            TextRenderer.DrawText(g, IsRu() ? "0.4.0  •  кастомный установщик" : "0.4.0  •  custom setup", KuroTheme.SmallFont, new Rectangle(top.X, top.Y + 28, top.Width, 22), KuroTheme.Muted, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);

            Rectangle logoRect = new Rectangle(rect.X + (rect.Width - 112) / 2, rect.Y + 128, 112, 112);
            using (GraphicsPath path = KuroTheme.Rounded(logoRect, 28))
            using (LinearGradientBrush brush = new LinearGradientBrush(logoRect, KuroTheme.Accent, KuroTheme.AccentDark, 45f))
                g.FillPath(brush, path);
            if (logo != null) g.DrawImage(logo, logoRect.Left + 27, logoRect.Top + 27, 58, 58);

            Rectangle info = new Rectangle(rect.X + 52, rect.Bottom - 78, rect.Width - 104, 44);
            using (GraphicsPath path = KuroTheme.Rounded(info, 10))
            using (SolidBrush fill = new SolidBrush(Color.FromArgb(36, KuroTheme.Accent)))
            using (Pen pen = new Pen(Color.FromArgb(88, KuroTheme.Accent)))
            {
                g.FillPath(fill, path);
                g.DrawPath(pen, path);
            }
            TextRenderer.DrawText(g, T("readyInstall"), KuroTheme.StrongFont, info, KuroTheme.Text, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
        }

        private void DrawFeature(Graphics g, int x, int y, string index, string text)
        {
            Rectangle chip = new Rectangle(x, y, 48, 34);
            DrawPanel(g, chip, 8);
            TextRenderer.DrawText(g, index, KuroTheme.SmallFont, chip, KuroTheme.Text, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
            DrawText(g, text, x + 66, y + 6, 320, 26, KuroTheme.BodyFont, KuroTheme.Text);
        }

        private void DrawStageBadge(Graphics g, string kind, string stepText, string caption)
        {
            Rectangle card = new Rectangle(48, 130, 150, 244);
            DrawPanel(g, card, 12);
            Rectangle chip = new Rectangle(card.X + 18, card.Y + 18, card.Width - 36, 28);
            using (GraphicsPath path = KuroTheme.Rounded(chip, 7))
            using (SolidBrush fill = new SolidBrush(Color.FromArgb(34, KuroTheme.Accent)))
            using (Pen border = new Pen(Color.FromArgb(115, KuroTheme.Accent)))
            {
                g.FillPath(fill, path);
                g.DrawPath(border, path);
            }
            TextRenderer.DrawText(g, stepText, KuroTheme.SmallFont, chip, KuroTheme.Text, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);

            Rectangle icon = new Rectangle(card.X + 34, card.Y + 76, 82, 82);
            using (GraphicsPath path = KuroTheme.Rounded(icon, 18))
            using (LinearGradientBrush fill = new LinearGradientBrush(icon, Color.FromArgb(54, KuroTheme.Accent), Color.FromArgb(18, KuroTheme.AccentDark), 45f))
            using (Pen border = new Pen(Color.FromArgb(140, KuroTheme.Accent)))
            {
                g.FillPath(fill, path);
                g.DrawPath(border, path);
            }
            DrawStepIcon(g, icon, kind);
            TextRenderer.DrawText(g, caption, KuroTheme.StrongFont, new Rectangle(card.X + 16, card.Y + 176, card.Width - 32, 44), KuroTheme.Text, TextFormatFlags.HorizontalCenter | TextFormatFlags.Top | TextFormatFlags.WordBreak);
        }

        private void DrawStepIcon(Graphics g, Rectangle box, string kind)
        {
            using (Pen pen = new Pen(Color.FromArgb(255, 112, 112), 4))
            {
                pen.StartCap = LineCap.Round;
                pen.EndCap = LineCap.Round;
                int cx = box.Left + box.Width / 2;
                int cy = box.Top + box.Height / 2;
                if (kind == "folder")
                {
                    g.DrawLine(pen, box.Left + 19, box.Top + 30, box.Left + 35, box.Top + 30);
                    g.DrawLine(pen, box.Left + 35, box.Top + 30, box.Left + 43, box.Top + 38);
                    g.DrawRectangle(pen, box.Left + 18, box.Top + 38, 46, 30);
                }
                else if (kind == "check")
                {
                    g.DrawLine(pen, cx - 24, cy, cx - 7, cy + 17);
                    g.DrawLine(pen, cx - 7, cy + 17, cx + 28, cy - 23);
                }
                else if (kind == "settings")
                {
                    g.DrawEllipse(pen, cx - 14, cy - 14, 28, 28);
                    g.DrawLine(pen, cx, cy - 32, cx, cy - 22);
                    g.DrawLine(pen, cx, cy + 22, cx, cy + 32);
                    g.DrawLine(pen, cx - 32, cy, cx - 22, cy);
                    g.DrawLine(pen, cx + 22, cy, cx + 32, cy);
                }
                else
                {
                    if (logo != null) g.DrawImage(logo, box.Left + 23, box.Top + 23, 36, 36);
                }
            }
        }

        private void DrawCheckRow(Graphics g, Rectangle card, int index, string text, string right, bool checkedValue, bool enabled)
        {
            int y = card.Y + 26 + index * 36;
            int x = card.X + 24;
            DrawCheckbox(g, x, y, checkedValue, enabled);
            DrawText(g, text, x + 30, y - 6, 330, 30, KuroTheme.BodyFont, enabled ? KuroTheme.Text : KuroTheme.Muted);
            DrawText(g, right, card.Right - 176, y - 6, 140, 30, KuroTheme.SmallFont, KuroTheme.Muted, HorizontalAlignment.Right);
        }

        private void DrawCheckbox(Graphics g, int x, int y, bool checkedValue, bool enabled)
        {
            Rectangle box = new Rectangle(x, y, 17, 17);
            using (GraphicsPath path = KuroTheme.Rounded(box, 4))
            using (SolidBrush fill = new SolidBrush(checkedValue ? KuroTheme.Accent : Color.FromArgb(28, 28, 34)))
            using (Pen pen = new Pen(checkedValue ? KuroTheme.Accent : KuroTheme.Border))
            {
                g.FillPath(fill, path);
                g.DrawPath(pen, path);
            }
            if (checkedValue)
            {
                using (Pen check = new Pen(Color.White, 2f))
                {
                    check.StartCap = LineCap.Round;
                    check.EndCap = LineCap.Round;
                    g.DrawLine(check, x + 4, y + 9, x + 7, y + 12);
                    g.DrawLine(check, x + 7, y + 12, x + 13, y + 5);
                }
            }
        }

        private void DrawSelect(Graphics g, Rectangle rect, string text, bool active)
        {
            using (GraphicsPath path = KuroTheme.Rounded(rect, 7))
            using (SolidBrush fill = new SolidBrush(active ? Color.FromArgb(32, 32, 38) : Color.FromArgb(22, 22, 27)))
            using (Pen pen = new Pen(active ? Color.FromArgb(130, KuroTheme.Accent) : Color.FromArgb(70, 255, 255, 255)))
            {
                g.FillPath(fill, path);
                g.DrawPath(pen, path);
            }
            DrawText(g, text, rect.X + 14, rect.Y + 7, rect.Width - 48, rect.Height - 8, KuroTheme.BodyFont, KuroTheme.Text);
            using (SolidBrush brush = new SolidBrush(KuroTheme.Muted))
            {
                Point[] arrow = new Point[] {
                    new Point(rect.Right - 22, rect.Top + rect.Height / 2 - 2),
                    new Point(rect.Right - 14, rect.Top + rect.Height / 2 - 2),
                    new Point(rect.Right - 18, rect.Top + rect.Height / 2 + 3)
                };
                g.FillPolygon(brush, arrow);
            }
        }

        private void DrawDropdown(Graphics g)
        {
            if (openDropdown.Length == 0) return;

            string[] options = DropdownOptions(openDropdown);
            if (options.Length == 0) return;

            Rectangle rect = DropdownRect(openDropdown);
            using (GraphicsPath path = KuroTheme.Rounded(rect, 8))
            using (SolidBrush fill = new SolidBrush(Color.FromArgb(248, 18, 18, 23)))
            using (Pen pen = new Pen(Color.FromArgb(130, KuroTheme.Accent)))
            {
                g.FillPath(fill, path);
                g.DrawPath(pen, path);
            }

            for (int i = 0; i < options.Length; i++)
            {
                Rectangle row = new Rectangle(rect.X + 4, rect.Y + 4 + i * 34, rect.Width - 8, 32);
                bool selected = IsDropdownSelected(openDropdown, i);
                bool hot = hover == "drop" + i;
                if (selected || hot)
                {
                    using (GraphicsPath path = KuroTheme.Rounded(row, 6))
                    using (SolidBrush fill = new SolidBrush(selected ? Color.FromArgb(56, KuroTheme.Accent) : Color.FromArgb(34, 255, 255, 255)))
                        g.FillPath(fill, path);
                }
                TextRenderer.DrawText(g, options[i], KuroTheme.BodyFont, new Rectangle(row.X + 10, row.Y, row.Width - 20, row.Height), selected ? KuroTheme.Text : KuroTheme.Muted, TextFormatFlags.Left | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis | TextFormatFlags.SingleLine);
            }
        }

        private void DrawField(Graphics g, Rectangle rect, string text, bool active)
        {
            using (GraphicsPath path = KuroTheme.Rounded(rect, 7))
            using (SolidBrush fill = new SolidBrush(active ? Color.FromArgb(24, 24, 30) : Color.FromArgb(18, 18, 22)))
            using (Pen pen = new Pen(active ? Color.FromArgb(145, KuroTheme.Accent) : Color.FromArgb(64, 255, 255, 255)))
            {
                g.FillPath(fill, path);
                g.DrawPath(pen, path);
            }
            Rectangle textRect = new Rectangle(rect.X + 12, rect.Y + 6, rect.Width - 24, rect.Height - 8);
            TextRenderer.DrawText(g, text, KuroTheme.BodyFont, textRect, KuroTheme.Text, TextFormatFlags.Left | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis | TextFormatFlags.SingleLine);
            if (active)
            {
                string prefix = pathCaretIndex <= 0 ? "" : text.Substring(0, Math.Min(pathCaretIndex, text.Length));
                int caretX = textRect.X + Math.Min(textRect.Width - 2, TextRenderer.MeasureText(prefix, KuroTheme.BodyFont).Width - 4);
                using (Pen caret = new Pen(KuroTheme.Accent, 1.5f))
                    g.DrawLine(caret, caretX, rect.Y + 8, caretX, rect.Bottom - 8);
            }
        }

        private void DrawButton(Graphics g, Rectangle rect, string text, bool primary, bool active)
        {
            Color a = primary ? KuroTheme.Accent : Color.FromArgb(42, 42, 48);
            Color b = primary ? KuroTheme.AccentDark : Color.FromArgb(28, 28, 34);
            if (active)
            {
                a = primary ? Color.FromArgb(255, 70, 70) : Color.FromArgb(54, 54, 60);
                b = primary ? Color.FromArgb(205, 0, 0) : Color.FromArgb(36, 36, 42);
            }
            using (GraphicsPath path = KuroTheme.Rounded(rect, 7))
            using (LinearGradientBrush brush = new LinearGradientBrush(rect, a, b, 90f))
            using (Pen pen = new Pen(primary ? Color.FromArgb(160, 255, 110, 110) : KuroTheme.Border))
            {
                g.FillPath(brush, path);
                g.DrawPath(pen, path);
            }
            TextRenderer.DrawText(g, text, KuroTheme.StrongFont, rect, KuroTheme.Text, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
        }

        private void DrawPanel(Graphics g, Rectangle rect, int radius)
        {
            using (GraphicsPath path = KuroTheme.Rounded(rect, radius))
            using (LinearGradientBrush brush = new LinearGradientBrush(rect, Color.FromArgb(125, KuroTheme.Panel), Color.FromArgb(78, KuroTheme.Panel2), 22f))
            using (Pen pen = new Pen(KuroTheme.Border))
            {
                g.FillPath(brush, path);
                g.DrawPath(pen, path);
            }
        }

        private void DrawProgress(Graphics g, Rectangle rect, int value)
        {
            using (GraphicsPath path = KuroTheme.Rounded(rect, 5))
            using (SolidBrush bg = new SolidBrush(Color.FromArgb(30, 30, 36)))
            using (Pen pen = new Pen(KuroTheme.Border))
            {
                g.FillPath(bg, path);
                g.DrawPath(pen, path);
            }
            int w = Math.Max(4, (rect.Width - 2) * Math.Max(0, Math.Min(100, value)) / 100);
            Rectangle fillRect = new Rectangle(rect.X + 1, rect.Y + 1, w, rect.Height - 3);
            using (GraphicsPath path = KuroTheme.Rounded(fillRect, 5))
            using (LinearGradientBrush brush = new LinearGradientBrush(fillRect, KuroTheme.Accent, KuroTheme.AccentDark, 0f))
                g.FillPath(brush, path);
        }

        private void DrawText(Graphics g, string text, int x, int y, int w, int h, Font font, Color color)
        {
            DrawText(g, text, x, y, w, h, font, color, HorizontalAlignment.Left);
        }

        private void DrawText(Graphics g, string text, int x, int y, int w, int h, Font font, Color color, HorizontalAlignment align)
        {
            TextFormatFlags flags = TextFormatFlags.WordBreak | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis;
            if (align == HorizontalAlignment.Right) flags |= TextFormatFlags.Right;
            else if (align == HorizontalAlignment.Center) flags |= TextFormatFlags.HorizontalCenter;
            else flags |= TextFormatFlags.Left;
            TextRenderer.DrawText(g, text, font, new Rectangle(x, y, w, h), color, flags);
        }

        private void DrawLogoMark(Graphics g, int x, int y, int size)
        {
            Rectangle rect = new Rectangle(x, y, size, size);
            using (GraphicsPath path = KuroTheme.Rounded(rect, Math.Max(5, size / 5)))
            using (LinearGradientBrush brush = new LinearGradientBrush(rect, KuroTheme.Accent, KuroTheme.AccentDark, 45f))
                g.FillPath(brush, path);
            if (logo != null) g.DrawImage(logo, x + 4, y + 4, size - 8, size - 8);
        }

        private void DrawWindowButton(Graphics g, Rectangle rect, string text, bool active)
        {
            if (active)
            {
                using (GraphicsPath path = KuroTheme.Rounded(rect, 6))
                using (SolidBrush fill = new SolidBrush(Color.FromArgb(26, 255, 255, 255)))
                    g.FillPath(fill, path);
            }
            TextRenderer.DrawText(g, text, KuroTheme.StrongFont, rect, KuroTheme.Muted, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
        }

        private static void DrawGlow(Graphics g, int x, int y, int size, int alpha)
        {
            for (int i = size; i > 0; i -= 12)
            {
                int a = Math.Max(0, alpha * i / size / 5);
                using (SolidBrush brush = new SolidBrush(Color.FromArgb(a, KuroTheme.Accent)))
                    g.FillEllipse(brush, x - i / 2, y - i / 2, i, i);
            }
        }

        private string HitTest(Point p)
        {
            if (openDropdown.Length > 0)
            {
                int optionIndex = DropdownOptionHit(p);
                if (optionIndex >= 0) return "drop" + optionIndex;
            }
            if (RectClose().Contains(p)) return "close";
            if (RectMin().Contains(p)) return "min";
            if (RectBack().Contains(p) && page > 0 && page < 4) return "back";
            if (RectNext().Contains(p) && (page < 4 || page == 5)) return "next";
            if (page == 0 && RectLang().Contains(p)) return "lang";
            if (page == 1 && RectBrowse().Contains(p)) return "browse";
            if (page == 1 && RectPath().Contains(p)) return "path";
            if (page == 2)
            {
                Rectangle card = new Rectangle(240, 200, 570, 242);
                for (int i = 1; i <= 5; i++)
                {
                    Rectangle row = new Rectangle(card.X + 18, card.Y + 16 + i * 36, card.Width - 36, 32);
                    if (row.Contains(p)) return "component" + i;
                }
            }
            if (page == 3)
            {
                if (RectTheme().Contains(p)) return "selectTheme";
                if (RectLanguage().Contains(p)) return "selectLanguage";
                if (RectRam().Contains(p)) return "selectRam";
                if (RectJava().Contains(p)) return "selectJava";
                if (new Rectangle(230, 440, 390, 34).Contains(p)) return "updates";
            }
            if (page == 5)
            {
                if (new Rectangle(272, 328, 330, 30).Contains(p)) return "run";
                if (new Rectangle(272, 360, 330, 30).Contains(p)) return "open";
            }
            return "";
        }

        private Rectangle RectMin() { return new Rectangle(882, 15, 28, 22); }
        private Rectangle RectClose() { return new Rectangle(926, 15, 28, 22); }
        private Rectangle RectBack() { return new Rectangle(636, 529, 126, 42); }
        private Rectangle RectNext() { return new Rectangle(790, 529, 150, 42); }
        private Rectangle RectLang() { return new Rectangle(38, 438, 144, 38); }
        private Rectangle RectBrowse() { return new Rectangle(726, 234, 112, 42); }
        private Rectangle RectPath() { return new Rectangle(240, 236, 470, 34); }
        private Rectangle RectTheme() { return new Rectangle(558, 192, 310, 38); }
        private Rectangle RectLanguage() { return new Rectangle(558, 250, 310, 38); }
        private Rectangle RectRam() { return new Rectangle(558, 308, 310, 38); }
        private Rectangle RectJava() { return new Rectangle(558, 366, 310, 38); }
        private Rectangle RectPathInflated()
        {
            Rectangle rect = RectPath();
            rect.Inflate(4, 4);
            return rect;
        }

        private Rectangle GetSelectRect(string key)
        {
            if (key == "lang") return RectLang();
            if (key == "selectTheme") return RectTheme();
            if (key == "selectLanguage") return RectLanguage();
            if (key == "selectRam") return RectRam();
            if (key == "selectJava") return RectJava();
            return Rectangle.Empty;
        }

        private Rectangle DropdownRect(string key)
        {
            Rectangle source = GetSelectRect(key);
            string[] options = DropdownOptions(key);
            int height = options.Length * 34 + 8;
            int y = source.Bottom + 4;
            if (y + height > FooterTop - 6) y = source.Top - height - 4;
            return new Rectangle(source.X, y, source.Width, height);
        }

        private int DropdownOptionHit(Point p)
        {
            if (openDropdown.Length == 0) return -1;
            Rectangle rect = DropdownRect(openDropdown);
            if (!rect.Contains(p)) return -1;
            int index = (p.Y - rect.Y - 4) / 34;
            string[] options = DropdownOptions(openDropdown);
            if (index < 0 || index >= options.Length) return -1;
            return index;
        }

        private string[] DropdownOptions(string key)
        {
            if (key == "lang" || key == "selectLanguage") return new string[] { "Русский", "English" };
            if (key == "selectTheme") return new string[] { T("themeDark"), T("themeLight") };
            if (key == "selectRam") return new string[] { "4096 MB", "6144 MB", "8192 MB" };
            if (key == "selectJava") return new string[] { T("javaAuto"), "java" };
            return new string[0];
        }

        private bool IsDropdownSelected(string key, int index)
        {
            if (key == "lang" || key == "selectLanguage") return (language == "ru" && index == 0) || (language == "en" && index == 1);
            if (key == "selectTheme") return (theme == "dark" && index == 0) || (theme == "light" && index == 1);
            if (key == "selectRam")
            {
                string[] options = DropdownOptions(key);
                return index >= 0 && index < options.Length && options[index] == ram;
            }
            if (key == "selectJava") return javaMode == index;
            return false;
        }

        private string GetFreeSpaceText(string path)
        {
            try
            {
                string root = Path.GetPathRoot(path);
                if (string.IsNullOrEmpty(root)) root = Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData));
                DriveInfo drive = new DriveInfo(root);
                double gb = drive.AvailableFreeSpace / 1024d / 1024d / 1024d;
                return gb.ToString("0.0") + " GB";
            }
            catch { return T("unknownSpace"); }
        }

        private void ExtractPayload()
        {
            Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("payload.zip");
            if (stream == null) throw new InvalidOperationException(T("payloadMissing"));

            using (stream)
            using (ZipArchive archive = new ZipArchive(stream, ZipArchiveMode.Read))
            {
                int total = Math.Max(1, archive.Entries.Count);
                int index = 0;
                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    string target = Path.GetFullPath(Path.Combine(installPath, entry.FullName));
                    string root = Path.GetFullPath(installPath);
                    if (!target.StartsWith(root, StringComparison.OrdinalIgnoreCase)) continue;

                    if (entry.FullName.EndsWith("/") || entry.FullName.EndsWith("\\"))
                    {
                        Directory.CreateDirectory(target);
                    }
                    else
                    {
                        string dir = Path.GetDirectoryName(target);
                        if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                        if (File.Exists(target)) File.SetAttributes(target, FileAttributes.Normal);
                        entry.ExtractToFile(target, true);
                    }
                    index++;
                    int progress = 6 + (index * 74 / total);
                    SetProgress(progress, T("extracting") + progress + "%");
                }
            }
        }

        private void WriteUninstaller()
        {
            string target = Path.Combine(installPath, "Uninstall KuroLauncher.exe");
            Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("uninstaller.exe");
            if (stream == null) throw new InvalidOperationException(T("uninstallerMissing"));
            using (stream)
            using (FileStream file = File.Create(target))
                stream.CopyTo(file);
        }

        private void StopExistingLauncher()
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

        private void CreateShortcuts()
        {
            string exe = Path.Combine(installPath, "KuroLauncher.exe");
            if (desktopShortcut)
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                KuroShell.CreateShortcut(Path.Combine(desktop, "KuroLauncher.lnk"), exe, installPath);
            }

            if (startMenuShortcut)
            {
                string start = Environment.GetFolderPath(Environment.SpecialFolder.StartMenu);
                string group = Path.Combine(start, "Programs", "KuroLauncher");
                KuroShell.CreateShortcut(Path.Combine(group, "KuroLauncher.lnk"), exe, installPath);
                KuroShell.CreateShortcut(Path.Combine(group, T("uninstallShortcut")), Path.Combine(installPath, "Uninstall KuroLauncher.exe"), installPath);
            }

            if (autostart)
            {
                try
                {
                    RegistryKey key = Registry.CurrentUser.CreateSubKey("Software\\Microsoft\\Windows\\CurrentVersion\\Run");
                    key.SetValue("KuroLauncher", "\"" + exe + "\"");
                    key.Close();
                }
                catch { }
            }
        }

        private void WriteSettings()
        {
            string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "KuroLauncher", "kuro");
            Directory.CreateDirectory(dir);
            string ramValue = ram.StartsWith("8192") ? "8G" : (ram.StartsWith("6144") ? "6G" : "4G");
            string json =
                "{\r\n" +
                "  \"theme\": \"" + theme + "\",\r\n" +
                "  \"language\": \"" + language + "\",\r\n" +
                "  \"fontStyle\": \"classic\",\r\n" +
                "  \"javaPath\": \"java\",\r\n" +
                "  \"ram\": \"" + ramValue + "\",\r\n" +
                "  \"accent\": \"red\",\r\n" +
                "  \"fullscreen\": false,\r\n" +
                "  \"kuroBoost\": " + (kuroBoost ? "true" : "false") + ",\r\n" +
                "  \"kuroBoostPreset\": \"ai\"\r\n" +
                "}\r\n";
            File.WriteAllText(Path.Combine(dir, "settings.json"), json);
        }

        private void WriteRegistry()
        {
            try
            {
                string exe = Path.Combine(installPath, "KuroLauncher.exe");
                string uninstall = Path.Combine(installPath, "Uninstall KuroLauncher.exe");
                RegistryKey key = Registry.CurrentUser.CreateSubKey("Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KuroLauncher");
                key.SetValue("DisplayName", "KuroLauncher");
                key.SetValue("DisplayVersion", "0.4.0");
                key.SetValue("Publisher", "KuroLauncher Team");
                key.SetValue("InstallLocation", installPath);
                key.SetValue("DisplayIcon", exe);
                key.SetValue("UninstallString", "\"" + uninstall + "\"");
                key.SetValue("QuietUninstallString", "\"" + uninstall + "\"");
                key.SetValue("EstimatedSize", 512000, RegistryValueKind.DWord);
                key.Close();
            }
            catch { }
        }

        private void FinishActions()
        {
            if (openFolder)
            {
                try { Process.Start("explorer.exe", "\"" + installPath + "\""); }
                catch { }
            }
            if (runLauncher)
            {
                try { Process.Start(new ProcessStartInfo(Path.Combine(installPath, "KuroLauncher.exe")) { WorkingDirectory = installPath }); }
                catch { }
            }
        }
    }
}
