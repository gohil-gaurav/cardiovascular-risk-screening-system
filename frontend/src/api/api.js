import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
    timeout: 45000, // LLM generation can take up to 30-40 seconds
});

export async function submitScreening(patientData) {
    try {
        const response = await api.post("/api/screen", patientData);
        if (response.data) {
            return {
                success: true,
                data: response.data
            };
        }
        throw new Error("No data received from backend");
    } catch (error) {
        let errorMessage = "An unexpected error occurred during screening.";
        
        if (error.code === "ECONNABORTED") {
            errorMessage = "The screening request timed out. The local AI analysis took longer than expected. Please try again.";
        } else if (error.response) {
            // Server responded with an error status code
            const status = error.response.status;
            if (status === 502) {
                errorMessage = "The AI consensus models are temporarily unavailable (502 Bad Gateway). Please ensure the backend and local models are active.";
            } else if (error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            } else {
                errorMessage = `Server error (${status}): Failed to compute risk screening results.`;
            }
        } else if (error.request) {
            // Request was made but no response was received (network failure)
            errorMessage = "Cannot reach the medical screening server. Please verify that your network connection and backend are running.";
        } else {
            errorMessage = error.message || errorMessage;
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}

export default api;