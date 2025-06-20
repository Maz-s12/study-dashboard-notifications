import axios from 'axios';

const SURVEYMONKEY_TOKEN = process.env.SURVEYMONKEY_TOKEN;
const SURVEY_ID = process.env.SURVEY_ID;

export interface SurveyQuestion {
  id: string;
  heading: string;
  type: string;
  answers?: {
    choices?: Array<{
      id: string;
      text: string;
    }>;
    rows?: Array<{
      id: string;
      text: string;
    }>;
  };
}

export interface SurveyDetails {
  id: string;
  title: string;
  pages: Array<{
    id: string;
    title: string;
    questions: SurveyQuestion[];
  }>;
}

export interface FormattedSurveyResponse {
  questionText: string;
  answerText: string;
  questionType: string;
}

// Cache for survey details to avoid repeated API calls
let surveyDetailsCache: SurveyDetails | null = null;

export async function getSurveyDetails(): Promise<SurveyDetails> {
  if (surveyDetailsCache) {
    return surveyDetailsCache;
  }

  if (!SURVEYMONKEY_TOKEN || !SURVEY_ID) {
    throw new Error('SurveyMonkey token or survey ID not configured');
  }

  try {
    const url = `https://api.surveymonkey.ca/v3/surveys/${SURVEY_ID}/details`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${SURVEYMONKEY_TOKEN}`,
        Accept: 'application/json',
      }
    });

    surveyDetailsCache = response.data as SurveyDetails;
    return surveyDetailsCache;
  } catch (error) {
    console.error('Error fetching survey details:', error);
    throw error;
  }
}

export function formatSurveyResponse(
  surveyDetails: SurveyDetails,
  responseData: any
): FormattedSurveyResponse[] {
  const formattedResponses: FormattedSurveyResponse[] = [];

  // Create a map of question IDs to question details
  const questionMap = new Map<string, SurveyQuestion>();
  surveyDetails.pages.forEach(page => {
    page.questions.forEach(question => {
      questionMap.set(question.id, question);
    });
  });

  // Process each page and question in the response
  responseData.pages.forEach((page: any) => {
    page.questions.forEach((question: any) => {
      const questionDetails = questionMap.get(question.id);
      if (!questionDetails) {
        console.warn(`Question ${question.id} not found in survey details`);
        return;
      }

      question.answers.forEach((answer: any) => {
        let answerText = '';

        // Handle different answer types
        if (answer.text) {
          answerText = answer.text;
        } else if (answer.choice_id) {
          // Find the choice text
          const choice = questionDetails.answers?.choices?.find(c => c.id === answer.choice_id);
          if (choice) {
            answerText = choice.text;
          } else {
            answerText = `Choice ID: ${answer.choice_id}`;
          }
        }

        if (answerText) {
          // Try to get the question text from various possible fields
          let questionText = questionDetails.heading
            || ((questionDetails as any).headings?.[0]?.heading)
            || (questionDetails as any).question
            || 'Untitled Question';
          formattedResponses.push({
            questionText: questionText,
            answerText: answerText,
            questionType: questionDetails.type
          });
        }
      });
    });
  });

  return formattedResponses;
}

export async function getFormattedSurveyResponse(responseData: any): Promise<FormattedSurveyResponse[]> {
  const surveyDetails = await getSurveyDetails();
  return formatSurveyResponse(surveyDetails, responseData);
} 