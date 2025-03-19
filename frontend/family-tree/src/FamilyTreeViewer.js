import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import "./FamilyTreeViewer.css";
import {
  createPerson,
  saveOrUpdateNode,
  addChild,
  addSpouse,
  deletePerson,
} from "./nodeService";
import { transformTree } from "./treeUtils";
import { initializeChart, configureCard } from "./chartUtils";

const FamilyTreeViewer = ({ tree, onTreeUpdate }) => {
  const containerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const cardInstanceRef = useRef(null);
  const editTreeInstanceRef = useRef(null);
  const originalTreeRef = useRef([]);
  const [error, setError] = useState(null);

  const transformedTree = useMemo(() => {
    const transformed = transformTree(tree);
    console.log("Transformed Tree Data:", transformed);
    return transformed;
  }, [tree]);

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

      console.log("EditTreeInstance initialized:", editTreeInstance);

      editTreeInstance.setFields([
        {
          type: "switch",
          label: "Gender",
          id: "gender",
          options: ["M", "F"],
        },
        { type: "text", label: "First Name", id: "firstName", required: true },
        { type: "text", label: "Last Name", id: "lastName" },
        { type: "text", label: "Occupation", id: "occupation" },
        { type: "number", label: "Age", id: "age" },
        { type: "date", label: "Birth Date", id: "birthDate" },
        { type: "date", label: "Death Date", id: "deathDate" },
        { type: "text", label: "Birth Place", id: "birthPlace" },
        { type: "text", label: "Death Place", id: "deathPlace" },
        { type: "checkbox", label: "Has Sub Tree", id: "hasSubTree" },
      ]);

      const originalAddRelative =
        editTreeInstance.addRelative.bind(editTreeInstance);
      editTreeInstance.addRelative = (datum) => {
        console.log("=== Add Relative Initiated ===");
        console.log(
          "Datum passed to addRelative:",
          JSON.stringify(datum, null, 2)
        );
        console.log("Current AddRelativeInstance state:", {
          is_active: editTreeInstance.addRelativeInstance.is_active,
          datum: editTreeInstance.addRelativeInstance.datum,
          store_data_length:
            editTreeInstance.addRelativeInstance.store_data?.length || "N/A",
        });

        if (editTreeInstance.isAddingRelative()) {
          console.log("AddRelative is active, cancelling previous action...");
          const addRelativeInstance = editTreeInstance.addRelativeInstance;
          if (addRelativeInstance) {
            if (typeof addRelativeInstance.onCancel === "function") {
              console.log("Calling onCancel to reset AddRelative...");
              addRelativeInstance.onCancel();
              console.log("After onCancel - AddRelativeInstance state:", {
                is_active: addRelativeInstance.is_active,
                datum: addRelativeInstance.datum,
                store_data_length:
                  addRelativeInstance.store_data?.length || "N/A",
              });
            } else {
              console.warn(
                "onCancel is not a function, performing manual reset..."
              );
              addRelativeInstance.is_active = false;
              addRelativeInstance.store_data = null;
              addRelativeInstance.datum = null;
              addRelativeInstance.onChange = null;
              addRelativeInstance.onCancel = null;
              editTreeInstance.store.updateTree({});
              console.log("After manual reset - AddRelativeInstance state:", {
                is_active: addRelativeInstance.is_active,
                datum: addRelativeInstance.datum,
                store_data_length:
                  addRelativeInstance.store_data?.length || "N/A",
              });
            }
          }
        } else {
          console.log("No active AddRelative action, proceeding directly...");
        }

        console.log(
          "Calling original addRelative with datum:",
          JSON.stringify(datum, null, 2)
        );
        originalAddRelative(datum);
        console.log("After addRelative - AddRelativeInstance state:", {
          is_active: editTreeInstance.addRelativeInstance.is_active,
          datum: editTreeInstance.addRelativeInstance.datum,
          store_data_length:
            editTreeInstance.addRelativeInstance.store_data?.length || "N/A",
        });
        console.log("=== Add Relative Setup Complete ===");
      };

      editTreeInstance.setCardClickOpen(cardInstance);
      console.log("setCardClickOpen called");
      editTreeInstance.fixed();

      if (transformedTree.length > 0) {
        editTreeInstance.openFormWithId(transformedTree[0].id);
      }

      editTreeInstance.setOnChange(async () => {
        try {
          const updatedData = JSON.parse(editTreeInstance.getDataJson());
          console.log("Updated Data from setOnChange:", updatedData);

          const updatedTree = updatedData.map((node) => {
            const name =
              [node.data.firstName, node.data.lastName]
                .filter(Boolean)
                .join(" ") || "Unnamed";

            return {
              id: node.id,
              gender:
                node.data.gender === "M"
                  ? "MALE"
                  : node.data.gender === "F"
                  ? "FEMALE"
                  : node.data.gender,
              name,
              occupation: node.data.occupation || null,
              age: node.data.age || null,
              birthDate: node.data.birthDate || null,
              deathDate: node.data.deathDate || null,
              birthPlace: node.data.birthPlace || null,
              deathPlace: node.data.deathPlace || null,
              hasSubTree: node.data.hasSubTree || false,
              fatherId: node.rels.father || null,
              motherId: node.rels.mother || null,
              spouses: node.rels.spouses || [],
              children: node.rels.children || [],
            };
          });

          const originalIds = new Set(
            originalTreeRef.current.map((node) => node.id)
          );
          const updatedIds = new Set(updatedTree.map((node) => node.id));
          const newNodes = updatedTree.filter((node) =>
            node.id.startsWith("f3-")
          );
          const deletedNodes = originalTreeRef.current.filter(
            (node) => !updatedIds.has(node.id)
          );
          const updatedNodes = updatedTree.filter(
            (node) =>
              !node.id.startsWith("f3-") &&
              originalIds.has(node.id) &&
              JSON.stringify(
                originalTreeRef.current.find((n) => n.id === node.id)
              ) !== JSON.stringify(node)
          );

          const idMapping = new Map();
          for (const newNode of newNodes) {
            const nodeData = {
              gender: newNode.gender,
              name: newNode.name,
              occupation: newNode.occupation,
              age: newNode.age,
              birthDate: newNode.birthDate,
              deathDate: newNode.deathDate,
              birthPlace: newNode.birthPlace,
              deathPlace: newNode.deathPlace,
              hasSubTree: newNode.hasSubTree,
              fatherId: newNode.fatherId,
              motherId: newNode.motherId,
              spouseId: newNode.spouses.length > 0 ? newNode.spouses[0] : null,
              childrenIds: newNode.children,
            };
            const createdNode = await createPerson(nodeData);
            idMapping.set(newNode.id, createdNode.id.toString());
          }

          for (const newNode of newNodes) {
            const newId = idMapping.get(newNode.id);
            for (const childId of newNode.children) {
              const resolvedChildId = idMapping.get(childId) || childId;
              await addChild(newId, { id: resolvedChildId });
            }
            for (const spouseId of newNode.spouses) {
              const resolvedSpouseId = idMapping.get(spouseId) || spouseId;
              await addSpouse(newId, { id: resolvedSpouseId });
            }
          }

          for (const updatedNode of updatedNodes) {
            const nodeData = {
              id: updatedNode.id,
              gender: updatedNode.gender,
              name: updatedNode.name,
              occupation: updatedNode.occupation,
              age: updatedNode.age,
              birthDate: updatedNode.birthDate,
              deathDate: updatedNode.deathDate,
              birthPlace: updatedNode.birthPlace,
              deathPlace: updatedNode.deathPlace,
              hasSubTree: updatedNode.hasSubTree,
              fatherId: updatedNode.fatherId,
              motherId: updatedNode.motherId,
              spouseId:
                updatedNode.spouses.length > 0 ? updatedNode.spouses[0] : null,
              childrenIds: updatedNode.children,
            };
            await saveOrUpdateNode(nodeData, updatedNode.id);
          }

          for (const deletedNode of deletedNodes) {
            await deletePerson(deletedNode.id);
          }

          const finalTree = updatedTree.map((node) => {
            const resolvedId = idMapping.get(node.id) || node.id;
            const sanitizeRel = (rel) =>
              rel && typeof rel === "string" ? rel : null;
            const sanitizeRelArray = (rels) =>
              Array.isArray(rels)
                ? rels.filter((id) => typeof id === "string")
                : [];

            return {
              id: resolvedId,
              data: {
                gender:
                  node.gender === "MALE"
                    ? "M"
                    : node.gender === "FEMALE"
                    ? "F"
                    : node.gender,
                name: node.name,
                firstName: node.name.split(" ")[0] || "",
                lastName: node.name.split(" ").slice(1).join(" ") || "",
                occupation: node.occupation,
                age: node.age,
                birthDate: node.birthDate,
                deathDate: node.deathDate,
                birthPlace: node.birthPlace,
                deathPlace: node.deathPlace,
                hasSubTree: node.hasSubTree,
              },
              rels: {
                father: sanitizeRel(node.fatherId),
                mother: sanitizeRel(node.motherId),
                spouses: sanitizeRelArray(node.spouses),
                children: sanitizeRelArray(node.children),
              },
            };
          });

          chartInstance.updateData(finalTree);

          if (
            JSON.stringify(originalTreeRef.current) !==
            JSON.stringify(updatedTree)
          ) {
            originalTreeRef.current = updatedTree;
          }
          memoizedOnTreeUpdate(updatedTree);
          setError(null);
        } catch (error) {
          console.error("Error during tree update:", error);
          setError("Failed to update the tree. Please try again.");
          throw error;
        }
      });

      chartInstance
        .setCardXSpacing(250)
        .setCardYSpacing(150)
        .setOrientationHorizontal()
        .setSingleParentEmptyCard(false)
        .setTransitionTime(0);

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

      originalTreeRef.current = transformedTree;

      return () => {
        console.log("Cleaning up FamilyTreeViewer...");
        if (
          editTreeInstanceRef.current &&
          typeof editTreeInstanceRef.current.destroy === "function"
        ) {
          try {
            if (editTreeInstanceRef.current.isAddingRelative()) {
              console.log(
                "AddRelative is active during cleanup, cancelling..."
              );
              const addRelativeInstance =
                editTreeInstanceRef.current.addRelativeInstance;
              if (
                addRelativeInstance &&
                typeof addRelativeInstance.onCancel === "function"
              ) {
                addRelativeInstance.onCancel();
              } else {
                console.warn(
                  "onCancel is not a function during cleanup, performing manual reset..."
                );
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
            console.log("EditTreeInstance destroyed.");
          } catch (error) {
            console.error("Error destroying editTreeInstance:", error);
          }
        }
        if (chartInstance && typeof chartInstance.destroy === "function") {
          chartInstance.destroy();
          console.log("ChartInstance destroyed.");
        }
        d3.select(currentContainer).selectAll("*").remove();
        console.log("Container cleared.");
      };
    } catch (error) {
      console.error("Error rendering FamilyChart:", error);
      setError("Failed to render the family tree.");
    }
  }, [transformedTree, memoizedOnTreeUpdate]);

  if (!transformedTree || transformedTree.length === 0) {
    return <div>No family tree data available.</div>;
  }

  return (
    <div
      className="family-tree-container"
      style={{ width: "100%", minHeight: "100vh", position: "relative" }}
    >
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}
      <div ref={containerRef} id="FamilyChart"></div>
    </div>
  );
};

FamilyTreeViewer.propTypes = {
  tree: PropTypes.array.isRequired,
  onTreeUpdate: PropTypes.func.isRequired,
};

export default FamilyTreeViewer;
