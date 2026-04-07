import type { FileTreeNode } from '../types'

interface FileTreeProps {
  nodes: FileTreeNode[]
  selectedPath: string
  onSelect: (path: string) => void
}

function TreeNode({ node, selectedPath, onSelect }: { node: FileTreeNode; selectedPath: string; onSelect: (path: string) => void }) {
  const isSelected = selectedPath === node.path
  if (node.type === 'file') {
    return (
      <button className={`tree-node file ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(node.path)}>
        {node.name}
      </button>
    )
  }

  return (
    <div className="tree-group">
      <div className="tree-folder">{node.name}</div>
      <div className="tree-children">
        {node.children?.map((child) => (
          <TreeNode key={child.path} node={child} selectedPath={selectedPath} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

export function FileTree({ nodes, selectedPath, onSelect }: FileTreeProps) {
  return (
    <div className="tree-shell">
      {nodes.map((node) => (
        <TreeNode key={node.path} node={node} selectedPath={selectedPath} onSelect={onSelect} />
      ))}
    </div>
  )
}
