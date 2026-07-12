/* Shared, dependency-free behaviours for Shadowrun reference modules. */
(function (global) {
  "use strict";

  function missing(value, fallback) {
    return value == null || value === "" ? (fallback || "—") : value;
  }

  async function fetchJson(url) {
    var response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load " + url + " (HTTP " + response.status + ")");
    return response.json();
  }

  function setText(id, value, fallback) {
    var element = typeof id === "string" ? document.getElementById(id) : id;
    if (element) element.textContent = missing(value, fallback);
  }

  function fillSelect(select, values, allLabel) {
    select.replaceChildren();
    var all = document.createElement("option");
    all.value = "";
    all.textContent = allLabel;
    select.appendChild(all);
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function bindRovingTabs(tabs, activate) {
    tabs.forEach(function (tab, index) {
      tab.addEventListener("keydown", function (event) {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        var next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
          (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next].focus();
        activate(tabs[next]);
      });
    });
  }

  function updateHash(category, record) {
    var hash = "#" + encodeURIComponent(category);
    if (record) hash += "/" + encodeURIComponent(record);
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }

  function readHash() {
    return location.hash.slice(1).split("/").filter(Boolean).map(decodeURIComponent);
  }

  global.ShadowrunReference = {
    fetchJson: fetchJson,
    setText: setText,
    fillSelect: fillSelect,
    bindRovingTabs: bindRovingTabs,
    updateHash: updateHash,
    readHash: readHash
  };
}(window));
