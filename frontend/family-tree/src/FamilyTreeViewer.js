import React, { useEffect, useRef } from "react";
import f3 from "family-chart/dist/family-chart.esm.js";
import * as d3 from "d3";
import "./FamilyTreeViewer.css";

const FamilyTreeViewer = ({ tree, onNodeClick }) => {
  const containerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const cardInstanceRef = useRef(null);

  const transformedTree = tree.map((node) => {
    const id =
      node.id ||
      `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const allIds = new Set(
      tree.map(
        (n) =>
          n.id ||
          `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      )
    );
    const rels = {
      parents: (node.parents || []).filter((id) => allIds.has(id)),
      spouses: (node.spouses || []).filter((id) => allIds.has(id)),
      children: (node.children || []).filter((id) => allIds.has(id)),
    };

    const parents = rels.parents || [];
    const father = parents.length > 0 ? parents[0] : null;
    const mother = parents.length > 1 ? parents[1] : null;

    return {
      id,
      data: {
        gender: (node.gender ?? "unknown").toLowerCase(),
        ...(node.name && { "first name": node.name, "last name": "" }),
        ...node.data,
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
      cardInstance
        .setCardDim({ w: 220, h: 70, img_w: 60, img_h: 60, img_x: 5, img_y: 5 })
        .setCardDisplay(
          (d) => `${d.data["first name"]} ${d.data["last name"]}`
        );

      chartInstance
        .setCardXSpacing(250)
        .setCardYSpacing(150)
        .setOrientationHorizontal()
        .setSingleParentEmptyCard(false);

      const treeResult = chartInstance.updateTree({ initial: true });
      console.log("Tree result from updateTree:", treeResult);
      console.log(
        "store.state.tree after updateTree:",
        chartInstance.store.state.tree
      );

      if (
        chartInstance.store.state.tree &&
        chartInstance.store.state.tree.data
      ) {
        chartInstance.store.state.cards =
          chartInstance.store.state.tree.data.filter(
            (card) => card && card.data && card.id
          );
        console.log(
          "store.state.cards after manual assignment:",
          chartInstance.store.state.cards
        );
      } else {
        console.error("store.state.tree.data is undefined after updateTree");
      }

      if (chartInstance.store.state.cards) {
        chartInstance.store.state.cards.forEach((card, index) => {
          console.log(
            `Card ${index} position: x=${card.x}, y=${card.y}, data=`,
            card.data
          );
          if (typeof card.x !== "number" || isNaN(card.x)) card.x = 0;
          if (typeof card.y !== "number" || isNaN(card.y)) card.y = 0;
        });
      } else {
        console.error("store.state.cards is undefined after manual assignment");
      }

      const handleClick = (event) => {
        const nodeElement = event.target.closest(".card");
        if (nodeElement) {
          const nodeId = nodeElement.dataset.id;
          const node = transformedTree.find((n) => n.id === nodeId);
          if (node) onNodeClick(node);
        }
      };
      currentContainer.addEventListener("click", handleClick);

      setTimeout(() => {
        const svg = d3.select(currentContainer).select("svg.main_svg");
        const cardElements = svg.selectAll(".card").filter((d) => d && d.data);
        console.log("Number of valid .card elements:", cardElements.size());
        cardElements.each(function (d) {
          const nodeData = d.data;
          const spouses = nodeData.rels.spouses || [];
          if (spouses.length > 0) {
            const spouseNames = spouses
              .map(
                (spouseId) =>
                  transformedTree.find((n) => n.id === spouseId)?.data[
                    "first name"
                  ]
              )
              .filter(Boolean)
              .join(", ");
            d3.select(this)
              .append("text")
              .attr("class", "spouse-label")
              .attr("dy", "2em")
              .attr("text-anchor", "middle")
              .style("font-size", "12px")
              .style("fill", "gray")
              .text(`(Spouse: ${spouseNames})`);
          }
        });
      }, 0);

      return () => {
        if (chartInstance && typeof chartInstance.destroy === "function") {
          chartInstance.destroy();
        }
        currentContainer.removeEventListener("click", handleClick);
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
