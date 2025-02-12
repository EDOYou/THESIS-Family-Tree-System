import React from "react";
import { CatmullRomCurve3, Vector3, TubeGeometry } from "three";

const TreeNode = ({ position }) => {
    return (
      <>
        <mesh position={position}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </>
    );
};

const CurvedBranch = ({ start, end }) => {
  const curve = new CatmullRomCurve3([
    new Vector3(start[0], start[1], start[2]),
    new Vector3((start[0] + end[0]) / 2 + (Math.random() - 0.5) * 0.5, start[1] + 1 + (Math.random() - 0.5) * 0.5, (start[2] + end[2]) / 2 + (Math.random() - 0.5) * 0.5),
    new Vector3(end[0], end[1], end[2])
  ]);

  const tubeGeometry = new TubeGeometry(curve, 20, 0.05, 8, false);

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial color="brown" />
    </mesh>
  );
};

const Tree = () => {
  const parents = [
    [-0.29, -3, 0],
    [0.29, -3, 0]
  ];
  
  const children = [
    [-1, -1.5, Math.random() * 0.6 - 0.3],
    [0, -1.5, Math.random() * 0.6 - 0.3],
    [1, -1.5, Math.random() * 0.6 - 0.3]
  ];

  const branchStartY = -3.2;
  
  return (
    <>
      {parents.map((pos, index) => (
        <TreeNode key={"parent-" + index} position={pos} />
      ))}

      {children.map((pos, index) => (
        <TreeNode key={"child-" + index} position={pos} />
      ))}

      {children.map((child, index) => (
        <CurvedBranch key={"branch-" + index} start={[0, branchStartY, 0]} end={child} />
      ))}
    </>
  );
};

export default Tree;