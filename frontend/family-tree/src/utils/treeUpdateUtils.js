import {
  createPerson,
  saveOrUpdateNode,
  addChild,
  addSpouse,
  deletePerson,
} from "../nodeService";
import { showNotification } from "./notificationUtils";
import { handleAvatarUpdate } from "./avatarUtils";

export const transformNodeData = (node) => {
  const name =
    [node.data.firstName, node.data.lastName].filter(Boolean).join(" ") ||
    "Unnamed";
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
};

export const transformTreeData = (data) => {
  return data.map((node) => {
    if (node.data && node.rels) {
      return transformNodeData(node);
    }
    return node;
  });
};

export const createNodeData = (node) => ({
  gender: node.gender,
  name: node.name,
  occupation: node.occupation,
  age: node.age,
  birthDate: node.birthDate,
  deathDate: node.deathDate,
  birthPlace: node.birthPlace,
  deathPlace: node.deathPlace,
  hasSubTree: node.hasSubTree,
  fatherId: node.fatherId,
  motherId: node.motherId,
  spouses: node.spouses,
  children: node.children,
});

export const updateSpouseRelationships = (
  transformedOriginalTree,
  spouseId,
  newSpouseId,
  newSpouseData
) => {
  const spouseNodeInOriginal = transformedOriginalTree.find(
    (n) => n.id === spouseId
  );
  if (spouseNodeInOriginal) {
    spouseNodeInOriginal.spouses = spouseNodeInOriginal.spouses || [];
    if (!spouseNodeInOriginal.spouses.includes(newSpouseId)) {
      spouseNodeInOriginal.spouses.push(newSpouseId);
    }
  }
  transformedOriginalTree.push({
    id: newSpouseId,
    ...newSpouseData,
  });
};

export const handleTreeUpdate = async ({
  editTreeInstance,
  isAdmin,
  chartInstance,
  originalTreeRef,
  memoizedOnTreeUpdate,
}) => {
  if (!isAdmin) {
    console.log("Tree update blocked: User is not an admin");
    chartInstance.updateData(originalTreeRef.current);
    return;
  }

  try {
    const updatedData = JSON.parse(editTreeInstance.getDataJson());
    // console.log("Updated Data from setOnChange:", JSON.stringify(updatedData, null, 2)); // Commented out for production

    const updatedTree = updatedData.map(transformNodeData);
    const transformedOriginalTree = transformTreeData(originalTreeRef.current);

    const originalIds = new Set(transformedOriginalTree.map((node) => node.id));
    const updatedIds = new Set(updatedTree.map((node) => node.id));
    const newNodes = updatedTree.filter((node) => !originalIds.has(node.id));
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
          let hasInvalidAvatar = false;
          if (newNode.avatar) {
            const isValidImageUrl = newNode.avatar.match(
              /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif))$/
            );
            if (!isValidImageUrl) {
              console.error(
                `Invalid avatar URL for new spouse ${newNode.name} (${newNode.id}):`,
                newNode.avatar
              );
              showNotification(
                "Invalid avatar URL for new spouse. Please provide a direct link to an image (e.g., https://example.com/image.jpg).",
                "error"
              );
              hasInvalidAvatar = true;
            }
          }

          if (hasInvalidAvatar) {
            throw new Error("Invalid avatar URL for new spouse.");
          }

          const spouseData = createNodeData(newNode);
          console.log(
            `Adding spouse for ${spouseId} with data:`,
            JSON.stringify(spouseData, null, 2)
          );
          const createdSpouse = await addSpouse(spouseId, spouseData);
          idMapping.set(newNode.id, createdSpouse.id.toString());

          await handleAvatarUpdate({
            nodeId: createdSpouse.id,
            avatarUrl: newNode.avatar,
            nodeName: newNode.name,
            nodeType: "new spouse",
            validate: false,
            throwOnError: true,
          });

          updateSpouseRelationships(
            transformedOriginalTree,
            spouseId,
            createdSpouse.id,
            {
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
            }
          );
          continue;
        } else if (
          relType === "child" &&
          (newNode.fatherId || newNode.motherId)
        ) {
          const parentId = newNode.fatherId || newNode.motherId;
          const parentNode = updatedTree.find((node) => node.id === parentId);

          if (parentNode) {
            let hasInvalidAvatar = false;
            if (newNode.avatar) {
              const isValidImageUrl = newNode.avatar.match(
                /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif))$/
              );
              if (!isValidImageUrl) {
                console.error(
                  `Invalid avatar URL for new child ${newNode.name} (${newNode.id}):`,
                  newNode.avatar
                );
                showNotification(
                  "Invalid avatar URL for new child. Please provide a direct link to an image (e.g., https://example.com/image.jpg).",
                  "error"
                );
                hasInvalidAvatar = true;
              }
            }

            if (hasInvalidAvatar) {
              throw new Error("Invalid avatar URL for new child.");
            }

            const childData = createNodeData(newNode);
            console.log(
              `Adding child for ${parentId} with data:`,
              JSON.stringify(childData, null, 2)
            );
            const createdChild = await addChild(parentId, childData);
            idMapping.set(newNode.id, createdChild.id.toString());

            await handleAvatarUpdate({
              nodeId: createdChild.id,
              avatarUrl: newNode.avatar,
              nodeName: newNode.name,
              nodeType: "new child",
              validate: false,
              throwOnError: true,
            });
            continue;
          }
        }

        const nodeData = createNodeData(newNode);
        console.log(
          `Creating new node with data:`,
          JSON.stringify(nodeData, null, 2)
        );
        const createdNode = await createPerson(nodeData);
        idMapping.set(newNode.id, createdNode.id.toString());

        await handleAvatarUpdate({
          nodeId: createdNode.id,
          avatarUrl: newNode.avatar,
          nodeName: newNode.name,
          nodeType: "new node",
          validate: true,
          throwOnError: true,
        });
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
        const { success, hasInvalidAvatar: invalidAvatar } =
          await handleAvatarUpdate({
            nodeId: updatedNode.id,
            avatarUrl: updatedNode.avatar,
            nodeName: updatedNode.name,
            nodeType: "node",
            validate: true,
            throwOnError: false,
          });
        if (!success) {
          hasInvalidAvatar = invalidAvatar;
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

          const spouseData = createNodeData(updatedNode);
          console.log(
            `Adding spouse for ${spouseId} with data:`,
            JSON.stringify(spouseData, null, 2)
          );
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
            if (!spouseInOriginalUpdated.spouses.includes(updatedNode.id)) {
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
          ...createNodeData(updatedNode),
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
        Array.isArray(rels) ? rels.filter((id) => typeof id === "string") : [];

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
    showNotification(`Error during tree update: ${error.message}`, "error");
    throw error;
  }
};
