/* One cache-version check shared by every page. */
(async function () {
  try {
    var root = document.documentElement.dataset.siteRoot || "/Shadowrun/";
    var response = await fetch(root + "version.json?_=" + Date.now(), { cache: "no-store" });
    if (!response.ok) return;
    var version = (await response.json()).version;
    if (!version) return;
    var url = new URL(window.location.href);
    if (url.searchParams.get("v") !== version) {
      url.searchParams.set("v", version);
      window.location.replace(url.toString());
    }
  } catch (error) {
    console.warn("Version check skipped:", error);
  }
}());
