import * as d3 from "d3";
import f3 from "family-chart";
import {
  CHART_DIMENSIONS,
  FAMILY_CHART_CONTAINER_ID,
} from "../constants/constants";
import { logDebug } from "./debugUtils";

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

export const configureCard = (cardInstance, isAdmin) => {
  try {
    cardInstance.setCardDisplay((d) => {
      if (d.data?._new_rel_data) {
        return d.data._new_rel_data.label || "Add Relative";
      }
      return d.data?.data?.name || "Unnamed";
    });

    cardInstance.cardEditForm = isAdmin;
    cardInstance
      .setCardDim({
        width: 220,
        height: 70,
        text_x: 75,
        text_y: 15,
        img_w: 60,
        img_h: 60,
        img_x: 5,
        img_y: 5,
      })
      .setMiniTree(true)
      .setLinkBreak(false);

    cardInstance.onCardUpdate = function (d) {
      const cardNode = d3.select(this);

      if (d.data?._new_rel_data) {
        const textElement = cardNode.select(".card-inner text");
        if (textElement.empty()) {
          cardNode
            .select(".card-inner")
            .append("text")
            .attr("x", 10)
            .attr("y", 20)
            .attr("fill", "#fff")
            .text(d.data._new_rel_data.label || "Add Relative");
        } else {
          textElement.text(d.data._new_rel_data.label || "Add Relative");
        }
      } else {
        const name = d.data?.data?.name || "Unnamed";
        const textElement = cardNode.select(".card-inner text");
        if (textElement.empty()) {
          console.warn(
            "No text element found inside .card-inner, creating one"
          );
          cardNode
            .select(".card-inner")
            .append("text")
            .attr("x", 10)
            .attr("y", 20)
            .attr("fill", "#fff")
            .text(name);
        } else {
          textElement.text(name);
        }
      }
    };
  } catch (error) {
    console.error("Error configuring card:", error);
    throw error;
  }
};

export const validateChartSetup = (transformedTree, containerRef) => {
  if (!transformedTree.length) {
    logDebug("No transformed tree data available, skipping render.");
    return false;
  }

  const currentContainer =
    document.getElementById(FAMILY_CHART_CONTAINER_ID) || containerRef.current;
  if (!currentContainer) {
    console.error("FamilyChart container not found");
    return false;
  }

  return currentContainer;
};
