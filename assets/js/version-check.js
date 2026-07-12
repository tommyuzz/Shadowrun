/* One cache-version check shared by every page. */
(async function () {
  "use strict";

  var root = document.documentElement.dataset.siteRoot || "/Shadowrun/";
  var documentRoot = document.documentElement;

  try {
    var response = await fetch(
      root + "version.json?_=" + Date.now(),
      { cache: "no-store" }
    );

    if (!response.ok) throw new Error("Version check failed");

    var data = await response.json();
    var version = String(data.version || "");

    if (!version) return;

    var url = new URL(window.location.href);

    if (url.searchParams.get("v") !== version) {
      url.searchParams.set("v", version);
      window.location.replace(url.toString());
      return;
    }
  } catch (error) {
    console.warn("Version check skipped:", error);
  } finally {
    documentRoot.classList.remove("version-check-pending");
  }
}());
