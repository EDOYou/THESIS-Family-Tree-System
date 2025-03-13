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
