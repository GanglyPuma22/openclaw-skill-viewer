import { Link } from 'react-router-dom'
import { formatBytes, formatDate } from '../lib/format'
import type { SkillRecord } from '../types'

interface SkillTableProps {
  skills: SkillRecord[]
}

export function SkillTable({ skills }: SkillTableProps) {
  return (
    <div className="table-shell">
      <table className="skills-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Category</th>
            <th>Files</th>
            <th>Size</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.id}>
              <td>
                <Link className="skill-link" to={`/skills/${encodeURIComponent(skill.id)}`}>
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-description">{skill.description || 'No description'}</span>
                </Link>
              </td>
              <td>
                <span className={`badge ${skill.ready ? 'badge-ready' : 'badge-not-ready'}`}>
                  {skill.ready ? 'Ready' : 'Needs setup'}
                </span>
              </td>
              <td>{skill.categoryLabel}</td>
              <td>{skill.fileCount}</td>
              <td>{formatBytes(skill.folderSize)}</td>
              <td>{formatDate(skill.modifiedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
