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

const Tree = () => {
  return (
    <>
      <TreeNode position={[-0.5, -3, 0]} />
      <TreeNode position={[0.5, -3, 0]} />

      <mesh position={[0, -2.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="brown" />
      </mesh>

      <TreeNode position={[-1, -1.5, 0]} />
      <TreeNode position={[1, -1.5, 0]} />

      <mesh position={[-0.75, -2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="brown" />
      </mesh>
      <mesh position={[0.75, -2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="brown" />
      </mesh>
    </>
  );
};

export default Tree;