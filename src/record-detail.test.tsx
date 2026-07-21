import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QualityDescription, RecordDetail } from "./components/RecordDetail";
import { loadData } from "./data";

describe("Quality description rendering", () => {
  it("renders authored HTML elements instead of escaping their tags", () => {
    const markup = renderToStaticMarkup(<QualityDescription value={'<p>Apply a <strong>–2 dice pool modifier</strong>.</p><table><thead><tr><th>Severity</th></tr></thead><tbody><tr><td>Mild</td></tr></tbody></table>'}/>);
    expect(markup).toContain("<strong>–2 dice pool modifier</strong>");
    expect(markup).toContain("<table>");
    expect(markup).toContain("<th>Severity</th>");
    expect(markup).not.toContain("&lt;strong&gt;");
    expect(markup).not.toContain("&lt;table&gt;");
  });

  it("retains the established list treatment for legacy bullet-separated text", () => {
    const markup = renderToStaticMarkup(<QualityDescription value="Introductory rule • First condition • Second condition"/>);
    expect(markup).toContain("<p>Introductory rule</p>");
    expect(markup).toContain("<li>First condition</li>");
    expect(markup).toContain("<li>Second condition</li>");
  });
});

describe("Lifestyle record rendering", () => {
  it("renders the dedicated profile, ratings, configuration notes and every credited source", async () => {
    const data = await loadData("lifestyles");
    const street = data.records.find((record) => record.id === "street")!;
    const markup = renderToStaticMarkup(<RecordDetail moduleId="lifestyles" record={street} data={data} recordNumber={1}/>);
    expect(markup).toContain("Lifestyle profile");
    expect(markup).toContain("Category ratings");
    expect(markup.match(/class="lifestyle-rating-card"/g)).toHaveLength(3);
    expect(markup).toContain("Configuration notes");
    expect(markup).toContain("No built-in options are listed.");
    expect(markup).toContain("<strong>Street</strong> represents homelessness");
    expect(markup).toContain(">CRB<");
    expect(markup).toContain(">SRF<");
  });

  it("retains the original dossier, variants and restrictions for the restored tabs", async () => {
    const data = await loadData("lifestyles");
    const garage = data.records.find((record) => record.id === "garage")!;
    const safehouse = data.records.find((record) => record.id === "safehouse")!;
    const garageMarkup = renderToStaticMarkup(<RecordDetail moduleId="lifestyles" record={garage} data={data} recordNumber={1}/>);
    const safehouseMarkup = renderToStaticMarkup(<RecordDetail moduleId="lifestyles" record={safehouse} data={data} recordNumber={1}/>);
    expect(garageMarkup).toContain("class=\"lifestyle-dossier\"");
    expect(garageMarkup).toContain("Entertainment extra");
    expect(garageMarkup).toContain("Available configurations");
    expect(safehouseMarkup).toContain("Lifestyle-wide modifier");
    expect(safehouseMarkup).toContain("Restrictions");
    expect(safehouseMarkup).toContain("cannot purchase Entertainment assets");
  });
});

describe("Actions, weapon support and equipment configuration rendering", () => {
  it("renders action timing, requirements and matching reload methods", async () => {
    const data = await loadData("actions");
    const reload = data.records.find((record) => record.category === "Simple Actions" && record.name === "Reload Weapon")!;
    const markup = renderToStaticMarkup(<RecordDetail moduleId="actions" record={reload} data={data} recordNumber={1}/>);
    expect(markup).toContain("Action economy record");
    expect(markup).toContain("Resolution test");
    expect(markup).toContain("Simple reload methods");
    expect(markup).toContain("Removable Clip");
    expect(markup).not.toContain("Muzzle-Loader");
  });

  it("lists attachment effects and costs from a weapon record", async () => {
    const data = await loadData("weapons");
    const predator = data.records.find((record) => record.id === "ares-predator-v")!;
    const markup = renderToStaticMarkup(<RecordDetail moduleId="weapons" record={predator} data={data} recordNumber={1} openRecord={() => undefined}/>);
    expect(markup).toContain("Available attachments");
    expect(markup).toContain("Laser Sight");
    expect(markup).toContain("125¥");
    expect(markup).toContain("Projects an aiming point");
  });

  it("lists applicable weapons from a support record", async () => {
    const data = await loadData("weapons");
    const laserSight = data.records.find((record) => record.id === "laser-sight")!;
    const markup = renderToStaticMarkup(<RecordDetail moduleId="weapons" record={laserSight} data={data} recordNumber={1} openRecord={() => undefined}/>);
    expect(markup).toContain("Applicable weapons");
    expect(markup).toContain("Ares Predator V");
    expect(markup).toContain("Listed cost");
  });

  it("embeds compatible enhancements in the base equipment record", async () => {
    const data = await loadData("equipment");
    const camera = data.records.find((record) => record.name === "Camera")!;
    const markup = renderToStaticMarkup(<RecordDetail moduleId="equipment" record={camera} data={data} recordNumber={1}/>);
    expect(markup).toContain("Available enhancements");
    expect(markup).toContain("Thermographic Vision (Vision Enhancement)");
    expect(markup).toContain("+500¥");
    expect(markup).toContain("Build Camera");
  });
});

describe("Rule-backed relationship presentation contract", () => {
  it("keeps the weapon, support and equipment relationship markup unchanged", async () => {
    const weaponData = await loadData("weapons");
    const equipmentData = await loadData("equipment");
    const predator = weaponData.records.find((record) => record.id === "ares-predator-v")!;
    const laserSight = weaponData.records.find((record) => record.id === "laser-sight")!;
    const camera = equipmentData.records.find((record) => record.name === "Camera")!;

    const relationshipMarkup = {
      weapon: renderToStaticMarkup(<RecordDetail moduleId="weapons" record={predator} data={weaponData} recordNumber={1} openRecord={() => undefined}/>),
      support: renderToStaticMarkup(<RecordDetail moduleId="weapons" record={laserSight} data={weaponData} recordNumber={1} openRecord={() => undefined}/>),
      equipment: renderToStaticMarkup(<RecordDetail moduleId="equipment" record={camera} data={equipmentData} recordNumber={1}/>)
    };

    expect(relationshipMarkup).toMatchSnapshot();
  });
});
