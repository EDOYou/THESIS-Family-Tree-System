import React from "react";

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

const Branch = ({ start, end }) => {
  const direction = [(end[0] - start[0]) / 2, (end[1] - start[1]) / 2, 0];
  const midY = (start[1] + end[1]) / 2;
  const height = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
  );
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);

  return (
    <mesh position={[(start[0] + end[0]) / 2, midY, 0]} rotation={[0, 0, angle + Math.PI / 2]}>
      <cylinderGeometry args={[0.05, 0.05, height - 0.3, 8]} />
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
    [-1, -1.5, 0],
    [0, -1.5, 0],
    [1, -1.5, 0]
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
        <Branch key={"branch-" + index} start={[0, branchStartY, 0]} end={child} />
      ))}
    </>
  );
};

export default Tree;