import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import f3 from "family-chart/dist/family-chart.esm.js";
import * as d3 from "d3";
import "./FamilyTreeViewer.css";
import {
  createPerson,
  saveOrUpdateNode,
  addChild,
  addSpouse,
  deletePerson,
} from "./nodeService";

const FamilyTreeViewer = ({ tree, onTreeUpdate }) => {
  const containerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const cardInstanceRef = useRef(null);
  const editTreeInstanceRef = useRef(null);
  const originalTreeRef = useRef([]);
  const [error, setError] = useState(null);

  const transformedTree = useMemo(() => {
    return tree.map((node) => {
      if (!node.id) {
        throw new Error(
          `Node is missing an ID: ${JSON.stringify(
            node
          )}. All database nodes must have a valid ID.`
        );
      }

      const id = String(node.id);
      const allIds = new Set(tree.map((n) => String(n.id)));
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

      let father = undefined;
      let mother = undefined;
      if (rels.parents && rels.parents.length > 0) {
        rels.parents.forEach((parentId) => {
          const parent = tree.find((n) => String(n.id) === parentId);
          if (parent) {
            if (parent.gender === "MALE") father = parentId;
            else if (parent.gender === "FEMALE") mother = parentId;
          }
        });
      }

      const genderValue = node.gender ? node.gender.toUpperCase() : "unknown";
      const normalizedGender =
        genderValue === "MALE" || genderValue === "M"
          ? "M"
          : genderValue === "FEMALE" || genderValue === "F"
          ? "F"
          : "unknown";

      return {
        id,
        data: {
          gender: normalizedGender,
          name: node.name || "",
          occupation: node.occupation || "",
          age: node.age || "",
          birthDate: node.birthDate || "",
          deathDate: node.deathDate || "",
          birthPlace: node.birthPlace || "",
          deathPlace: node.deathPlace || "",
          hasSubTree: node.hasSubTree || false,
        },
        rels: {
          father,
          mother,
          spouses: rels.spouses,
          children: rels.children,
        },
      };
    });
  }, [tree]);

  const uniqueIds = new Set(transformedTree.map((n) => n.id));
  if (uniqueIds.size !== transformedTree.length) {
    console.warn("Duplicate IDs detected in transformedTree!");
  }

  const memoizedOnTreeUpdate = useCallback(
    (updatedTree) => {
      onTreeUpdate(updatedTree);
    },
    [onTreeUpdate]
  );

  useEffect(() => {
    if (!transformedTree.length) return;

    const currentContainer = document.getElementById("FamilyChart");
    if (!currentContainer) {
      console.error("FamilyChart container not found");
      return;
    }

    let chartInstance = chartInstanceRef.current;
    let cardInstance = cardInstanceRef.current;

    try {
      d3.select(currentContainer).selectAll("*").remove();

      const width = 1200;
      const height = 900;
      currentContainer.style.width = `${width}px`;
      currentContainer.style.height = `${height}px`;

      chartInstance = f3.createChart(currentContainer, transformedTree);
      chartInstanceRef.current = chartInstance;

      const svg = d3.select(currentContainer).select("svg.main_svg");
      if (svg.empty()) {
        throw new Error("SVG not created by createChart");
      }

      svg.attr("width", width).attr("height", height);

      if (!svg.node().__zoomObj) {
        const zoom = d3.zoom().on("zoom", (e) => {
          svg.select(".view").attr("transform", e.transform);
        });
        svg.call(zoom);
        svg.node().__zoomObj = zoom;
      }

      cardInstance = chartInstance.setCard(f3.CardSvg);
      cardInstanceRef.current = cardInstance;

      cardInstance.setCardDisplay((d) => {
        const name =
          d.data && d.data.data && d.data.data.name
            ? d.data.data.name
            : "Unnamed";
        return name;
      });

      cardInstance.onCardUpdate = function (d) {
        const cardNode = d3.select(this);
        const name =
          d.data && d.data.data && d.data.data.name
            ? d.data.data.name
            : "Unnamed";

        let textElement = cardNode.select(".card-inner text");
        if (textElement.empty()) {
          console.warn(
            "No text element found inside .card-inner, creating one"
          );
          textElement = cardNode
            .select(".card-inner")
            .append("text")
            .attr("x", 10)
            .attr("y", 20)
            .attr("fill", "#fff");
        }
        textElement.text(name);
      };

      cardInstance.setCardDim({
        w: 220,
        h: 70,
        img_w: 60,
        img_h: 60,
        img_x: 5,
        img_y: 5,
      });

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
          editTreeInstance &&
          typeof editTreeInstance.destroy === "function"
        ) {
          try {
            if (editTreeInstance.isAddingRelative()) {
              editTreeInstance.addRelativeInstance.onCancel();
            }
            editTreeInstance.destroy();
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
      throw error;
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
      <div ref={containerRef}></div>
    </div>
  );
};

FamilyTreeViewer.propTypes = {
  tree: PropTypes.array.isRequired,
  onTreeUpdate: PropTypes.func.isRequired,
};

export default FamilyTreeViewer;
