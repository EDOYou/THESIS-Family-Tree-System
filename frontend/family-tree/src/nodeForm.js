import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import NodeDetailsForm from "./NodeDetailsForm";
import AddChildForm from "./AddChildForm";
import AddSpouseForm from "./AddSpouseForm";
import { ERROR_MESSAGES } from "./constants";
import "./NodeForm.css";

const NodeForm = ({
  selectedNode,
  setSelectedNode,
  onSave,
  onClose,
  onRefresh,
  onAddMember,
  error,
  setError,
  setTree,
  addChild,
  addSpouse,
}) => {
  const [formData, setFormData] = useState({
    name: selectedNode?.name || "",
    gender: selectedNode?.gender || "MALE",
    occupation: selectedNode?.occupation || "",
    age: selectedNode?.age || "",
    birthDate: selectedNode?.birthDate || "",
    deathDate: selectedNode?.deathDate || "",
    birthPlace: selectedNode?.birthPlace || "",
    deathPlace: selectedNode?.deathPlace || "",
    hasSubTree: selectedNode?.hasSubTree || false,
  });
  const [newChild, setNewChild] = useState({ name: "", gender: "MALE" });
  const [newSpouse, setNewSpouse] = useState({
    name: "",
    gender: selectedNode?.gender === "MALE" ? "FEMALE" : "MALE",
  });

  useEffect(() => {
    if (selectedNode && selectedNode.addingMemberType === "spouse") {
      setNewSpouse((prev) => ({
        ...prev,
        gender: selectedNode.gender === "MALE" ? "FEMALE" : "MALE",
      }));
    }
  }, [selectedNode, selectedNode?.addingMemberType]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleChildInputChange = (e) => {
    const { name, value } = e.target;
    setNewChild({ ...newChild, [name]: value });
  };

  const handleSpouseInputChange = (e) => {
    const { name, value } = e.target;
    setNewSpouse({ ...newSpouse, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nodeData = {
        id: selectedNode.id,
        name: formData.name,
        gender: formData.gender,
        occupation: formData.occupation,
        age: formData.age ? parseInt(formData.age) : null,
        birthDate: formData.birthDate || null,
        deathDate: formData.deathDate || null,
        birthPlace: formData.birthPlace || null,
        deathPlace: formData.deathPlace || null,
        hasSubTree: formData.hasSubTree,
        children: selectedNode.children || [],
        spouses: selectedNode.spouses || [],
        parents: selectedNode.parents || [],
      };
      const updatedNode = await onSave(nodeData, setTree, selectedNode.id);
      setTree((prevTree) =>
        prevTree.map((node) =>
          node.id === updatedNode.id ? { ...node, ...updatedNode } : node
        )
      );
      onClose();
      setError(null);
    } catch (error) {
      console.error("Error saving node:", error);
      setError(ERROR_MESSAGES.SAVE_FAILED);
    }
  };

  const handleAddChild = async () => {
    try {
      if (!newChild.name) {
        setError(ERROR_MESSAGES.CHILD_NAME_REQUIRED);
        return;
      }
      const childData = {
        name: newChild.name,
        gender: newChild.gender,
        occupation: "",
        age: null,
        birthDate: null,
        deathDate: null,
        birthHebDate: null,
        deathHebDate: null,
        birthPlace: null,
        deathPlace: null,
        hasSubTree: false,
      };
      const newChildNode = await addChild(selectedNode.id, childData);
      setTree((prevTree) => {
        const updatedTree = prevTree.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              children: [...(node.children || []), newChildNode.id.toString()],
            };
          }
          if (selectedNode.spouses?.includes(node.id)) {
            return {
              ...node,
              children: [...(node.children || []), newChildNode.id.toString()],
            };
          }
          return node;
        });

        return [
          ...updatedTree,
          {
            id: newChildNode.id.toString(),
            name: newChildNode.name,
            gender: newChildNode.gender,
            parents: [
              selectedNode.id.toString(),
              ...(selectedNode.spouses || []).map((spouseId) =>
                spouseId.toString()
              ),
            ],
            children: [],
            spouses: [],
          },
        ];
      });
      setNewChild({ name: "", gender: "MALE" });
      setError(null);
    } catch (error) {
      setError(error.message || ERROR_MESSAGES.ADD_CHILD_FAILED);
    }
  };

  const handleAddSpouse = async () => {
    try {
      if (!newSpouse.name) {
        setError(ERROR_MESSAGES.SPOUSE_NAME_REQUIRED);
        return;
      }
      const spouseData = {
        name: newSpouse.name,
        gender: newSpouse.gender,
        occupation: "",
        age: null,
        birthDate: null,
        deathDate: null,
        birthHebDate: null,
        deathHebDate: null,
        birthPlace: null,
        deathPlace: null,
        hasSubTree: false,
      };
      const newSpouseNode = await addSpouse(selectedNode.id, spouseData);
      setTree((prevTree) => {
        const updatedTree = prevTree.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              spouses: [...(node.spouses || []), newSpouseNode.id.toString()],
            };
          }
          return node;
        });
        return [
          ...updatedTree,
          {
            id: newSpouseNode.id.toString(),
            name: newSpouseNode.name,
            gender: newSpouseNode.gender,
            parents: [],
            children: [...(selectedNode.children || [])],
            spouses: [selectedNode.id.toString()],
          },
        ];
      });
      setSelectedNode({ ...newSpouseNode, addingMemberType: null });
      setNewSpouse({
        name: "",
        gender: selectedNode.gender === "MALE" ? "FEMALE" : "MALE",
      });
      setError(null);
    } catch (error) {
      console.error("Error in handleAddSpouse:", error);
      setError(error.message || ERROR_MESSAGES.ADD_SPOUSE_FAILED);
    }
  };

  const cancelAddMember = () => {
    setSelectedNode({ ...selectedNode, addingMemberType: null });
  };

  return (
    <div className="node-form-container">
      <h2>Edit Node: {selectedNode.name}</h2>
      {error && <div className="error-message">{error}</div>}
      {!selectedNode.addingMemberType && (
        <NodeDetailsForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          onAddMember={onAddMember}
        />
      )}
      {selectedNode.addingMemberType === "child" && (
        <AddChildForm
          newChild={newChild}
          handleChildInputChange={handleChildInputChange}
          handleAddChild={handleAddChild}
          cancelAddMember={cancelAddMember}
        />
      )}
      {selectedNode.addingMemberType === "spouse" && (
        <AddSpouseForm
          newSpouse={newSpouse}
          handleSpouseInputChange={handleSpouseInputChange}
          handleAddSpouse={handleAddSpouse}
          cancelAddMember={cancelAddMember}
        />
      )}
    </div>
  );
};

NodeForm.propTypes = {
  selectedNode: PropTypes.object.isRequired,
  setSelectedNode: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onAddMember: PropTypes.func.isRequired,
  error: PropTypes.string,
  setError: PropTypes.func.isRequired,
  setTree: PropTypes.func.isRequired,
  addChild: PropTypes.func.isRequired,
  addSpouse: PropTypes.func.isRequired,
};

export default NodeForm;
