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
        children: [],
        parents: p.parentId ? [p.parentId.toString()] : [],
        spouses: p.spouseId ? [p.spouseId.toString()] : [],
      },
    ])
  );
  logDebug("personMap created:", Array.from(personMap.entries()), debug);
  return personMap;
};

export const processRelationships = (person, personMap, debug = false) => {
  if (person.parentId) {
    const parent = personMap.get(person.parentId);
    if (parent) {
      if (!parent.children.includes(person.id.toString())) {
        parent.children.push(person.id.toString());
        logDebug(
          `Added child ${person.id} to parent ${parent.id}`,
          null,
          debug
        );
      }

      if (parent.spouseId) {
        const spouse = personMap.get(parent.spouseId);
        if (spouse) {
          if (!person.parents.includes(spouse.id.toString())) {
            person.parents.push(spouse.id.toString());
            logDebug(
              `Added spouse ${spouse.id} as a parent for person ${person.id}`,
              null,
              debug
            );
          }
          if (!spouse.children.includes(person.id.toString())) {
            spouse.children.push(person.id.toString());
            logDebug(
              `Added child ${person.id} to parent's spouse ${spouse.id}`,
              null,
              debug
            );
          }
        }
      }
    } else {
      logWarn(
        `Parent with ID ${person.parentId} not found for person ${person.id}`,
        debug
      );
    }
  }

  if (person.spouseId) {
    const spouse = personMap.get(person.spouseId);
    if (spouse) {
      if (!spouse.spouses.includes(person.id.toString())) {
        spouse.spouses.push(person.id.toString());
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
    parents: person.parents,
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

      const rels = {
        parents: getValidIds(node.parents),
        spouses: getValidIds(node.spouses),
        children: getValidIds(node.children),
      };

      rels.spouses = rels.spouses.filter(
        (spouseId) => !rels.children.includes(spouseId)
      );
      rels.children = rels.children.filter(
        (childId) => !rels.spouses.includes(childId)
      );

      let father, mother;
      if (rels.parents.length > 0) {
        rels.parents.forEach((parentId) => {
          const parent = tree.find((n) => String(n.id) === parentId);
          if (parent?.gender === "MALE") father = parentId;
          else if (parent?.gender === "FEMALE") mother = parentId;
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
