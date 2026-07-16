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
