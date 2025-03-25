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

const FamilyTreeViewer = ({ tree, onTreeUpdate, isAdmin }) => {
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
          disabled: !isAdmin, // Disable for non-admins
        },
        {
          type: "text",
          label: "First Name",
          id: "firstName",
          required: true,
          disabled: !isAdmin,
        },
        {
          type: "text",
          label: "Last Name",
          id: "lastName",
          disabled: !isAdmin,
        },
        {
          type: "text",
          label: "Occupation",
          id: "occupation",
          disabled: !isAdmin,
        },
        { type: "number", label: "Age", id: "age", disabled: !isAdmin },
        {
          type: "date",
          label: "Birth Date",
          id: "birthDate",
          disabled: !isAdmin,
        },
        {
          type: "date",
          label: "Death Date",
          id: "deathDate",
          disabled: !isAdmin,
        },
        {
          type: "text",
          label: "Birth Place",
          id: "birthPlace",
          disabled: !isAdmin,
        },
        {
          type: "text",
          label: "Death Place",
          id: "deathPlace",
          disabled: !isAdmin,
        },
        {
          type: "checkbox",
          label: "Has Sub Tree",
          id: "hasSubTree",
          disabled: !isAdmin,
        },
      ]);

      const originalAddRelative =
        editTreeInstance.addRelative.bind(editTreeInstance);
      editTreeInstance.addRelative = (datum) => {
        if (!isAdmin) {
          console.log("Add Relative blocked: User is not an admin");
          return;
        }

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
        if (!isAdmin) {
          console.log("Tree update blocked: User is not an admin");
          setError("Only admins can modify the family tree.");
          return;
        }

        try {
          const updatedData = JSON.parse(editTreeInstance.getDataJson());
          console.log(
            "Updated Data from setOnChange:",
            JSON.stringify(updatedData, null, 2)
          );

          const updatedTree = updatedData.map((node) => {
            const name =
              [node.data.firstName, node.data.lastName]
                .filter(Boolean)
                .join(" ") || "Unnamed";

            return {
              id: node.id,
              gender: node.data.gender,
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
              _new_rel_data: node._new_rel_data,
            };
          });

          console.log(
            "Updated Tree (before backend sync):",
            JSON.stringify(updatedTree, null, 2)
          );

          console.log(
            "Original Tree State (originalTreeRef.current):",
            JSON.stringify(originalTreeRef.current, null, 2)
          );

          const transformedOriginalTree = originalTreeRef.current.map(
            (node) => {
              if (node.data && node.rels) {
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
                  fatherId: node.rels.father || null,
                  motherId: node.rels.mother || null,
                  spouses: node.rels.spouses || [],
                  children: node.rels.children || [],
                };
              }
              return node;
            }
          );

          console.log(
            "Transformed Original Tree for comparison:",
            JSON.stringify(transformedOriginalTree, null, 2)
          );

          const originalIds = new Set(
            transformedOriginalTree.map((node) => node.id)
          );
          console.log("Original IDs in transformedOriginalTree:", [
            ...originalIds,
          ]);

          const updatedIds = new Set(updatedTree.map((node) => node.id));
          console.log("Updated IDs in updatedTree:", [...updatedIds]);

          const newNodes = updatedTree.filter(
            (node) => !originalIds.has(node.id)
          );
          console.log("New Nodes:", JSON.stringify(newNodes, null, 2));

          const deletedNodes = transformedOriginalTree.filter(
            (node) => !updatedIds.has(node.id)
          );
          console.log("Deleted Nodes:", JSON.stringify(deletedNodes, null, 2));

          const idMapping = new Map();
          for (const newNode of newNodes) {
            const relType = newNode._new_rel_data?.rel_type;
            const isSpouse = newNode.spouses.length > 0;
            const spouseId = isSpouse ? newNode.spouses[0] : null;
            const spouseNode = spouseId
              ? updatedTree.find((node) => node.id === spouseId)
              : null;

            try {
              if (isSpouse && spouseNode) {
                const spouseData = {
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
                  spouses: newNode.spouses,
                  children: newNode.children,
                };
                console.log(
                  "Adding new spouse with data:",
                  JSON.stringify(spouseData, null, 2)
                );
                const createdSpouse = await addSpouse(spouseId, spouseData);
                console.log(
                  "Created spouse response:",
                  JSON.stringify(createdSpouse, null, 2)
                );
                idMapping.set(newNode.id, createdSpouse.id.toString());

                const spouseNodeInOriginal = transformedOriginalTree.find(
                  (n) => n.id === spouseId
                );
                if (spouseNodeInOriginal) {
                  spouseNodeInOriginal.spouses =
                    spouseNodeInOriginal.spouses || [];
                  if (
                    !spouseNodeInOriginal.spouses.includes(createdSpouse.id)
                  ) {
                    spouseNodeInOriginal.spouses.push(createdSpouse.id);
                  }
                }
                transformedOriginalTree.push({
                  id: createdSpouse.id,
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
                  spouses: newNode.spouses,
                  children: newNode.children,
                });
                continue;
              } else if (
                relType === "child" &&
                (newNode.fatherId || newNode.motherId)
              ) {
                const parentId = newNode.fatherId || newNode.motherId;
                const parentNode = updatedTree.find(
                  (node) => node.id === parentId
                );
                if (parentNode) {
                  const childData = {
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
                    spouses: newNode.spouses,
                    children: newNode.children,
                  };
                  console.log(
                    "Adding new child with data:",
                    JSON.stringify(childData, null, 2)
                  );
                  const createdChild = await addChild(parentId, childData);
                  console.log(
                    "Created child response:",
                    JSON.stringify(createdChild, null, 2)
                  );
                  idMapping.set(newNode.id, createdChild.id.toString());
                  continue;
                }
              }

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
                spouses: newNode.spouses,
                children: newNode.children,
              };
              console.log(
                "Creating new node with data:",
                JSON.stringify(nodeData, null, 2)
              );
              const createdNode = await createPerson(nodeData);
              console.log(
                "Created node response:",
                JSON.stringify(createdNode, null, 2)
              );
              idMapping.set(newNode.id, createdNode.id.toString());
            } catch (error) {
              console.error(
                `Failed to create new node ${newNode.name} (${newNode.id}):`,
                error.response?.data || error.message
              );
              throw error;
            }
          }

          const updatedTreeWithRealIds = updatedTree.map((node) => ({
            ...node,
            id: idMapping.get(node.id) || node.id,
            fatherId: idMapping.get(node.fatherId) || node.fatherId,
            motherId: idMapping.get(node.motherId) || node.motherId,
            spouses: node.spouses.map(
              (spouseId) => idMapping.get(spouseId) || spouseId
            ),
            children: node.children.map(
              (childId) => idMapping.get(childId) || childId
            ),
          }));

          console.log(
            "Updated Tree with Real IDs:",
            JSON.stringify(updatedTreeWithRealIds, null, 2)
          );

          let updatedNodes = [];
          for (const node of updatedTreeWithRealIds) {
            if (!originalIds.has(node.id)) {
              console.log(
                `Node ${node.name} (${node.id}) is a new node, skipping update check.`
              );
              continue;
            }
            const originalNode = transformedOriginalTree.find(
              (n) => n.id === node.id
            );
            const originalSubset = {
              name: originalNode.name ?? null,
              gender: originalNode.gender ?? null,
              occupation: originalNode.occupation ?? null,
              age: originalNode.age ?? null,
              birthDate: originalNode.birthDate ?? null,
              deathDate: originalNode.deathDate ?? null,
              birthPlace: originalNode.birthPlace ?? null,
              deathPlace: originalNode.deathPlace ?? null,
              hasSubTree: originalNode.hasSubTree ?? false,
              fatherId: originalNode.fatherId ?? null,
              motherId: originalNode.motherId ?? null,
              spouses: originalNode.spouses ?? [],
              children: originalNode.children ?? [],
            };
            const updatedSubset = {
              name: node.name ?? null,
              gender: node.gender ?? null,
              occupation: node.occupation ?? null,
              age: node.age ?? null,
              birthDate: node.birthDate ?? null,
              deathDate: node.deathDate ?? null,
              birthPlace: node.birthPlace ?? null,
              deathPlace: node.deathPlace ?? null,
              hasSubTree: node.hasSubTree ?? false,
              fatherId: node.fatherId ?? null,
              motherId: node.motherId ?? null,
              spouses: node.spouses ?? [],
              children: node.children ?? [],
            };
            const isUpdated =
              JSON.stringify(originalSubset) !== JSON.stringify(updatedSubset);
            console.log(`Comparing node ${node.name} (${node.id}):`);
            console.log("Original:", JSON.stringify(originalSubset, null, 2));
            console.log("Updated:", JSON.stringify(updatedSubset, null, 2));
            console.log(
              `Is node ${node.name} (${node.id}) updated? ${isUpdated}`
            );
            if (isUpdated) {
              updatedNodes.push(node);
            }
          }
          console.log("Updated Nodes:", JSON.stringify(updatedNodes, null, 2));

          for (const updatedNode of updatedNodes) {
            const originalNode = transformedOriginalTree.find(
              (n) => n.id === updatedNode.id
            );

            const originalSpouses = originalNode.spouses || [];
            const updatedSpouses = updatedNode.spouses || [];
            const addedSpouses = updatedSpouses.filter(
              (spouseId) => !originalSpouses.includes(spouseId)
            );

            console.log(
              `Processing updated node ${updatedNode.name} (${updatedNode.id}):`,
              JSON.stringify(updatedNode, null, 2)
            );
            console.log(
              `Original spouses for ${updatedNode.name}:`,
              originalSpouses
            );
            console.log(
              `Updated spouses for ${updatedNode.name}:`,
              updatedSpouses
            );
            console.log(`Added spouses for ${updatedNode.name}:`, addedSpouses);

            for (const spouseId of addedSpouses) {
              const spouseNode = updatedTreeWithRealIds.find(
                (node) => node.id === spouseId
              );
              console.log(
                `Processing spouse ${spouseId} for ${updatedNode.name}:`,
                spouseNode ? JSON.stringify(spouseNode, null, 2) : "Not found"
              );
              if (spouseNode) {
                const spouseOriginalNode = transformedOriginalTree.find(
                  (n) => n.id === spouseId
                );
                const spouseOriginalSpouses = spouseOriginalNode?.spouses || [];
                console.log(
                  `Original spouses for spouse ${spouseNode.name} (${spouseId}):`,
                  spouseOriginalSpouses
                );
                if (spouseOriginalSpouses.includes(updatedNode.id)) {
                  console.log(
                    `Skipping linking ${spouseNode.name} to ${updatedNode.name}: already linked in original tree`
                  );
                  continue;
                }

                const spouseData = {
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
                  spouses: updatedNode.spouses,
                  children: updatedNode.children,
                };
                console.log(
                  `Linking ${updatedNode.name} as spouse to ${spouseNode.name}:`,
                  JSON.stringify(spouseData, null, 2)
                );
                try {
                  await addSpouse(spouseId, spouseData);
                  originalNode.spouses = originalNode.spouses || [];
                  if (!originalNode.spouses.includes(spouseId)) {
                    originalNode.spouses.push(spouseId);
                  }
                  const spouseInOriginalUpdated = transformedOriginalTree.find(
                    (n) => n.id === spouseId
                  );
                  if (spouseInOriginalUpdated) {
                    spouseInOriginalUpdated.spouses =
                      spouseInOriginalUpdated.spouses || [];
                    if (
                      !spouseInOriginalUpdated.spouses.includes(updatedNode.id)
                    ) {
                      spouseInOriginalUpdated.spouses.push(updatedNode.id);
                    }
                  }
                } catch (error) {
                  console.error(
                    `Failed to link ${updatedNode.name} to ${spouseNode.name}:`,
                    error.response?.data || error.message
                  );
                  throw error;
                }
              }
            }

            const hasNonRelationshipChanges =
              originalNode &&
              (updatedNode.name !== originalNode.name ||
                updatedNode.gender !== originalNode.gender ||
                updatedNode.occupation !== originalNode.occupation ||
                updatedNode.age !== originalNode.age ||
                updatedNode.birthDate !== originalNode.birthDate ||
                updatedNode.deathDate !== originalNode.deathDate ||
                updatedNode.birthPlace !== originalNode.birthPlace ||
                updatedNode.deathPlace !== originalNode.deathPlace ||
                updatedNode.hasSubTree !== originalNode.hasSubTree ||
                updatedNode.fatherId !== originalNode.fatherId ||
                updatedNode.motherId !== originalNode.motherId);

            console.log(
              `Non-relationship changes for ${updatedNode.name} (${updatedNode.id}):`,
              hasNonRelationshipChanges
            );

            if (hasNonRelationshipChanges) {
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
                spouses: updatedNode.spouses,
                children: updatedNode.children,
              };
              console.log(
                "Saving updated node with data:",
                JSON.stringify(nodeData, null, 2)
              );
              await saveOrUpdateNode(nodeData, updatedNode.id);
            }
          }

          for (const deletedNode of deletedNodes) {
            await deletePerson(deletedNode.id);
          }

          const finalTree = updatedTreeWithRealIds.map((node) => {
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
                gender: node.gender,
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

          console.log(
            "Final Tree after backend sync:",
            JSON.stringify(finalTree, null, 2)
          );

          chartInstance.updateData(finalTree);

          originalTreeRef.current = updatedTreeWithRealIds;
          console.log(
            "Updated originalTreeRef.current after sync:",
            JSON.stringify(originalTreeRef.current, null, 2)
          );

          memoizedOnTreeUpdate();
          setError(null);
        } catch (error) {
          console.error("Error during tree update:", error);
          setError("Failed to update the tree. Please try again.");
          chartInstance.updateData(originalTreeRef.current);
          throw error;
        }
      });

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
            fatherId: node.rels.father || null,
            motherId: node.rels.mother || null,
            spouses: node.rels.spouses || [],
            children: node.rels.children || [],
          };
        });

        console.log(
          "Initialized originalTreeRef.current:",
          JSON.stringify(originalTreeRef.current, null, 2)
        );
      } else {
        console.log(
          "originalTreeRef.current already initialized, skipping re-initialization:",
          JSON.stringify(originalTreeRef.current, null, 2)
        );
      }

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
  }, [transformedTree, memoizedOnTreeUpdate, isAdmin]);

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
      {!isAdmin && (
        <div style={{ color: "orange", marginBottom: "10px" }}>
          You are viewing the family tree in read-only mode. Only admins can
          modify the tree.
        </div>
      )}
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
