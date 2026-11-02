// Runs before hydration to avoid a light->dark flash: reads the stored
// preference (or falls back to the OS setting) and sets the `dark` class
// on <html> synchronously.
const THEME_SCRIPT = `(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
