export class SFTClient {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    async generate(message, agentName, sessionId, userId) {
        const requestBody = {
            user_message: message,
            agent_name: agentName,
            session_id: sessionId,
            user_id: userId
        };
        
        console.log(`SFTClient - Sending request:`, requestBody);
        
        try {
            const response = await fetch(`${this.baseUrl}/process_message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`SFTClient - Error response: ${response.status}`, errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }
    
            const data = await response.json();
            return data.response.choices[0].message.content;
        } catch (error) {
            console.error('SFTClient - Error:', error);
            throw error;
        }
    }

    async initAgent(agentName, sessionId, userId) {
        try {
            const response = await fetch(`${this.baseUrl}/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_message: "init",
                    agent_name: agentName,
                    session_id: sessionId,
                    user_id: userId
                })
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            return await response.json();
        } catch (error) {
            console.error('SFTClient init error:', error);
            throw error;
        }
    }

    // Retry logic with exponential backoff
    async generateWithRetry(message, agentName, sessionId, userId, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.generate(message, agentName, sessionId, userId);
            } catch (error) {
                console.error(`SFTClient - Attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    console.error(`SFTClient - All ${maxRetries} attempts failed`);
                    throw error;
                }

                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                console.log(`SFTClient - Retry attempt ${attempt + 1} in ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
}

