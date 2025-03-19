export const createPersonMap = (persons, debug = false) => {
  const personList = Array.isArray(persons) ? persons : [];
  if (personList.length === 0) {
    logWarn("personList is empty, returning null", debug);
    return null;
  }
  const personMap = new Map(
    personList.map((p) => [
      p.id,
      {
        ...p,
        children: p.childrenIds || [],
        spouses: p.spouseId ? [p.spouseId] : [],
        fatherId: p.fatherId || null,
        motherId: p.motherId || null,
      },
    ])
  );
  logDebug("personMap created:", Array.from(personMap.entries()), debug);
  return personMap;
};

export const processRelationships = (person, personMap, debug = false) => {
  if (person.fatherId) {
    const father = personMap.get(person.fatherId);
    if (father) {
      if (!father.children.includes(person.id)) {
        father.children.push(person.id);
        logDebug(
          `Added child ${person.id} to father ${father.id}`,
          null,
          debug
        );
      }
    } else {
      logWarn(
        `Father with ID ${person.fatherId} not found for person ${person.id}`,
        debug
      );
    }
  }

  if (person.motherId) {
    const mother = personMap.get(person.motherId);
    if (mother) {
      if (!mother.children.includes(person.id)) {
        mother.children.push(person.id);
        logDebug(
          `Added child ${person.id} to mother ${mother.id}`,
          null,
          debug
        );
      }
    } else {
      logWarn(
        `Mother with ID ${person.motherId} not found for person ${person.id}`,
        debug
      );
    }
  }

  if (person.spouseId) {
    const spouse = personMap.get(person.spouseId);
    if (spouse) {
      if (!spouse.spouses.includes(person.id)) {
        spouse.spouses.push(person.id);
        logDebug(
          `Linked spouse ${spouse.id} to person ${person.id}`,
          null,
          debug
        );
      }
    } else {
      logWarn(
        `Spouse with ID ${person.spouseId} not found for person ${person.id}`,
        debug
      );
    }
  }
};

export const buildTree = (persons, debug = false) => {
  const personMap = createPersonMap(persons, debug);
  if (!personMap) {
    return null;
  }

  personMap.forEach((person) => {
    processRelationships(person, personMap, debug);
  });

  const flatTree = Array.from(personMap.values()).map((person) => ({
    id: person.id.toString(),
    name: person.name,
    gender: person.gender,
    fatherId: person.fatherId,
    motherId: person.motherId,
    spouses: person.spouses,
    children: person.children,
  }));

  logDebug("Built flat tree for react-family-tree:", flatTree, debug);
  return flatTree.length > 0 ? flatTree : null;
};

export const transformTree = (tree) => {
  try {
    const transformed = tree.map((node) => {
      if (!node.id) {
        throw new Error(
          `Node is missing an ID: ${JSON.stringify(
            node
          )}. All database nodes must have a valid ID.`
        );
      }

      const id = String(node.id);
      const allIds = new Set(tree.map((n) => String(n.id)));
      const getValidIds = (ids) =>
        (ids || []).filter((id) => allIds.has(String(id))).map(String);

      console.log(
        `Transforming node with ID ${id}:`,
        JSON.stringify(node, null, 2)
      );

      const rels = {
        father:
          node.fatherId && allIds.has(String(node.fatherId))
            ? String(node.fatherId)
            : undefined,
        mother:
          node.motherId && allIds.has(String(node.motherId))
            ? String(node.motherId)
            : undefined,
        spouses: getValidIds(node.spouses),
        children: getValidIds(node.children),
      };

      rels.spouses = rels.spouses.filter(
        (spouseId) => !rels.children.includes(spouseId)
      );
      rels.children = rels.children.filter(
        (childId) => !rels.spouses.includes(childId)
      );

      const genderValue = node.gender ? node.gender.toUpperCase() : "unknown";
      const normalizedGender =
        genderValue === "MALE" || genderValue === "M"
          ? "M"
          : genderValue === "FEMALE" || genderValue === "F"
          ? "F"
          : "unknown";

      const [firstName, ...lastNameParts] = (node.name || "").split(" ");
      const lastName = lastNameParts.join(" ") || "";
      const name = [firstName, lastName].filter(Boolean).join(" ") || "Unnamed";

      const mapEmptyToNull = (value) => (value === "" ? null : value);

      const transformedNode = {
        id,
        data: {
          gender: normalizedGender,
          name,
          firstName: mapEmptyToNull(firstName) || "",
          lastName: mapEmptyToNull(lastName) || "",
          occupation: mapEmptyToNull(node.occupation),
          age: mapEmptyToNull(node.age),
          birthDate: mapEmptyToNull(node.birthDate),
          deathDate: mapEmptyToNull(node.deathDate),
          birthPlace: mapEmptyToNull(node.birthPlace),
          deathPlace: mapEmptyToNull(node.deathPlace),
          hasSubTree: node.hasSubTree || false,
        },
        rels,
      };

      console.log(
        `Transformed node with ID ${id}:`,
        JSON.stringify(transformedNode, null, 2)
      );

      return transformedNode;
    });

    const uniqueIds = new Set(transformed.map((n) => n.id));
    if (uniqueIds.size !== transformed.length) {
      console.warn("Duplicate IDs detected in transformedTree!");
    }

    return transformed;
  } catch (error) {
    console.error("Error transforming tree:", error);
    throw error;
  }
};

export const logDebug = (message, data, debug = false) => {
  if (debug) {
    console.log(message, data);
  }
};

export const logWarn = (message, debug = false) => {
  if (debug) {
    console.warn(message);
  }
};
