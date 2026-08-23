import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

const recordsClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
  * Fetches a paginated list of patient screening records for doctor review.
  * 
  * @param {Object} params - { page: number, limit: number, confirmed: boolean | null }
  * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
  */
export async function fetchRecords({ page = 1, limit = 20, confirmed = null } = {}) {
  try {
    const queryParams = { page, limit };
    if (confirmed !== null && confirmed !== undefined) {
      queryParams.confirmed = confirmed;
    }
    const response = await recordsClient.get('/api/records', { params: queryParams });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.detail || 'Failed to fetch screening records.';
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
  * Fetches full details for a single screening record.
  * 
  * @param {number} id - Record ID
  * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
  */
export async function fetchRecordById(id) {
  try {
    const response = await recordsClient.get(`/api/records/${id}`);
    return {
      success: true,
      data: response.data?.record || response.data,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.detail || 'Failed to fetch screening record detail.';
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
  * Updates patient intake details and/or sets the doctor-confirmed diagnosis label.
  * 
  * @param {number} id - Record ID
  * @param {Object} updateData - Partial update payload
  * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
  */
export async function updateRecord(id, updateData) {
  try {
    const response = await recordsClient.patch(`/api/records/${id}`, updateData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.detail || 'Failed to update screening record.';
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export default recordsClient;
