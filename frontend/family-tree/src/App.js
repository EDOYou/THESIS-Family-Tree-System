import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactFamilyTree from "react-family-tree";
import FamilyNode from "./FamilyNode";
import styles from "./App.module.css";

import "./styles.css";

const MY_ID = "1";
const WIDTH = 260;
const HEIGHT = 280;

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [rootId, setRootId] = useState(MY_ID);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/persons")
      .then((response) => {
        console.log("Fetched data:", response.data);
        if (!response.data || !Array.isArray(response.data)) {
          console.error("Invalid data format:", response.data);
          setNodes([]);
          return;
        }
        let processedNodes = response.data
          .map((person) => {
            if (!person || !person.id || !person.name) {
              console.warn("Invalid person object:", person);
              return null;
            }
            return {
              id: person.id.toString(),
              name: person.name,
              parentId: person.parent ? person.parent.id.toString() : null,
              parents: [],
              siblings: [],
              spouses: [],
              children: [],
              img: person.img || "default",
              gender: person.gender || "unknown",
              occu: person.occupation || "",
              age: person.age || "",
              birt_date: person.birthDate || "",
              deat_date: person.deathDate || "",
              birt_hebdate: person.birthHebDate || "",
              deat_hebdate: person.deathHebDate || "",
              birt_place: person.birthPlace || "",
              deat_place: person.deathPlace || "",
              hasSubTree: person.hasSubTree || false,
            };
          })
          .filter((node) => node !== null);

        processedNodes.forEach((node) => {
          if (node.parentId) {
            const parentNode = processedNodes.find(
              (n) => n.id === node.parentId
            );
            if (parentNode) {
              parentNode.children = parentNode.children || [];
              parentNode.children.push({ id: node.id, type: "blood" });
              node.parents = node.parents || [];
              node.parents.push({ id: parentNode.id, type: "blood" });
              parentNode.hasSubTree = true;
            } else {
              console.warn(
                `No parent found for node ${node.id} with parentId ${node.parentId}, skipping relationship`
              );
              node.parentId = null;
            }
          }
        });

        if (processedNodes.length === 0) {
          console.warn("No data returned, adding Default Root");
          processedNodes.push({
            id: MY_ID,
            name: "Default Root",
            parentId: null,
            parents: [],
            siblings: [],
            spouses: [],
            children: [],
            gender: "unknown",
            occu: "",
            age: "",
            birt_date: "",
            deat_date: "",
            birt_hebdate: "",
            deat_hebdate: "",
            birt_place: "",
            deat_place: "",
            hasSubTree: false,
          });
        } else if (!processedNodes.some((n) => n.id === rootId)) {
          console.warn(
            `rootId ${rootId} not found in nodes, keeping existing nodes`
          );
        }

        processedNodes.forEach((node) => {
          if (node.parents && node.parents.length > 0) {
            node.parents = node.parents.filter((parent) =>
              processedNodes.some((n) => n.id === parent.id)
            );
            if (node.id === MY_ID && node.parents.length > 0) {
              console.warn(
                `Removing hardcoded parents for GrandMother (id: ${MY_ID})`
              );
              node.parents = [];
            }
          }
        });

        setNodes(processedNodes);
      })
      .catch((error) => {
        console.error(
          "Error fetching data:",
          error.message,
          error.response?.data
        );
        setNodes([]);
      });
  }, []);

  return (
    <div className={styles.root}>
      <div style={{ fontSize: 40, textAlign: "center" }}>
        {"Family: "}
        {nodes.length > 0
          ? nodes.find((n) => n.id === rootId)?.name
          : "Loading..."}
      </div>

      <div className={styles.wrapper} style={{ position: "relative" }}>
        {nodes.length > 0 ? (
          <ReactFamilyTree
            nodes={nodes}
            rootId={rootId}
            width={WIDTH}
            height={HEIGHT}
            canvasClassName={styles.tree}
            renderNode={(node) => {
              return (
                <FamilyNode
                  key={node.id}
                  node={node}
                  isRoot={node.id === rootId}
                  onSubClick={setRootId}
                  style={{
                    width: WIDTH,
                    height: HEIGHT,
                    transform: `translate(${node.left * (WIDTH / 2)}px, ${
                      node.top * (HEIGHT / 2)
                    }px)`,
                  }}
                />
              );
            }}
          />
        ) : (
          <p>Loading family tree...</p>
        )}
      </div>
    </div>
  );
}
