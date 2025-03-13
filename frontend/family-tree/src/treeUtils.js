export const updateNodeInTree = (tree, nodeId, updatedNode) => {
  if (!tree) return null;
  if (tree.id === nodeId) {
    return { ...tree, ...updatedNode };
  }
  if (tree.children && tree.children.length > 0) {
    return {
      ...tree,
      children: tree.children.map((child) =>
        updateNodeInTree(child, nodeId, updatedNode)
      ),
    };
  }
  return tree;
};

export const createPersonMap = (persons, debug = false) => {
  const personList = Array.isArray(persons) ? persons : [];
  if (personList.length === 0) {
    logWarn("personList is empty, returning null", debug);
    return null;
  }
  const personMap = new Map(
    personList.map((p) => [p.id, { ...p, children: p.children || [] }])
  );
  logDebug("personMap created:", Array.from(personMap.entries()), debug);
  return personMap;
};

export const processParentChildRelationships = (
  person,
  personMap,
  debug = false
) => {
  if (person.parentId) {
    const parent = personMap.get(person.parentId);
    if (parent) {
      parent.children = parent.children || [];
      if (!parent.children.some((child) => child.id === person.id)) {
        parent.children.push(person);
        logDebug(
          `Added child ${person.id} to parent ${parent.id}`,
          null,
          debug
        );
      }
    } else {
      logWarn(
        `Parent with ID ${person.parentId} not found for person ${person.id}`,
        debug
      );
    }
  }
};

export const findRoots = (
  person,
  personMap,
  roots,
  processedSpouses,
  debug = false
) => {
  if (!person.parentId) {
    if (processedSpouses.has(person.id)) {
      logDebug("Skipping processed spouse:", person.id, debug);
      return;
    }
    if (person.spouseId && personMap.has(person.spouseId)) {
      logDebug(
        "Adding root with spouse:",
        { personId: person.id, spouseId: person.spouseId },
        debug
      );
      roots.push(person);
      processedSpouses.add(person.id);
      processedSpouses.add(person.spouseId);
    } else {
      logDebug("Adding root without spouse:", person.id, debug);
      roots.push(person);
      processedSpouses.add(person.id);
    }
  }
};

export const pairSpouses = (roots, personMap, debug = false) => {
  return roots.map((root) => {
    if (root.spouseId && personMap.has(root.spouseId)) {
      const spouse = personMap.get(root.spouseId);
      logDebug(`Pairing spouse ${spouse.id} with root ${root.id}`, null, debug);
      return { ...root, spouse };
    }
    return root;
  });
};

export const buildTree = (persons, debug = false) => {
  const personMap = createPersonMap(persons, debug);
  if (!personMap) {
    return null;
  }

  let roots = [];
  const processedSpouses = new Set();

  personMap.forEach((person, id) => {
    logDebug("Processing person:", person);
    processParentChildRelationships(person, personMap, debug);
    findRoots(person, personMap, roots, processedSpouses, debug);
  });

  roots = pairSpouses(roots, personMap, debug);

  logDebug("Built tree:", roots, debug);
  return roots.length > 0 ? roots : null;
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
