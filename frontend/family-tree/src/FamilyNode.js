import React from "react";
import classNames from "clsx";

import styles from "./FamilyNode.module.css";

export default function FamilyNode({
  node,
  isRoot,
  style,
  singleNode,
}) {
  return (
    <div className={classNames(styles.root, singleNode && styles.singleNode)} style={style}>
      <div
        className={classNames(
          styles.inner,
          styles[node.gender],
          isRoot && styles.isRoot
        )}
      >
        <div className={styles.content}>
          <div className={styles.name}>{node.name}</div>
          <div className={styles.dates}>
            {node.occu}
            {node.age ? <span> Age: {node.age}</span> : null}
            <br />
            {node.birt_date} - {node.deat_date}
          </div>
          <div className={styles.dates}>
            {node.birt_hebdate} - {node.deat_hebdate}
          </div>
          {node.birt_place} - {node.deat_place}
        </div>
        {node.hasSubTree && node.id && (
          <div
            className={classNames(styles.sub, styles[node.gender])}
          />
        )}
      </div>
    </div>
  );
}