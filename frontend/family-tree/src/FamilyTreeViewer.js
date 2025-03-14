import React, { useEffect, useRef } from "react";
import f3 from "family-chart/dist/family-chart.esm.js";
import * as d3 from "d3";
import "./FamilyTreeViewer.css";

const FamilyTreeViewer = ({ tree, onNodeClick }) => {
  const containerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const cardInstanceRef = useRef(null);

  const transformedTree = tree.map((node) => {
    const id = String(
      node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
    const allIds = new Set(
      tree.map((n) =>
        String(
          n.id ||
            `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        )
      )
    );
    const rels = {
      parents: (node.parents || [])
        .filter((id) => allIds.has(String(id)))
        .map(String),
      spouses: (node.spouses || [])
        .filter((id) => allIds.has(String(id)))
        .map(String),
      children: (node.children || [])
        .filter((id) => allIds.has(String(id)))
        .map(String),
    };

    rels.spouses = rels.spouses.filter(
      (spouseId) => !rels.children.includes(spouseId)
    );
    rels.children = rels.children.filter(
      (childId) => !rels.spouses.includes(childId)
    );

    let father = null;
    let mother = null;
    if (rels.parents && rels.parents.length > 0) {
      rels.parents.forEach((parentId) => {
        const parent = tree.find((n) => String(n.id) === parentId);
        if (parent) {
          if (parent.gender?.toLowerCase() === "male") father = parentId;
          else if (parent.gender?.toLowerCase() === "female") mother = parentId;
        }
      });
    }

    const nodeData =
      node.data && node.data.data ? node.data.data : node.data || {};

    return {
      id,
      data: {
        gender: (node.gender ?? "unknown").toLowerCase(),
        ...(node.name ? { "first name": node.name, "last name": "" } : {}),
        ...nodeData,
      },
      rels: {
        father,
        mother,
        spouses: rels.spouses,
        children: rels.children,
      },
    };
  });

  console.log(
    "Transformed tree with IDs:",
    transformedTree.map((n) => n.id)
  );
  console.log(
    "Transformed tree relationships:",
    transformedTree.map((node) => ({ id: node.id, rels: node.rels }))
  );
  const uniqueIds = new Set(transformedTree.map((n) => n.id));
  console.log(
    "Unique IDs count:",
    uniqueIds.size,
    "vs Total nodes:",
    transformedTree.length
  );
  if (uniqueIds.size !== transformedTree.length) {
    console.warn("Duplicate IDs detected in transformedTree!");
  }

  useEffect(() => {
    console.log("Original tree prop:", tree);
    console.log("Transformed tree:", transformedTree);

    if (!containerRef.current || !transformedTree.length) return;

    const currentContainer = containerRef.current;
    let chartInstance = chartInstanceRef.current;
    let cardInstance = cardInstanceRef.current;

    try {
      d3.select(currentContainer).selectAll("*").remove();

      const containerStyle = window.getComputedStyle(currentContainer);
      const width = parseInt(containerStyle.width, 10) || 1200;
      const height = parseInt(containerStyle.height, 10) || 800;
      currentContainer.style.width = `${width}px`;
      currentContainer.style.height = `${height}px`;

      chartInstance = f3.createChart(currentContainer, transformedTree);
      chartInstanceRef.current = chartInstance;

      const svg = d3.select(currentContainer).select("svg.main_svg");
      if (svg.empty()) {
        throw new Error("SVG not created by createChart");
      }
      console.log("SVG created:", svg.node());

      if (!svg.node().__zoomObj) {
        console.warn(
          "Zoom behavior not initialized by createChart, attempting manual setup"
        );
        const zoom = d3.zoom().on("zoom", (e) => {
          svg.select(".view").attr("transform", e.transform);
        });
        svg.call(zoom);
        svg.node().__zoomObj = zoom;
      }

      cardInstance = chartInstance.setCard(f3.CardSvg);
      cardInstanceRef.current = cardInstance;

      cardInstance.setCardDim({
        w: 220,
        h: 70,
        img_w: 60,
        img_h: 60,
        img_x: 5,
        img_y: 5,
      });
      cardInstance.setCardDisplay((d) => {
        const displayData = d.data;
        return `${displayData["first name"] || ""} ${
          displayData["last name"] || ""
        }`.trim();
      });

      cardInstance.setOnCardClick((e, d) => {
        console.log("Card clicked, raw data:", d);
        if (d && d.data && !d.data.added) {
          const nodeId = d.id || (d.data && d.data.id);
          console.log("Card clicked, ID:", nodeId);
          if (onNodeClick && nodeId) {
            const node = transformedTree.find((n) => n.id === nodeId);
            if (node) {
              console.log("Found node in transformedTree:", node);
              onNodeClick(node);
            } else {
              console.warn("Node not found in transformedTree for ID:", nodeId);
            }
          }
        } else {
          console.log("Clicked placeholder node, ignoring:", d);
        }
        chartInstance.store.updateMainId(d.id);
        chartInstance.store.updateTree({});
      });

      chartInstance
        .setCardXSpacing(250)
        .setCardYSpacing(150)
        .setOrientationHorizontal()
        .setSingleParentEmptyCard(false)
        .setTransitionTime(0);

      console.log("Rendering tree with data:", transformedTree);
      try {
        chartInstance.updateTree({ initial: true });
      } catch (error) {
        console.error("Error during initial updateTree:", error);
      }

      setTimeout(() => {
        const svg = d3.select(currentContainer).select("svg.main_svg");
        if (svg.empty()) {
          console.error("SVG not found after initial render");
          return;
        }

        svg
          .selectAll("path.link")
          .style("stroke", "black")
          .style("stroke-width", 2)
          .style("opacity", 1)
          .style("display", "block");

        const cardElements = svg.selectAll("g.card");
        console.log("Number of card elements (g.card):", cardElements.size());

        cardElements.each(function (d) {
          const element = d3.select(this);
          element.style("pointer-events", "all");
          element.selectAll("*").style("pointer-events", "all");
          console.log("Card element:", element.node(), "Data:", d);
          console.log("Card pointer-events:", element.style("pointer-events"));
        });

        try {
          chartInstance.updateTree({ initial: false });
        } catch (error) {
          console.error("Error during post-render updateTree:", error);
        }
      }, 1000);

      return () => {
        if (chartInstance && typeof chartInstance.destroy === "function") {
          chartInstance.destroy();
        }
        d3.select(currentContainer).selectAll("*").remove();
      };
    } catch (error) {
      console.error("Error rendering FamilyChart:", error);
    }
  }, [transformedTree, onNodeClick]);

  if (!transformedTree || transformedTree.length === 0) {
    return <div>No family tree data available.</div>;
  }

  return (
    <div
      className="family-tree-container"
      style={{ width: "100%", minHeight: "100vh", position: "relative" }}
    >
      <div ref={containerRef}></div>
    </div>
  );
};

export default FamilyTreeViewer;
