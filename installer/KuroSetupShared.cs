using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace KuroSetup
{
    public static class KuroTheme
    {
        public static readonly Color Bg = Color.FromArgb(8, 9, 12);
        public static readonly Color Bg2 = Color.FromArgb(20, 15, 18);
        public static readonly Color Panel = Color.FromArgb(24, 24, 30);
        public static readonly Color Panel2 = Color.FromArgb(33, 26, 30);
        public static readonly Color Accent = Color.FromArgb(255, 46, 46);
        public static readonly Color AccentDark = Color.FromArgb(178, 0, 0);
        public static readonly Color Border = Color.FromArgb(62, 255, 255, 255);
        public static readonly Color AccentBorder = Color.FromArgb(150, 255, 46, 46);
        public static readonly Color Text = Color.FromArgb(245, 245, 248);
        public static readonly Color Muted = Color.FromArgb(172, 172, 182);
        public static readonly Font TitleFont = new Font("Segoe UI", 20f, FontStyle.Bold);
        public static readonly Font H1Font = new Font("Segoe UI", 24f, FontStyle.Bold);
        public static readonly Font H2Font = new Font("Segoe UI", 15f, FontStyle.Bold);
        public static readonly Font BodyFont = new Font("Segoe UI", 10f, FontStyle.Regular);
        public static readonly Font SmallFont = new Font("Segoe UI", 8.5f, FontStyle.Regular);
        public static readonly Font StrongFont = new Font("Segoe UI", 9.5f, FontStyle.Bold);

        public static GraphicsPath Rounded(Rectangle rect, int radius)
        {
            GraphicsPath path = new GraphicsPath();
            int d = radius * 2;
            path.AddArc(rect.X, rect.Y, d, d, 180, 90);
            path.AddArc(rect.Right - d, rect.Y, d, d, 270, 90);
            path.AddArc(rect.Right - d, rect.Bottom - d, d, d, 0, 90);
            path.AddArc(rect.X, rect.Bottom - d, d, d, 90, 90);
            path.CloseFigure();
            return path;
        }

        public static Image LoadLogo()
        {
            Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("logo.png");
            if (stream == null) return null;
            return Image.FromStream(stream);
        }
    }

    public class KuroForm : Form
    {
        private const int WM_SETREDRAW = 0x000B;

        protected Panel content;
        protected Panel footer;
        protected string windowCaption = "Установка KuroLauncher";
        private bool dragging;
        private Point dragStart;
        private Image logo;
        private bool buildingPage;

        [DllImport("user32.dll")]
        private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

        public KuroForm()
        {
            AutoScaleMode = AutoScaleMode.None;
            ClientSize = new Size(980, 580);
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.None;
            BackColor = KuroTheme.Bg;
            DoubleBuffered = true;
            Font = KuroTheme.BodyFont;
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint, true);

            logo = KuroTheme.LoadLogo();

            content = new Panel();
            content.SetBounds(0, 52, ClientSize.Width, ClientSize.Height - 124);
            content.BackColor = Color.Transparent;
            content.Anchor = AnchorStyles.Left | AnchorStyles.Top | AnchorStyles.Right | AnchorStyles.Bottom;
            Controls.Add(content);

            footer = new Panel();
            footer.SetBounds(0, ClientSize.Height - 72, ClientSize.Width, 72);
            footer.BackColor = Color.Transparent;
            footer.Anchor = AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom;
            Controls.Add(footer);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;

            using (LinearGradientBrush bg = new LinearGradientBrush(ClientRectangle, KuroTheme.Bg, KuroTheme.Bg2, 35f))
                g.FillRectangle(bg, ClientRectangle);

            DrawGlow(g, -40, 40, 260, 64);
            DrawGlow(g, 870, 52, 260, 40);
            DrawGlow(g, 330, 500, 220, 28);

            using (Pen grid = new Pen(Color.FromArgb(6, 255, 255, 255)))
            {
                for (int x = 0; x < Width; x += 48) g.DrawLine(grid, x, 52, x, Height - 72);
                for (int y = 52; y < Height - 72; y += 48) g.DrawLine(grid, 0, y, Width, y);
            }

            using (SolidBrush title = new SolidBrush(Color.FromArgb(210, 12, 13, 17)))
                g.FillRectangle(title, 0, 0, Width, 52);
            using (Pen line = new Pen(Color.FromArgb(44, 255, 255, 255)))
            {
                g.DrawLine(line, 0, 52, Width, 52);
                g.DrawLine(line, 0, Height - 72, Width, Height - 72);
            }

            DrawLogoMark(g, 24, 15, 24);
            using (SolidBrush text = new SolidBrush(KuroTheme.Text))
                g.DrawString(windowCaption, KuroTheme.StrongFont, text, 58, 17);
            using (SolidBrush muted = new SolidBrush(KuroTheme.Muted))
            {
                SizeF titleSize = g.MeasureString(windowCaption, KuroTheme.StrongFont);
                g.DrawString("v0.4.0", KuroTheme.SmallFont, muted, 70 + titleSize.Width, 19);
            }

            DrawWindowButton(g, Width - 98, 15, "−");
            DrawWindowButton(g, Width - 54, 15, "×");

            using (Pen border = new Pen(Color.FromArgb(70, 255, 46, 46)))
                g.DrawRectangle(border, 0, 0, Width - 1, Height - 1);
        }

        protected override void OnMouseDown(MouseEventArgs e)
        {
            base.OnMouseDown(e);
            if (e.Y <= 52 && e.X < Width - 110)
            {
                dragging = true;
                dragStart = e.Location;
            }
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            base.OnMouseMove(e);
            if (dragging)
            {
                Location = new Point(Location.X + e.X - dragStart.X, Location.Y + e.Y - dragStart.Y);
            }
        }

        protected override void OnMouseUp(MouseEventArgs e)
        {
            base.OnMouseUp(e);
            dragging = false;
        }

        protected override void OnClick(EventArgs e)
        {
            base.OnClick(e);
            Point p = PointToClient(MousePosition);
            if (p.Y >= 10 && p.Y <= 42)
            {
                if (p.X >= Width - 104 && p.X <= Width - 80) WindowState = FormWindowState.Minimized;
                if (p.X >= Width - 60 && p.X <= Width - 34) Close();
            }
        }

        protected void ClearPage()
        {
            buildingPage = true;
            SuspendPageRedraw(content);
            SuspendPageRedraw(footer);
            content.Visible = false;
            footer.Visible = false;
            content.SuspendLayout();
            footer.SuspendLayout();
            content.Controls.Clear();
            footer.Controls.Clear();
        }

        protected void AnimatePageIn()
        {
            if (!buildingPage) return;

            content.ResumeLayout(false);
            footer.ResumeLayout(false);
            content.Visible = true;
            footer.Visible = true;
            ResumePageRedraw(content);
            ResumePageRedraw(footer);
            buildingPage = false;

            content.Invalidate(true);
            footer.Invalidate(true);
            Invalidate(true);
            Update();
        }

        private void SuspendPageRedraw(Control control)
        {
            if (control.IsHandleCreated)
                SendMessage(control.Handle, WM_SETREDRAW, IntPtr.Zero, IntPtr.Zero);
        }

        private void ResumePageRedraw(Control control)
        {
            if (control.IsHandleCreated)
                SendMessage(control.Handle, WM_SETREDRAW, new IntPtr(1), IntPtr.Zero);
        }

        protected Label Label(string text, int x, int y, int w, int h, Font font, Color color)
        {
            Label label = new Label();
            label.Text = text;
            label.SetBounds(x, y, w, h);
            label.Font = font;
            label.ForeColor = color;
            label.BackColor = Color.Transparent;
            label.AutoEllipsis = false;
            content.Controls.Add(label);
            return label;
        }

        protected Label MultiLabel(string text, int x, int y, int w, int h, Font font, Color color)
        {
            Label label = Label(text, x, y, w, h, font, color);
            label.AutoEllipsis = false;
            return label;
        }

        protected KuroButton FooterButton(string text, int xFromRight, bool primary)
        {
            KuroButton button = new KuroButton();
            button.Text = text;
            button.Primary = primary;
            button.SetBounds(Width - xFromRight, 20, primary ? 150 : 126, 42);
            button.Anchor = AnchorStyles.Right | AnchorStyles.Bottom;
            footer.Controls.Add(button);
            return button;
        }

        protected Panel Card(int x, int y, int w, int h)
        {
            Panel panel = new KuroPanel();
            panel.SetBounds(x, y, w, h);
            content.Controls.Add(panel);
            return panel;
        }

        protected void DrawLogoMark(Graphics g, int x, int y, int size)
        {
            using (GraphicsPath path = KuroTheme.Rounded(new Rectangle(x, y, size, size), Math.Max(5, size / 5)))
            using (LinearGradientBrush brush = new LinearGradientBrush(new Rectangle(x, y, size, size), KuroTheme.Accent, KuroTheme.AccentDark, 45f))
            {
                g.FillPath(brush, path);
            }
            if (logo != null)
            {
                int pad = Math.Max(4, size / 6);
                g.DrawImage(logo, x + pad, y + pad, size - pad * 2, size - pad * 2);
            }
            else
            {
                using (SolidBrush white = new SolidBrush(KuroTheme.Text))
                    g.DrawString("K", new Font("Segoe UI", size / 2, FontStyle.Bold), white, x + size / 4, y + size / 5);
            }
        }

        public static void DrawGlow(Graphics g, int x, int y, int size, int alpha)
        {
            for (int i = size; i > 0; i -= 12)
            {
                int a = Math.Max(0, alpha * i / size / 5);
                using (SolidBrush brush = new SolidBrush(Color.FromArgb(a, KuroTheme.Accent)))
                    g.FillEllipse(brush, x - i / 2, y - i / 2, i, i);
            }
        }

        private void DrawWindowButton(Graphics g, int x, int y, string text)
        {
            using (SolidBrush brush = new SolidBrush(KuroTheme.Muted))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
                g.DrawString(text, KuroTheme.StrongFont, brush, new RectangleF(x, y, 28, 22), sf);
        }
    }

    public class KuroPanel : Panel
    {
        public KuroPanel()
        {
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.SupportsTransparentBackColor, true);
            DoubleBuffered = true;
            BackColor = Color.Transparent;
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            using (GraphicsPath path = KuroTheme.Rounded(new Rectangle(0, 0, Width - 1, Height - 1), 10))
            using (LinearGradientBrush brush = new LinearGradientBrush(ClientRectangle, Color.FromArgb(125, KuroTheme.Panel), Color.FromArgb(78, KuroTheme.Panel2), 22f))
            using (Pen pen = new Pen(KuroTheme.Border))
            {
                g.FillPath(brush, path);
                g.DrawPath(pen, path);
            }
            base.OnPaint(e);
        }
    }

    public class KuroButton : Control
    {
        public bool Primary { get; set; }
        private bool hover;
        private bool down;

        public KuroButton()
        {
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.SupportsTransparentBackColor, true);
            ForeColor = KuroTheme.Text;
            Font = KuroTheme.StrongFont;
            Cursor = Cursors.Hand;
            BackColor = Color.Transparent;
            TabStop = false;
        }

        protected override void OnMouseEnter(EventArgs e)
        {
            hover = true;
            Invalidate();
            base.OnMouseEnter(e);
        }

        protected override void OnMouseLeave(EventArgs e)
        {
            hover = false;
            down = false;
            Invalidate();
            base.OnMouseLeave(e);
        }

        protected override void OnMouseDown(MouseEventArgs e)
        {
            down = true;
            Invalidate();
            base.OnMouseDown(e);
        }

        protected override void OnMouseUp(MouseEventArgs e)
        {
            down = false;
            Invalidate();
            base.OnMouseUp(e);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle rect = new Rectangle(0, 0, Width - 1, Height - 1);
            Color a = Primary ? KuroTheme.Accent : Color.FromArgb(42, 42, 48);
            Color b = Primary ? KuroTheme.AccentDark : Color.FromArgb(28, 28, 34);
            if (hover && Enabled)
            {
                a = Primary ? Color.FromArgb(255, 70, 70) : Color.FromArgb(54, 54, 60);
                b = Primary ? Color.FromArgb(205, 0, 0) : Color.FromArgb(36, 36, 42);
            }
            if (down && Enabled)
            {
                a = Primary ? Color.FromArgb(210, 18, 18) : Color.FromArgb(26, 26, 32);
                b = Primary ? Color.FromArgb(145, 0, 0) : Color.FromArgb(20, 20, 26);
            }
            if (!Enabled)
            {
                a = Color.FromArgb(42, 42, 46);
                b = Color.FromArgb(34, 34, 38);
            }
            using (GraphicsPath path = KuroTheme.Rounded(rect, 7))
            using (LinearGradientBrush brush = new LinearGradientBrush(rect, a, b, 90f))
            using (Pen pen = new Pen(Primary ? Color.FromArgb(160, 255, 110, 110) : KuroTheme.Border))
            {
                g.FillPath(brush, path);
                g.DrawPath(pen, path);
            }
            TextRenderer.DrawText(g, Text, Font, rect, Enabled ? KuroTheme.Text : Color.FromArgb(110, KuroTheme.Text), TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
        }
    }

    public class KuroCheck : Control
    {
        public string RightText { get; set; }
        private bool isChecked;

        public event EventHandler CheckedChanged;

        public bool Checked
        {
            get { return isChecked; }
            set
            {
                if (isChecked == value) return;
                isChecked = value;
                Invalidate();
                if (CheckedChanged != null) CheckedChanged(this, EventArgs.Empty);
            }
        }

        public KuroCheck()
        {
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.SupportsTransparentBackColor, true);
            Height = 30;
            Font = KuroTheme.BodyFont;
            ForeColor = KuroTheme.Text;
            BackColor = Color.Transparent;
            Cursor = Cursors.Hand;
            TabStop = false;
        }

        protected override void OnClick(EventArgs e)
        {
            if (Enabled) Checked = !Checked;
            base.OnClick(e);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle box = new Rectangle(0, 6, 16, 16);
            using (GraphicsPath path = KuroTheme.Rounded(box, 4))
            using (SolidBrush fill = new SolidBrush(Checked ? KuroTheme.Accent : Color.FromArgb(28, 28, 34)))
            using (Pen pen = new Pen(Checked ? KuroTheme.Accent : KuroTheme.Border))
            {
                g.FillPath(fill, path);
                g.DrawPath(pen, path);
            }
            if (Checked)
            {
                using (Pen check = new Pen(Color.White, 2f))
                {
                    g.DrawLine(check, 4, 14, 7, 17);
                    g.DrawLine(check, 7, 17, 12, 9);
                }
            }
            int reserved = string.IsNullOrEmpty(RightText) ? 34 : 190;
            Rectangle textRect = new Rectangle(26, 3, Math.Max(30, Width - reserved), Height - 2);
            TextRenderer.DrawText(g, Text, Font, textRect, Enabled ? KuroTheme.Text : KuroTheme.Muted, TextFormatFlags.VerticalCenter | TextFormatFlags.Left | TextFormatFlags.EndEllipsis);
            if (!string.IsNullOrEmpty(RightText))
            {
                Rectangle rightRect = new Rectangle(Math.Max(0, Width - 168), 3, 164, Height - 2);
                TextRenderer.DrawText(g, RightText, KuroTheme.SmallFont, rightRect, KuroTheme.Muted, TextFormatFlags.VerticalCenter | TextFormatFlags.Right | TextFormatFlags.EndEllipsis);
            }
        }
    }

    public class KuroSelect : Control
    {
        public string[] Items { get; private set; }
        private int selectedIndex;

        public event EventHandler SelectedIndexChanged;

        public int SelectedIndex
        {
            get { return selectedIndex; }
            set
            {
                int next = value;
                if (Items == null || Items.Length == 0) next = -1;
                else next = Math.Max(0, Math.Min(Items.Length - 1, value));
                if (selectedIndex == next) return;
                selectedIndex = next;
                Invalidate();
                if (SelectedIndexChanged != null) SelectedIndexChanged(this, EventArgs.Empty);
            }
        }

        public string SelectedItem
        {
            get
            {
                if (Items == null || selectedIndex < 0 || selectedIndex >= Items.Length) return null;
                return Items[selectedIndex];
            }
        }

        public KuroSelect(string[] items)
        {
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.SupportsTransparentBackColor, true);
            Items = items == null ? new string[0] : items;
            selectedIndex = Items.Length > 0 ? 0 : -1;
            Font = KuroTheme.BodyFont;
            ForeColor = KuroTheme.Text;
            BackColor = Color.Transparent;
            Cursor = Cursors.Hand;
            TabStop = false;
        }

        public void SelectItem(string item)
        {
            if (Items == null) return;
            for (int i = 0; i < Items.Length; i++)
            {
                if (string.Equals(Items[i], item, StringComparison.OrdinalIgnoreCase))
                {
                    SelectedIndex = i;
                    return;
                }
            }
        }

        protected override void OnClick(EventArgs e)
        {
            base.OnClick(e);
            ShowMenu();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle rect = new Rectangle(0, 0, Width - 1, Height - 1);
            using (GraphicsPath path = KuroTheme.Rounded(rect, 7))
            using (SolidBrush fill = new SolidBrush(Color.FromArgb(22, 22, 27)))
            using (Pen pen = new Pen(Color.FromArgb(70, 255, 255, 255)))
            {
                g.FillPath(fill, path);
                g.DrawPath(pen, path);
            }
            Rectangle textRect = new Rectangle(14, 0, Width - 42, Height);
            TextRenderer.DrawText(g, SelectedItem == null ? "" : SelectedItem, Font, textRect, KuroTheme.Text, TextFormatFlags.VerticalCenter | TextFormatFlags.Left | TextFormatFlags.EndEllipsis);
            using (SolidBrush brush = new SolidBrush(KuroTheme.Muted))
            {
                Point[] arrow = new Point[] {
                    new Point(Width - 22, Height / 2 - 2),
                    new Point(Width - 14, Height / 2 - 2),
                    new Point(Width - 18, Height / 2 + 3)
                };
                g.FillPolygon(brush, arrow);
            }
        }

        private void ShowMenu()
        {
            if (Items == null || Items.Length == 0) return;
            ContextMenuStrip menu = new ContextMenuStrip();
            menu.ShowImageMargin = false;
            menu.BackColor = Color.FromArgb(20, 20, 25);
            menu.ForeColor = KuroTheme.Text;
            menu.Font = KuroTheme.BodyFont;
            menu.Padding = new Padding(3);
            menu.RenderMode = ToolStripRenderMode.System;
            for (int i = 0; i < Items.Length; i++)
            {
                ToolStripMenuItem item = new ToolStripMenuItem(Items[i]);
                item.Tag = i;
                item.Checked = i == selectedIndex;
                item.BackColor = Color.FromArgb(20, 20, 25);
                item.ForeColor = KuroTheme.Text;
                menu.Items.Add(item);
            }
            menu.ItemClicked += delegate(object sender, ToolStripItemClickedEventArgs args)
            {
                if (args.ClickedItem != null && args.ClickedItem.Tag != null)
                    SelectedIndex = (int)args.ClickedItem.Tag;
            };
            menu.Show(this, new Point(0, Height + 3));
        }
    }

    public class KuroProgress : Control
    {
        public int Value { get; set; }

        public KuroProgress()
        {
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.SupportsTransparentBackColor, true);
            Height = 10;
            DoubleBuffered = true;
            BackColor = Color.Transparent;
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle rect = new Rectangle(0, 0, Width - 1, Height - 1);
            using (GraphicsPath path = KuroTheme.Rounded(rect, 5))
            using (SolidBrush bg = new SolidBrush(Color.FromArgb(30, 30, 36)))
            using (Pen pen = new Pen(KuroTheme.Border))
            {
                g.FillPath(bg, path);
                g.DrawPath(pen, path);
            }
            int w = Math.Max(4, (Width - 2) * Math.Max(0, Math.Min(100, Value)) / 100);
            using (GraphicsPath path = KuroTheme.Rounded(new Rectangle(1, 1, w, Height - 3), 5))
            using (LinearGradientBrush brush = new LinearGradientBrush(new Rectangle(1, 1, w, Height - 3), KuroTheme.Accent, KuroTheme.AccentDark, 0f))
                g.FillPath(brush, path);
        }
    }

    public class IconOrb : Control
    {
        public string Kind { get; set; }
        private Image logo;

        public IconOrb()
        {
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.SupportsTransparentBackColor, true);
            Width = 128;
            Height = 128;
            DoubleBuffered = true;
            BackColor = Color.Transparent;
            logo = KuroTheme.LoadLogo();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle rect = new Rectangle(4, 4, Width - 8, Height - 8);
            using (GraphicsPath path = KuroTheme.Rounded(rect, Width / 2))
            using (SolidBrush fill = new SolidBrush(Color.FromArgb(44, KuroTheme.Accent)))
            using (Pen pen = new Pen(Color.FromArgb(170, KuroTheme.Accent), 2))
            {
                g.FillPath(fill, path);
                g.DrawPath(pen, path);
            }
            using (Pen pen = new Pen(Color.FromArgb(245, 255, 90, 90), 4))
            {
                pen.StartCap = LineCap.Round;
                pen.EndCap = LineCap.Round;
                if (Kind == "folder")
                {
                    g.DrawLine(pen, 42, 54, 56, 54);
                    g.DrawLine(pen, 56, 54, 64, 62);
                    g.DrawRectangle(pen, 38, 58, 54, 38);
                }
                else if (Kind == "check")
                {
                    g.DrawLine(pen, 42, 69, 58, 85);
                    g.DrawLine(pen, 58, 85, 90, 48);
                }
                else if (Kind == "gear")
                {
                    g.DrawEllipse(pen, 45, 45, 38, 38);
                    g.DrawLine(pen, 64, 28, 64, 42);
                    g.DrawLine(pen, 64, 86, 64, 100);
                    g.DrawLine(pen, 28, 64, 42, 64);
                    g.DrawLine(pen, 86, 64, 100, 64);
                }
                else
                {
                    if (logo != null) g.DrawImage(logo, 39, 39, 50, 50);
                }
            }
        }
    }

    public class StepBadge : Control
    {
        public string Kind { get; set; }
        public string StepText { get; set; }
        public string Caption { get; set; }
        private Image logo;

        public StepBadge()
        {
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.SupportsTransparentBackColor, true);
            DoubleBuffered = true;
            BackColor = Color.Transparent;
            Width = 150;
            Height = 244;
            logo = KuroTheme.LoadLogo();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle card = new Rectangle(0, 0, Width - 1, Height - 1);
            using (GraphicsPath path = KuroTheme.Rounded(card, 12))
            using (LinearGradientBrush fill = new LinearGradientBrush(card, Color.FromArgb(30, 20, 23), Color.FromArgb(12, 13, 17), 90f))
            using (Pen border = new Pen(Color.FromArgb(58, 255, 255, 255)))
            {
                g.FillPath(fill, path);
                g.DrawPath(border, path);
            }

            Rectangle chip = new Rectangle(18, 18, Width - 36, 28);
            using (GraphicsPath path = KuroTheme.Rounded(chip, 7))
            using (SolidBrush fill = new SolidBrush(Color.FromArgb(34, KuroTheme.Accent)))
            using (Pen border = new Pen(Color.FromArgb(115, KuroTheme.Accent)))
            {
                g.FillPath(fill, path);
                g.DrawPath(border, path);
            }
            TextRenderer.DrawText(g, StepText == null ? "" : StepText, KuroTheme.SmallFont, chip, KuroTheme.Text, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);

            Rectangle iconBox = new Rectangle((Width - 82) / 2, 76, 82, 82);
            using (GraphicsPath path = KuroTheme.Rounded(iconBox, 18))
            using (LinearGradientBrush fill = new LinearGradientBrush(iconBox, Color.FromArgb(54, KuroTheme.Accent), Color.FromArgb(18, KuroTheme.AccentDark), 45f))
            using (Pen border = new Pen(Color.FromArgb(140, KuroTheme.Accent)))
            {
                g.FillPath(fill, path);
                g.DrawPath(border, path);
            }
            DrawIcon(g, iconBox);

            Rectangle titleRect = new Rectangle(16, 176, Width - 32, 44);
            TextRenderer.DrawText(g, Caption == null ? "" : Caption, KuroTheme.StrongFont, titleRect, KuroTheme.Text, TextFormatFlags.HorizontalCenter | TextFormatFlags.Top | TextFormatFlags.WordBreak | TextFormatFlags.EndEllipsis);
        }

        private void DrawIcon(Graphics g, Rectangle box)
        {
            using (Pen pen = new Pen(Color.FromArgb(255, 112, 112), 4))
            {
                pen.StartCap = LineCap.Round;
                pen.EndCap = LineCap.Round;
                int cx = box.Left + box.Width / 2;
                int cy = box.Top + box.Height / 2;
                if (Kind == "folder")
                {
                    Rectangle folder = new Rectangle(box.Left + 19, box.Top + 29, 44, 30);
                    g.DrawLine(pen, folder.Left, folder.Top, folder.Left + 16, folder.Top);
                    g.DrawLine(pen, folder.Left + 16, folder.Top, folder.Left + 23, folder.Top + 7);
                    g.DrawRectangle(pen, folder.Left, folder.Top + 7, folder.Width, folder.Height);
                }
                else if (Kind == "check")
                {
                    g.DrawLine(pen, cx - 24, cy, cx - 7, cy + 17);
                    g.DrawLine(pen, cx - 7, cy + 17, cx + 28, cy - 23);
                }
                else if (Kind == "settings")
                {
                    g.DrawEllipse(pen, cx - 14, cy - 14, 28, 28);
                    g.DrawLine(pen, cx, cy - 32, cx, cy - 22);
                    g.DrawLine(pen, cx, cy + 22, cx, cy + 32);
                    g.DrawLine(pen, cx - 32, cy, cx - 22, cy);
                    g.DrawLine(pen, cx + 22, cy, cx + 32, cy);
                }
                else if (Kind == "install")
                {
                    if (logo != null) g.DrawImage(logo, box.Left + 23, box.Top + 23, 36, 36);
                    else TextRenderer.DrawText(g, "K", KuroTheme.H2Font, box, KuroTheme.Text, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
                }
                else
                {
                    if (logo != null) g.DrawImage(logo, box.Left + 18, box.Top + 18, 46, 46);
                }
            }
        }
    }

    public static class KuroShell
    {
        public static void CreateShortcut(string linkPath, string target, string workingDir)
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(linkPath));
                Type type = Type.GetTypeFromProgID("WScript.Shell");
                object shell = Activator.CreateInstance(type);
                object shortcut = type.InvokeMember("CreateShortcut", System.Reflection.BindingFlags.InvokeMethod, null, shell, new object[] { linkPath });
                Type shortcutType = shortcut.GetType();
                shortcutType.InvokeMember("TargetPath", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { target });
                shortcutType.InvokeMember("WorkingDirectory", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { workingDir });
                shortcutType.InvokeMember("IconLocation", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { target + ",0" });
                shortcutType.InvokeMember("Save", System.Reflection.BindingFlags.InvokeMethod, null, shortcut, null);
                Marshal.FinalReleaseComObject(shortcut);
                Marshal.FinalReleaseComObject(shell);
            }
            catch { }
        }

        public static void TryDelete(string path)
        {
            try
            {
                if (File.Exists(path)) File.Delete(path);
            }
            catch { }
        }
    }
}
