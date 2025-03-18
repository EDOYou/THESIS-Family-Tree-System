import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
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

  const transformedTree = useMemo(() => transformTree(tree), [tree]);

  const memoizedOnTreeUpdate = useCallback(
    (updatedTree) => {
      onTreeUpdate(updatedTree);
    },
    [onTreeUpdate]
  );

  useEffect(() => {
    if (!transformedTree.length) return;

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

      editTreeInstance.setFields([
        {
          type: "switch",
          label: "Gender",
          id: "gender",
          options: ["MALE", "FEMALE"],
        },
        { type: "text", label: "Name", id: "name", required: true },
        { type: "text", label: "Occupation", id: "occupation" },
        { type: "number", label: "Age", id: "age" },
        { type: "date", label: "Birth Date", id: "birthDate" },
        { type: "date", label: "Death Date", id: "deathDate" },
        { type: "text", label: "Birth Place", id: "birthPlace" },
        { type: "text", label: "Death Place", id: "deathPlace" },
        { type: "checkbox", label: "Has Sub Tree", id: "hasSubTree" },
      ]);

      editTreeInstance.setCardClickOpen(cardInstance);
      console.log("setCardClickOpen called");
      editTreeInstance.fixed();

      if (transformedTree.length > 0) {
        editTreeInstance.openFormWithId(transformedTree[0].id);
      }

      editTreeInstance.setOnChange(async () => {
        try {
          const updatedData = JSON.parse(editTreeInstance.getDataJson());

          const updatedTree = updatedData.map((node) => ({
            id: node.id,
            gender:
              node.data.gender === "M"
                ? "MALE"
                : node.data.gender === "F"
                ? "FEMALE"
                : node.data.gender,
            name: node.data.name,
            occupation: node.data.occupation || null,
            age: node.data.age || null,
            birthDate: node.data.birthDate || null,
            deathDate: node.data.deathDate || null,
            birthPlace: node.data.birthPlace || null,
            deathPlace: node.data.deathPlace || null,
            hasSubTree: node.data.hasSubTree || false,
            parents: [
              ...(node.rels.father ? [node.rels.father] : []),
              ...(node.rels.mother ? [node.rels.mother] : []),
            ],
            spouses: node.rels.spouses || [],
            children: node.rels.children || [],
          }));

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
              children: [],
              spouses: [],
              parents: [],
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
            if (newNode.parents.length > 0) {
              for (const parentId of newNode.parents) {
                const resolvedParentId = idMapping.get(parentId) || parentId;
                await addChild(resolvedParentId, { id: newId });
              }
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
              children: updatedNode.children,
              spouses: updatedNode.spouses,
              parents: updatedNode.parents,
            };
            await saveOrUpdateNode(nodeData, updatedNode.id);
          }

          for (const deletedNode of deletedNodes) {
            await deletePerson(deletedNode.id);
          }

          const finalTree = updatedTree.map((node) => {
            const resolvedId = idMapping.get(node.id) || node.id;
            return {
              ...node,
              id: resolvedId,
              parents: node.parents.map((id) => idMapping.get(id) || id),
              spouses: node.spouses.map((id) => idMapping.get(id) || id),
              children: node.children.map((id) => idMapping.get(id) || id),
            };
          });

          if (
            JSON.stringify(originalTreeRef.current) !==
            JSON.stringify(finalTree)
          ) {
            originalTreeRef.current = finalTree;
          }
          memoizedOnTreeUpdate(finalTree);
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
        if (
          editTreeInstanceRef.current &&
          typeof editTreeInstanceRef.current.destroy === "function"
        ) {
          try {
            if (editTreeInstanceRef.current.isAddingRelative()) {
              editTreeInstanceRef.current.addRelativeInstance.onCancel();
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
