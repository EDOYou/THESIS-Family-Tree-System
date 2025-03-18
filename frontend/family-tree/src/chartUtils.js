import * as d3 from "d3";
import f3 from "family-chart/dist/family-chart.esm.js";
import { CHART_DIMENSIONS, CARD_DIMENSIONS } from "./constants";

export const initializeChart = (
  container,
  transformedTree,
  chartInstanceRef,
  cardInstanceRef
) => {
  try {
    d3.select(container).selectAll("*").remove();
    container.style.width = `${CHART_DIMENSIONS.width}px`;
    container.style.height = `${CHART_DIMENSIONS.height}px`;

    const chartInstance = f3.createChart(container, transformedTree);
    chartInstanceRef.current = chartInstance;

    const svg = d3.select(container).select("svg.main_svg");
    if (svg.empty()) {
      throw new Error("SVG not created by createChart");
    }
    svg
      .attr("width", CHART_DIMENSIONS.width)
      .attr("height", CHART_DIMENSIONS.height);

    if (!svg.node().__zoomObj) {
      const zoom = d3.zoom().on("zoom", (e) => {
        svg.select(".view").attr("transform", e.transform);
      });
      svg.call(zoom);
      svg.node().__zoomObj = zoom;
    }

    const cardInstance = chartInstance.setCard(f3.CardSvg);
    cardInstanceRef.current = cardInstance;

    return { chartInstance, cardInstance };
  } catch (error) {
    console.error("Error initializing chart:", error);
    throw error;
  }
};

export const configureCard = (cardInstance) => {
  try {
    cardInstance.setCardDisplay((d) => d.data?.data?.name || "Unnamed");

    cardInstance.onCardUpdate = function (d) {
      const cardNode = d3.select(this);
      const name = d.data?.data?.name || "Unnamed";

      let textElement = cardNode.select(".card-inner text");
      if (textElement.empty()) {
        console.warn("No text element found inside .card-inner, creating one");
        textElement = cardNode
          .select(".card-inner")
          .append("text")
          .attr("x", 10)
          .attr("y", 20)
          .attr("fill", "#fff");
      }
      textElement.text(name);
    };

    cardInstance.setCardDim(CARD_DIMENSIONS);
  } catch (error) {
    console.error("Error configuring card:", error);
    throw error;
  }
};
