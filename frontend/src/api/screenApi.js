import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

const screenApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for LLM inference
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Submits patient physiological and lifestyle data to the backend risk screening endpoint.
 *
 * @param {Object} patientData - Must match backend PatientData schema
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function submitScreening(patientData) {
  try {
    const response = await screenApiClient.post('/api/screen', patientData);
    if (response.data) {
      return {
        success: true,
        data: response.data,
      };
    }
    throw new Error('Empty response payload received from screening backend');
  } catch (error) {
    let errorMessage = "We couldn't process this screening — please try again.";

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorMessage =
        'The risk screening request timed out. AI analysis took longer than expected. Please try again.';
    } else if (error.response) {
      // Server responded with an error HTTP status
      const status = error.response.status;
      if (status === 502) {
        errorMessage =
          "We couldn't process this screening — risk analysis models are temporarily unavailable. Please try again in a moment.";
      } else if (status === 422) {
        errorMessage =
          "We couldn't process this screening — please check that all form inputs are valid numbers.";
      } else if (error.response.data && error.response.data.detail) {
        errorMessage = typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : "We couldn't process this screening — please try again.";
      } else {
        errorMessage = "We couldn't process this screening — please try again.";
      }
    } else if (error.request) {
      // Backend is unreachable (e.g. server not running or network offline)
      errorMessage =
        "We couldn't process this screening — unable to connect to the backend server. Please verify that the backend is running.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export default screenApiClient;
