// lib/debateService.ts

class DebateService {
  async getRandomTopic(): Promise<string> {
    try {
      const response = await fetch("http://localhost:8000/random-topic");
      const data = await response.json();
      return data.topic;
    } catch (error) {
      console.error("Error fetching random topic:", error);
      return "Social media has improved human connection"; // fallback topic
    }
  }
}

export const debateService = new DebateService();
