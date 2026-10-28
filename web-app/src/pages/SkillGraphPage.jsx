import { useMemo } from 'react';
import InteractiveSkillGraph from '../components/graph/InteractiveSkillGraph';
import './SkillGraphPage.css';

export default function SkillGraphPage() {
  const assessmentResult = useMemo(() => {
    try {
      const raw = localStorage.getItem('skillpath_assessment_result');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const skills = assessmentResult?.skills || [];

  return (
    <div className="graph-page-container">
      <InteractiveSkillGraph skills={skills} height="calc(100vh - 120px)" showHeader={true} />
    </div>
  );
}
