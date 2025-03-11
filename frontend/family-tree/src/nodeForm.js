import React, { useState, useEffect } from 'react';
import { updateNodeInTree } from './treeUtils';

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
    name: '',
    gender: 'MALE',
    occupation: '',
    age: '',
    birthDate: '',
    deathDate: '',
    birthPlace: '',
    deathPlace: '',
    hasSubTree: false,
  });
  const [newChild, setNewChild] = useState({ name: '', gender: 'MALE' });
  const [newSpouse, setNewSpouse] = useState({ name: '', gender: selectedNode?.gender === 'MALE' ? 'FEMALE' : 'MALE' });

  useEffect(() => {
    if (selectedNode && !selectedNode.addingMemberType) {
      setFormData({
        name: selectedNode.name || '',
        gender: selectedNode.gender || 'MALE',
        occupation: selectedNode.occupation || '',
        age: selectedNode.age || '',
        birthDate: selectedNode.birthDate || '',
        deathDate: selectedNode.deathDate || '',
        birthPlace: selectedNode.birthPlace || '',
        deathPlace: selectedNode.deathPlace || '',
        hasSubTree: selectedNode.hasSubTree || false,
      });
    }
  }, [selectedNode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
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
        spouse: selectedNode.spouse || null,
        parent: selectedNode.parentId ? { id: selectedNode.parentId } : null,
      };

      const updatedNode = await onSave(nodeData, setTree, selectedNode.id);
      const updatedTree = updateNodeInTree(selectedNode, selectedNode.id, updatedNode);
      setTree(updatedTree);
      onClose();
      setError(null);
    } catch (error) {
      setError('Failed to save the node. Please try again.');
    }
  };

  const handleAddChild = async () => {
    try {
      if (!newChild.name) {
        setError('Child name is required.');
        return;
      }
      const childData = {
        name: newChild.name,
        gender: newChild.gender,
        occupation: '',
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
      const updatedTree = updateNodeInTree(selectedNode, selectedNode.id, {
        ...selectedNode,
        children: [...(selectedNode.children || []), newChildNode],
      });
      setTree(updatedTree);
      setNewChild({ name: '', gender: 'MALE' });
      setError(null);
    } catch (error) {
      setError(error.message || 'Failed to add child.');
    }
  };

  const handleAddSpouse = async () => {
    try {
      if (!newSpouse.name) {
        setError('Spouse name is required.');
        return;
      }
      const spouseData = {
        name: newSpouse.name,
        gender: newSpouse.gender,
        occupation: '',
        age: null,
        birthDate: null,
        deathDate: null,
        birthHebDate: null,
        deathHebDate: null,
        birthPlace: null,
        deathPlace: null,
        hasSubTree: false,
      };
      console.log('Sending spouseData:', spouseData);
      const newSpouseNode = await addSpouse(selectedNode.id, spouseData);
      const updatedTree = updateNodeInTree(selectedNode, selectedNode.id, {
        ...selectedNode,
        spouse: newSpouseNode,
      });
      setTree(updatedTree);
      setNewSpouse({ name: '', gender: selectedNode.gender === 'MALE' ? 'FEMALE' : 'MALE' });
      setError(null);
    } catch (error) {
      setError(error.message || 'Failed to add spouse.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Edit Node: {selectedNode.name}</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!selectedNode.addingMemberType && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{ padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Gender:</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              style={{ padding: '5px', width: '200px' }}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Occupation:</label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              style={{ padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Age:</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              style={{ padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Birth Date:</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              style={{ padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Death Date:</label>
            <input
              type="date"
              name="deathDate"
              value={formData.deathDate}
              onChange={handleInputChange}
              style={{ padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Birth Place:</label>
            <input
              type="text"
              name="birthPlace"
              value={formData.birthPlace}
              onChange={handleInputChange}
              style={{ padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Death Place:</label>
            <input
              type="text"
              name="deathPlace"
              value={formData.deathPlace}
              onChange={handleInputChange}
              style={{ padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Has Sub Tree:</label>
            <input
              type="checkbox"
              name="hasSubTree"
              checked={formData.hasSubTree}
              onChange={handleInputChange}
              style={{ marginLeft: '5px' }}
            />
          </div>
          <button type="submit" style={{ padding: '5px 10px', marginTop: '10px' }}>
            Save
          </button>
          <button
            type="button"
            onClick={() => onAddMember('spouse')}
            style={{ padding: '5px 10px', marginTop: '10px' }}
          >
            Add Spouse
          </button>
          <button
            type="button"
            onClick={() => onAddMember('child')}
            style={{ padding: '5px 10px', marginTop: '10px' }}
          >
            Add Child
          </button>
        </form>
      )}
      {selectedNode.addingMemberType === 'child' && (
        <div style={{ marginTop: '20px' }}>
          <h3>Add Child</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Child Name:</label>
            <input
              type="text"
              name="name"
              value={newChild.name}
              onChange={handleChildInputChange}
              style={{ padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Gender:</label>
            <select
              name="gender"
              value={newChild.gender}
              onChange={handleChildInputChange}
              style={{ padding: '5px', width: '200px' }}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <button onClick={handleAddChild} style={{ padding: '5px 10px', marginTop: '10px' }}>
            Add Child
          </button>
          <button
            onClick={() => setSelectedNode({ ...selectedNode, addingMemberType: null })}
            style={{ padding: '5px 10px', marginTop: '10px' }}
          >
            Cancel
          </button>
        </div>
      )}
      {selectedNode.addingMemberType === 'spouse' && (
        <div style={{ marginTop: '20px' }}>
          <h3>Add Spouse</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Spouse Name:</label>
            <input
              type="text"
              name="name"
              value={newSpouse.name}
              onChange={handleSpouseInputChange}
              style={{ padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ width: '150px' }}>Gender:</label>
            <select
              name="gender"
              value={newSpouse.gender}
              onChange={handleSpouseInputChange}
              style={{ padding: '5px', width: '200px' }}
              disabled
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <button onClick={handleAddSpouse} style={{ padding: '5px 10px', marginTop: '10px' }}>
            Add Spouse
          </button>
          <button
            onClick={() => setSelectedNode({ ...selectedNode, addingMemberType: null })}
            style={{ padding: '5px 10px', marginTop: '10px' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default NodeForm;