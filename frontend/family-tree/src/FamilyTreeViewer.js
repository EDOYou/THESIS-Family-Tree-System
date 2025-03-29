import React, { useEffect, useRef, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import "./FamilyTreeViewer.css";
import {
  createPerson,
  saveOrUpdateNode,
  addChild,
  addSpouse,
  deletePerson,
  updateAvatar,
  createMemoryBox,
} from "./nodeService";
import { transformTree } from "./treeUtils";
import { initializeChart, configureCard } from "./chartUtils";
import f3 from "family-chart";

const FamilyTreeViewer = ({ tree, onTreeUpdate, isAdmin }) => {
  const containerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const cardInstanceRef = useRef(null);
  const editTreeInstanceRef = useRef(null);
  const originalTreeRef = useRef([]);

  const transformedTree = useMemo(() => {
    const transformed = transformTree(tree);
    console.log("Transformed Tree Data:", JSON.stringify(transformed, null, 2));
    return transformed;
  }, [tree]);

  const memoizedOnTreeUpdate = useCallback(
    (updatedTree) => {
      onTreeUpdate(updatedTree);
    },
    [onTreeUpdate]
  );

  const showNotification = (message, type) => {
    console.log(`Notification [${type}]: ${message}`);
    alert(`${type.toUpperCase()}: ${message}`);
  };

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

      const viewFields = [
        { type: "text", label: "First Name", id: "firstName" },
        { type: "text", label: "Last Name", id: "lastName" },
        { type: "text", label: "Occupation", id: "occupation" },
        { type: "text", label: "Age", id: "age" },
        { type: "text", label: "Birth Date", id: "birthDate" },
        { type: "text", label: "Death Date", id: "deathDate" },
        { type: "text", label: "Birth Place", id: "birthPlace" },
        { type: "text", label: "Death Place", id: "deathPlace" },
      ];

      const editFields = [
        { type: "text", label: "First Name", id: "firstName" },
        { type: "text", label: "Last Name", id: "lastName" },
        { type: "text", label: "Occupation", id: "occupation" },
        { type: "text", label: "Age", id: "age" },
        { type: "text", label: "Birth Date", id: "birthDate" },
        { type: "text", label: "Death Date", id: "deathDate" },
        { type: "text", label: "Birth Place", id: "birthPlace" },
        { type: "text", label: "Death Place", id: "deathPlace" },
        { type: "text", label: "Has Sub Tree", id: "hasSubTree" },
        { type: "text", label: "Avatar URL", id: "avatar" },
      ];

      const originalOpen = editTreeInstance.open.bind(editTreeInstance);

      editTreeInstance.open = function (datum) {
        if (datum.data.data) datum = datum.data;

        const isEditMode =
          this.editFirst ||
          datum._new_rel_data ||
          d3.select(this.form_cont).classed("edit-mode");

        console.log("Opening form, isEditMode:", isEditMode);

        this.setFields(isEditMode ? editFields : viewFields);
        originalOpen(datum);
      };

      editTreeInstance.setFields(viewFields);
      editTreeInstance.setOnChange(() => {
        const form = d3.select(editTreeInstance.form_cont).select("form");
        if (form.node()) {
          const isEditable = form.classed("editable");
          console.log("Form state changed, isEditable:", isEditable);

          d3.select(editTreeInstance.form_cont).classed(
            "edit-mode",
            isEditable
          );
          editTreeInstance.setFields(isEditable ? editFields : viewFields);
        }
      });

      editTreeInstance.setEditFirst(true);
      editTreeInstance.setAddRelLabels({
        father: "Add Father",
        mother: "Add Mother",
        spouse: "Add Spouse",
        son: "Add Son",
        daughter: "Add Daughter",
      });

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

        if (editTreeInstance.isAddingRelative()) {
          console.log("AddRelative is active, cancelling previous action...");
          const addRelativeInstance = editTreeInstance.addRelativeInstance;
          if (
            addRelativeInstance &&
            typeof addRelativeInstance.onCancel === "function"
          ) {
            addRelativeInstance.onCancel();
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
          }
        }

        const relTypes = ["father", "mother", "spouse", "son", "daughter"];
        const formCreator = f3.handlers.createForm({
          store: editTreeInstance.store,
          datum: { id: "rel-type-selector", data: {} },
          fields: [
            {
              type: "select",
              label: "Relationship Type",
              id: "relType",
              options: relTypes.map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
              })),
              required: true,
            },
          ],
          postSubmit: (e) => {
            const formData = new FormData(e.target);
            const relType = formData.get("relType");
            if (relType) {
              const defaultGender =
                relType === "father" || relType === "son" ? "M" : "F";
              const tempDatum = {
                ...datum,
                data: {
                  ...datum.data,
                  gender: defaultGender,
                },
              };
              editTreeInstance.addRelativeInstance.activate(tempDatum, relType);
            }
          },
          onCancel: () => {
            const formContainer = document.querySelector(".f3-form-cont");
            if (formContainer) {
              d3.select(formContainer).classed("opened", false).html("");
            }
          },
        });

        const formCont = f3.handlers.formInfoSetup(formCreator, () => {
          const formContainer = document.querySelector(".f3-form-cont");
          if (formContainer) {
            d3.select(formContainer).classed("opened", false).html("");
          }
        });

        const formContainer = document.querySelector(".f3-form-cont");
        if (formContainer) {
          formContainer.innerHTML = "";
          formContainer.appendChild(formCont);
          d3.select(formContainer).classed("opened", true);
        }
      };

      editTreeInstance.setCardClickOpen(cardInstance);
      editTreeInstance.fixed();

      if (transformedTree.length > 0) {
        editTreeInstance.openFormWithId(transformedTree[0].id);
      }

      editTreeInstance.setOnChange(async () => {
        if (!isAdmin) {
          console.log("Tree update blocked: User is not an admin");
          chartInstance.updateData(originalTreeRef.current);
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
              avatar: node.data.avatar || null,
              fatherId: node.rels.father || null,
              motherId: node.rels.mother || null,
              spouses: node.rels.spouses || [],
              children: node.rels.children || [],
            };
          });

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
                  avatar: node.data.avatar || null,
                  fatherId: node.rels.father || null,
                  motherId: node.rels.mother || null,
                  spouses: node.rels.spouses || [],
                  children: node.rels.children || [],
                };
              }
              return node;
            }
          );

          const originalIds = new Set(
            transformedOriginalTree.map((node) => node.id)
          );
          const updatedIds = new Set(updatedTree.map((node) => node.id));
          const newNodes = updatedTree.filter(
            (node) => !originalIds.has(node.id)
          );
          const deletedNodes = transformedOriginalTree.filter(
            (node) => !updatedIds.has(node.id)
          );

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
                  avatar: newNode.avatar,
                };
                const createdSpouse = await addSpouse(spouseId, spouseData);
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
                  avatar: newNode.avatar,
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
                    avatar: newNode.avatar,
                  };
                  const createdChild = await addChild(parentId, childData);
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
                avatar: newNode.avatar,
              };
              const createdNode = await createPerson(nodeData);
              idMapping.set(newNode.id, createdNode.id.toString());
            } catch (error) {
              console.error(
                `Failed to create new node ${newNode.name} (${newNode.id}):`,
                error.response?.data || error.message
              );
              showNotification(
                `Failed to create new node ${newNode.name}: ${error.message}`,
                "error"
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

          let updatedNodes = [];
          for (const node of updatedTreeWithRealIds) {
            if (!originalIds.has(node.id)) {
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
              avatar: originalNode.avatar ?? null,
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
              avatar: node.avatar ?? null,
            };
            const isUpdated =
              JSON.stringify(originalSubset) !== JSON.stringify(updatedSubset);
            if (isUpdated) {
              updatedNodes.push(node);
            }
          }

          for (const updatedNode of updatedNodes) {
            const originalNode = transformedOriginalTree.find(
              (n) => n.id === updatedNode.id
            );
            const originalSpouses = originalNode.spouses || [];
            const updatedSpouses = updatedNode.spouses || [];
            const addedSpouses = updatedSpouses.filter(
              (spouseId) => !originalSpouses.includes(spouseId)
            );

            let hasInvalidAvatar = false;
            if (updatedNode.avatar !== originalNode.avatar) {
              console.log(
                `Avatar changed for ${updatedNode.name} (${updatedNode.id}):`,
                `Old: ${originalNode.avatar}, New: ${updatedNode.avatar}`
              );
              if (updatedNode.avatar) {
                const isValidImageUrl = updatedNode.avatar.match(
                  /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif))$/
                );
                if (!isValidImageUrl) {
                  console.error(
                    `Invalid avatar URL for ${updatedNode.name} (${updatedNode.id}):`,
                    updatedNode.avatar
                  );
                  showNotification(
                    "Invalid avatar URL. Please provide a direct link to an image (e.g., https://example.com/image.jpg).",
                    "error"
                  );
                  hasInvalidAvatar = true;
                } else {
                  try {
                    await updateAvatar(updatedNode.id, updatedNode.avatar);
                    console.log(
                      `Successfully updated avatar for ${updatedNode.name} (${updatedNode.id})`
                    );
                  } catch (error) {
                    if (error.message.includes("MemoryBox not found")) {
                      try {
                        const memoryBoxData = { avatar: updatedNode.avatar };
                        await createMemoryBox(updatedNode.id, memoryBoxData);
                        console.log(
                          `Created new MemoryBox and set avatar for ${updatedNode.name} (${updatedNode.id})`
                        );
                        showNotification(
                          `Created a new MemoryBox and updated avatar for ${updatedNode.name}.`,
                          "success"
                        );
                      } catch (createError) {
                        console.error(
                          `Failed to create MemoryBox for ${updatedNode.name} (${updatedNode.id}):`,
                          createError
                        );
                        showNotification(
                          `Failed to create MemoryBox for ${updatedNode.name}: ${createError.message}`,
                          "error"
                        );
                        hasInvalidAvatar = true;
                      }
                    } else {
                      console.error(
                        `Failed to update avatar for ${updatedNode.name} (${updatedNode.id}):`,
                        error
                      );
                      showNotification(
                        `Failed to update avatar for ${updatedNode.name}: ${error.message}`,
                        "error"
                      );
                      hasInvalidAvatar = true;
                    }
                  }
                }
              }
            }

            for (const spouseId of addedSpouses) {
              const spouseNode = updatedTreeWithRealIds.find(
                (node) => node.id === spouseId
              );
              if (spouseNode) {
                const spouseOriginalNode = transformedOriginalTree.find(
                  (n) => n.id === spouseId
                );
                const spouseOriginalSpouses = spouseOriginalNode?.spouses || [];
                if (spouseOriginalSpouses.includes(updatedNode.id)) {
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
                  avatar: updatedNode.avatar,
                };
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

            if (hasNonRelationshipChanges && !hasInvalidAvatar) {
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
                avatar: updatedNode.avatar,
              };
              console.log(
                `Saving node ${updatedNode.name} (${updatedNode.id}) with data:`,
                JSON.stringify(nodeData, null, 2)
              );
              await saveOrUpdateNode(nodeData, updatedNode.id);
              console.log(
                `Successfully saved node ${updatedNode.name} (${updatedNode.id})`
              );
            } else if (hasInvalidAvatar) {
              console.log(
                `Skipping saveOrUpdateNode for ${updatedNode.name} (${updatedNode.id}) due to invalid avatar URL`
              );
            }
          }
          for (const deletedNode of deletedNodes) {
            console.log(`Deleting node ${deletedNode.id}`);
            await deletePerson(deletedNode.id);
            console.log(`Successfully deleted node ${deletedNode.id}`);
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
                "birth date": node.birthDate,
                "death date": node.deathDate,
                "birth place": node.birthPlace,
                "death place": node.deathPlace,
                "has sub tree": node.hasSubTree,
                avatar: node.avatar,
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
            "Final Tree before updating chart:",
            JSON.stringify(finalTree, null, 2)
          );
          chartInstance.updateData(finalTree);
          originalTreeRef.current = updatedTreeWithRealIds;
          memoizedOnTreeUpdate();
        } catch (error) {
          console.error("Error during tree update:", error);
          chartInstance.updateData(originalTreeRef.current);
          showNotification(
            `Error during tree update: ${error.message}`,
            "error"
          );
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
            avatar: node.data.avatar || null,
            fatherId: node.rels.father || null,
            motherId: node.rels.mother || null,
            spouses: node.rels.spouses || [],
            children: node.rels.children || [],
          };
        });
      }

      return () => {
        console.log("Cleaning up FamilyTreeViewer...");
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