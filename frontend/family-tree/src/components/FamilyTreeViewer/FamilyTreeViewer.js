// React and Libraries
import React, { useEffect, useRef, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";

// Local Styles and Utilities
import "./FamilyTreeViewer.css";
import { transformTree } from "../../utils/treeUtils";
import { initializeChart, configureCard } from "../../utils/chartUtils";
import { showNotification } from "../../utils/notificationUtils";
import { logDebug } from "../../utils/debugUtils";
import { RELATIONSHIP_TYPES, ADD_REL_LABELS } from "../../constants/constants";
import {
  configureEditTreeForm,
  configureAddRelative,
  configureEditTree,
} from "../../utils/editTreeUtils";
import { handleTreeUpdate } from "../../utils/treeUpdateUtils";

const FamilyTreeViewer = ({ tree, onTreeUpdate, isAdmin }) => {
  const containerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const cardInstanceRef = useRef(null);
  const editTreeInstanceRef = useRef(null);
  const originalTreeRef = useRef([]);

  const transformedTree = useMemo(() => {
    const transformed = transformTree(tree);
    // logDebug("Transformed Tree Data:", transformed);
    return transformed;
  }, [tree]);

  // Memoize the onTreeUpdate callback to prevent unnecessary re-renders
  const memoizedOnTreeUpdate = useCallback(
    (updatedTree) => {
      onTreeUpdate(updatedTree);
    },
    [onTreeUpdate]
  );

  useEffect(() => {
    if (!transformedTree.length) {
      console.log("No transformed tree data available, skipping render.");
      return;
    }

    const currentContainer =
      document.getElementById("FamilyChart") || containerRef.current;
    if (!currentContainer) {
      console.error("FamilyChart container not found");
      return;
    }

    let chartInstance, cardInstance;

    try {
      ({ chartInstance, cardInstance } = initializeChart(
        currentContainer,
        transformedTree,
        chartInstanceRef,
        cardInstanceRef
      ));

      configureCard(cardInstance);

      const editTreeInstance = chartInstance.editTree();
      editTreeInstanceRef.current = editTreeInstance;

      // console.log("EditTreeInstance initialized:", editTreeInstance);

      // Configure editTreeInstance
      configureEditTreeForm(editTreeInstance);
      configureAddRelative(editTreeInstance, isAdmin, RELATIONSHIP_TYPES);
      configureEditTree(
        editTreeInstance,
        cardInstance,
        transformedTree,
        ADD_REL_LABELS
      );

      editTreeInstance.setOnChange(() =>
        handleTreeUpdate({
          editTreeInstance,
          isAdmin,
          chartInstance,
          originalTreeRef,
          memoizedOnTreeUpdate,
        })
      );

      chartInstance
        .setCardXSpacing(250)
        .setCardYSpacing(150)
        .setOrientationHorizontal()
        .setSingleParentEmptyCard(false);

      chartInstance.updateTree({ initial: true });

      const svg = d3.select(currentContainer).select("svg.main_svg");
      if (svg.empty()) {
        console.error("SVG not found after initial render");
        return;
      }

      svg
        .selectAll("path.link")
        .style("stroke", "white")
        .style("stroke-width", 2)
        .style("opacity", 1)
        .style("display", "block");

      const cardElements = svg.selectAll("g.card");
      cardElements.each(function () {
        d3.select(this).style("pointer-events", "all");
      });

      chartInstance.updateTree({ initial: false });

      if (!originalTreeRef.current || originalTreeRef.current.length === 0) {
        originalTreeRef.current = transformedTree.map((node) => {
          const name =
            [node.data.firstName, node.data.lastName]
              .filter(Boolean)
              .join(" ") || "Unnamed";
          return {
            id: node.id,
            gender: node.data.gender || null,
            name,
            occupation: node.data.occupation || null,
            age: node.data.age || null,
            birthDate: node.data.birthDate || null,
            deathDate: node.data.deathDate || null,
            birthPlace: node.data.birthPlace || null,
            deathPlace: node.data.deathPlace || null,
            hasSubTree: node.data.hasSubTree || false,
            avatar: node.data.avatar || null,
            fatherId: node.rels.father || null,
            motherId: node.rels.mother || null,
            spouses: node.rels.spouses || [],
            children: node.rels.children || [],
          };
        });
      }

      return () => {
        if (
          editTreeInstanceRef.current &&
          typeof editTreeInstanceRef.current.destroy === "function"
        ) {
          try {
            if (editTreeInstanceRef.current.isAddingRelative()) {
              const addRelativeInstance =
                editTreeInstanceRef.current.addRelativeInstance;
              if (
                addRelativeInstance &&
                typeof addRelativeInstance.onCancel === "function"
              ) {
                addRelativeInstance.onCancel();
              } else {
                if (addRelativeInstance) {
                  addRelativeInstance.is_active = false;
                  addRelativeInstance.store_data = null;
                  addRelativeInstance.datum = null;
                  addRelativeInstance.onChange = null;
                  addRelativeInstance.onCancel = null;
                  editTreeInstanceRef.current.store.updateTree({});
                }
              }
            }
            editTreeInstanceRef.current.destroy();
          } catch (error) {
            console.error("Error destroying editTreeInstance:", error);
          }
        }
        if (chartInstance && typeof chartInstance.destroy === "function") {
          chartInstance.destroy();
        }
        d3.select(currentContainer).selectAll("*").remove();
      };
    } catch (error) {
      console.error("Error rendering FamilyChart:", error);
      showNotification(
        `Error rendering FamilyChart: ${error.message}`,
        "error"
      );
    }
  }, [transformedTree, memoizedOnTreeUpdate, isAdmin]);

  if (!transformedTree || transformedTree.length === 0) {
    return <div>No family tree data available.</div>;
  }

  return (
    <div
      className="family-tree-container"
      style={{ width: "100%", minHeight: "100vh", position: "relative" }}
    >
      <div ref={containerRef} id="FamilyChart"></div>
    </div>
  );
};

FamilyTreeViewer.propTypes = {
  tree: PropTypes.array.isRequired,
  onTreeUpdate: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
};

export default FamilyTreeViewer;
