import React, { useState } from "react";
import { CatmullRomCurve3, Vector3, TubeGeometry } from "three";
import familyData from "./family_tree_structure.json";

const TreeNode = ({ position, onClick }) => {
  return (
    <mesh position={position} onClick={onClick}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
};

const ParentConnector = ({ start, end }) => {
  if (!start || !end) {
    return null;
  }

  return (
    <mesh position={[(start[0] + end[0]) / 2, start[1], start[2]]}>
      <cylinderGeometry args={[0.05, 0.05, Math.abs(end[0] - start[0]), 8]} />
      <meshStandardMaterial color="brown" />
    </mesh>
  );
};

const CurvedBranch = ({ start, end }) => {
  if (!start || !end) return null;

  const randomDirectionX = Math.random() < 0.5 ? -1 : 1;
  const randomDirectionZ = Math.random() < 0.5 ? -1 : 1;

  const curve = new CatmullRomCurve3([
    new Vector3(start[0], start[1], start[2]),
    new Vector3(
      (start[0] + end[0]) / 2 + randomDirectionX * (Math.random() * 1.2),
      start[1] + 1.5 + (Math.random() - 0.5) * 1.2,
      (start[2] + end[2]) / 2 + randomDirectionZ * (Math.random() * 1.2)
    ),
    new Vector3(end[0], end[1], end[2])
  ]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 40, 0.1, 8, false]} />
      <meshStandardMaterial color="brown" />
    </mesh>
  );
};

const Tree = () => {
  const [tree, setTree] = useState(familyData);
  const [positions, setPositions] = useState({ 0: [0, -3, 0] });
  const [parentConnectors, setParentConnectors] = useState([]);
  const childSpacing = 2.0;

  const handleAddMember = (id, type) => {
    let newTree = { ...tree };
    let newPositions = { ...positions };
    let newParentConnectors = [...parentConnectors];

    if (type === "spouse") {
      let spouseId = Object.keys(newTree.Smiths).length;
      newTree.Smiths[`New Spouse ${spouseId}`] = { id: spouseId, spouse: id };
      newPositions[spouseId] = [positions[id][0] + 0.6, positions[id][1], positions[id][2]];
      newParentConnectors.push([id, spouseId]);
    }

    if (type === "child") {
      let childId = Object.keys(newTree.Smiths).length;
      let parentConnector = newParentConnectors.find(connector => connector.includes(id));
      
      if (!parentConnector) {
        alert("Error: This parent does not have a spouse connection yet!");
        return;
      }

      newTree.Smiths[`New Child ${childId}`] = { id: childId, parents: parentConnector };
      let connectorPosition = [(positions[parentConnector[0]][0] + positions[parentConnector[1]][0]) / 2, positions[parentConnector[0]][1], positions[parentConnector[0]][2]];
      
      let siblingCount = Object.values(newTree.Smiths).filter(member => member.parents && member.parents[0] === parentConnector[0] && member.parents[1] === parentConnector[1]).length;
      let offset = (siblingCount - 1) * childSpacing * 0.5;
      let randomDirectionX = Math.random() < 0.5 ? -1 : 1;
      let randomDirectionZ = Math.random() < 0.5 ? -1 : 1;
      newPositions[childId] = [
        connectorPosition[0] - offset + siblingCount * childSpacing * randomDirectionX,
        connectorPosition[1] + 3,
        connectorPosition[2] + randomDirectionZ * (Math.random() * 2)
      ];
    }

    setTree(newTree);
    setPositions(newPositions);
    setParentConnectors(newParentConnectors);
  };

  return (
    <>
      {parentConnectors.map(([parent1, parent2], index) => (
        <ParentConnector key={`connector-${index}`} start={positions[parent1]} end={positions[parent2]} />
      ))}

      {Object.entries(tree.Smiths).map(([name, details]) =>
        positions[details.id] ? (
          <TreeNode
            key={details.id}
            position={positions[details.id]}
            name={name}
            onClick={() => {
              let action = window.prompt("Add 'spouse' or 'child'?");
              if (action === "spouse" || action === "child") {
                handleAddMember(details.id, action);
              }
            }}
          />
        ) : null
      )}

      {Object.entries(tree.Smiths).map(([name, details]) =>
        details.parents && positions[details.parents[0]] && positions[details.id] ? (
          <CurvedBranch key={`branch-${details.id}`} start={[(positions[details.parents[0]][0] + positions[details.parents[1]][0]) / 2, positions[details.parents[0]][1], positions[details.parents[0]][2]]} end={positions[details.id]} />
        ) : null
      )}
    </>
  );
};

export default Tree;