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
          if (parent.gender.toLowerCase() === "male") {
            father = parentId;
          } else if (parent.gender.toLowerCase() === "female") {
            mother = parentId;
          }
        }
      });
    }

    const nodeData =
      node.data && node.data.data ? node.data.data : node.data || {};

    return {
      id,
      data: {
        gender: (node.gender ?? "unknown").toLowerCase(),
        ...(node.name && { "first name": node.name, "last name": "" }),
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
    transformedTree.map((node) => ({
      id: node.id,
      rels: node.rels,
    }))
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
    let chartInstance = null;
    let cardInstance = null;

    try {
      const svg = d3.select(currentContainer).select("svg.main_svg");
      if (svg.empty()) {
        chartInstance = f3.createChart(currentContainer, transformedTree);
      } else {
        svg.remove();
        chartInstance = f3.createChart(currentContainer, transformedTree);
      }
      chartInstanceRef.current = chartInstance;
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
        const displayData = d.data.data || d.data;
        return `${displayData["first name"] || ""} ${
          displayData["last name"] || ""
        }`;
      });

      chartInstance
        .setCardXSpacing(250)
        .setCardYSpacing(150)
        .setOrientationHorizontal()
        .setSingleParentEmptyCard(false)
        .setTransitionTime(0); // Disable animations for immediate rendering

      try {
        const treeResult = chartInstance.updateTree({ initial: true });
        console.log("Tree result from updateTree:", treeResult);
      } catch (error) {
        console.error("Error during initial updateTree:", error);
      }
      console.log(
        "store.state.tree after updateTree:",
        chartInstance.store.state.tree
      );

      chartInstance.updateTree({ initial: false });

      setTimeout(() => {
        try {
          chartInstance.updateTree({ initial: false });
          console.log("Tree re-rendered");
          console.log("store.state.tree:", chartInstance.store.state.tree);

          const svg = d3.select(currentContainer).select("svg.main_svg");
          console.log("SVG element:", svg.node());

          const linksView = svg.select(".links_view");
          console.log("Links view group:", linksView.node());

          svg
            .selectAll("path.link")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .style("opacity", 1)
            .style("display", "block");

          const lineElements = svg.selectAll("path.link");
          console.log("Number of line elements:", lineElements.size());
          lineElements.each(function (d) {
            const element = d3.select(this);
            console.log("Line element:", element.node());
            console.log("Line data:", d);
            console.log("Line path (d attribute):", element.attr("d"));
            console.log("Line style:", element.attr("style"));
          });

          console.log("Tree data relationships:");
          chartInstance.store.state.tree.data.forEach((node) => {
            console.log(`Node ${node.data.id}:`, node.data.rels);
            console.log(
              `Node ${node.data.id} position: x=${node.x}, y=${node.y}`
            );
          });

          svg
            .selectAll("g, path")
            .filter((d) => !(d && d.data))
            .style("pointer-events", "none");

          const cardElements = svg.selectAll("g").filter((d) => d && d.data);
          console.log(
            "Number of potential card elements (g):",
            cardElements.size()
          );

          cardElements.each(function (d) {
            const element = d3.select(this);
            console.log("Card element:", element.node(), "Data:", d);
            console.log("Card classes:", element.attr("class"));
            console.log(
              "Card pointer-events:",
              element.style("pointer-events")
            );
            element.style("opacity", 1);
          });

          cardElements.each(function (d) {
            d3.select(this)
              .style("pointer-events", "all")
              .on("click", (event) => {
                console.log("Click event triggered for card with ID:", d.id);
                console.log("Event details:", event);
                console.log("Card data:", d);
                event.stopPropagation();
                if (d && d.id) {
                  const node = transformedTree.find((n) => n.id === d.id);
                  if (node) {
                    console.log("Found node in transformedTree:", node);
                    onNodeClick(node);
                  } else {
                    console.error(
                      "Node not found in transformedTree for ID:",
                      d.id
                    );
                  }
                } else {
                  console.error("Invalid card data on click:", d);
                }
              });
          });
        } catch (error) {
          console.error("Error during re-render updateTree:", error);
        }
      }, 1000);

      return () => {
        if (chartInstance && typeof chartInstance.destroy === "function") {
          chartInstance.destroy();
        }
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
      style={{ width: "100%", minHeight: "100vh" }}
    >
      <div ref={containerRef}></div>
    </div>
  );
};

export default FamilyTreeViewer;
