import React, { useState, useEffect } from 'react';
import { Users, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';

interface EligibleParticipant {
  id: string;
  name: string;
  prescreen_approval_date: string;
  pre_screen_data: string; // This is a JSON string
}

interface SurveyData {
  questionText: string;
  answerText: string;
}

const EligibleParticipantsTable: React.FC = () => {
  const [participants, setParticipants] = useState<EligibleParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<{ [id: string]: boolean }>({});
  const [surveyDataCache, setSurveyDataCache] = useState<{ [id: string]: SurveyData[] }>({});

  useEffect(() => {
    fetchEligibleParticipants();
  }, []);

  const fetchEligibleParticipants = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/participants/eligible');
      const rawData = await response.json();
      setParticipants(rawData);
      setError(null);
    } catch (err) {
      console.error('Error fetching eligible participants:', err);
      setError('Failed to load eligible participants');
    } finally {
      setLoading(false);
    }
  };

  const parseSurveyData = (participant: EligibleParticipant): SurveyData[] => {
    if (surveyDataCache[participant.id]) {
      return surveyDataCache[participant.id];
    }
    try {
      const parsedData = JSON.parse(participant.pre_screen_data);
      const surveyPages = parsedData.pages || [];
      const questionsAndAnswers: SurveyData[] = [];

      for (const page of surveyPages) {
        for (const question of page.questions) {
          const questionText = question.headings[0]?.heading || 'Unknown Question';
          const answers = question.answers.map((ans: any) => ans.text || 'N/A').join(', ');
          questionsAndAnswers.push({
            questionText: questionText,
            answerText: answers,
          });
        }
      }
      setSurveyDataCache(prev => ({ ...prev, [participant.id]: questionsAndAnswers }));
      return questionsAndAnswers;
    } catch (e) {
      console.error('Error parsing survey data for participant', participant.id, e);
      return [];
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '384px' }}><Loader style={{ width: '24px', height: '24px', color: '#7c3aed' }} className="animate-spin" /><span style={{ color: '#6b7280', marginLeft: 8 }}>Loading...</span></div>;
  if (error) return <div style={{ color: '#dc2626', textAlign: 'center', marginTop: 32 }}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', marginBottom: 24 }}><Users style={{ width: 20, height: 20, color: '#7c3aed', marginRight: 8 }} />Eligibility Confirmed</h2>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approval Date</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Survey Data</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'white' }}>
              {participants.length > 0 ? (
                participants.map((participant, index) => (
                  <React.Fragment key={participant.id}>
                    <tr style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{participant.name}</td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{new Date(participant.prescreen_approval_date).toLocaleString()}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                        <button onClick={() => setExpandedRows(prev => ({ ...prev, [participant.id]: !prev[participant.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {expandedRows[participant.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />} View
                        </button>
                      </td>
                    </tr>
                    {expandedRows[participant.id] && (
                      <tr>
                        <td colSpan={3} style={{ background: '#f9fafb', padding: '16px 24px' }}>
                          <div>
                            <strong>Survey Questions & Answers:</strong>
                            <ul style={{ margin: '12px 0 0 0', padding: 0, listStyle: 'none' }}>
                              {parseSurveyData(participant).length > 0 ? parseSurveyData(participant).map((qa: SurveyData, idx: number) => (
                                <li key={idx} style={{ marginBottom: 8 }}>
                                  <div style={{ fontWeight: 500 }}>{qa.questionText}</div>
                                  <div style={{ color: '#4b5563', marginLeft: 8 }}>{qa.answerText}</div>
                                </li>
                              )) : <li>No survey data found or could not be parsed.</li>}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ padding: '32px 24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>No eligible participants waiting for booking.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EligibleParticipantsTable; 