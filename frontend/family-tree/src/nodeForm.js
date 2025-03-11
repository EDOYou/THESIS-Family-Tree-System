import React, { useState, useEffect } from 'react';
import { saveOrUpdateNode } from './nodeService';
import { updateNodeInTree } from './treeUtils';

const NodeForm = ({ selectedNode, onSave, onClose, onRefresh, error, setError, setTree }) => {
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

  useEffect(() => {
    if (selectedNode) {
      setFormData({
        name: selectedNode.name || '',
        gender: selectedNode.gender || 'MALE',
        occupation: selectedNode.occu || '',
        age: selectedNode.age || '',
        birthDate: selectedNode.birt_date || '',
        deathDate: selectedNode.deat_date || '',
        birthPlace: selectedNode.birt_place || '',
        deathPlace: selectedNode.deat_place || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nodeData = {
        id: selectedNode.id,
        name: formData.name,
        parent: selectedNode.parentId ? { id: selectedNode.parentId } : null,
        gender: formData.gender,
        occupation: formData.occupation,
        age: formData.age ? parseInt(formData.age) : null,
        birthDate: formData.birthDate || null,
        deathDate: formData.deathDate || null,
        birthPlace: formData.birthPlace || null,
        deathPlace: formData.deathPlace || null,
        hasSubTree: formData.hasSubTree,
        children: selectedNode.children || [],
      };

      const updatedNode = await saveOrUpdateNode(nodeData, setTree, selectedNode.id);

      const updatedTree = updateNodeInTree(selectedNode, selectedNode.id, updatedNode);
      setTree(updatedTree);

      onClose();
      setError(null);
    } catch (error) {
      setError('Failed to save the node. Please try again.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Edit Node: {selectedNode.name}</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
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
      </form>
    </div>
  );
};

export default NodeForm;